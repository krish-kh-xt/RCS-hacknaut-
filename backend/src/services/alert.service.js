// Alert logic: creating, listing, escalating and resolving alerts.
// Status flow: SMS_SENT -> ESCALATED -> RESOLVED   (an SOS starts directly at ESCALATED)
// NOTE: PostGIS ST_MakePoint takes (lng, lat) - longitude FIRST (handled inside patrol.service).
const db = require('../config/db');
const pool = db.pool || db;
const { findNearestPatrolUnit } = require('./patrol.service');
const { sendSms } = require('./sms.service');

// Errors with a status code. The shared errorHandler should reply { error: err.message }
// with status err.status (falling back to 500).
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const escalateAfterMin = () => Number(process.env.ESCALATE_AFTER_MIN || 10);
const silenceLimitMin = () => Number(process.env.SILENCE_LIMIT_MIN || 60);

const mapsLink = (lat, lng) => `https://maps.google.com/?q=${lat},${lng}`;

// ---------------------------------------------------------------- reading

// For the dashboard. status: "open" (not RESOLVED), "all", or an exact status name.
async function listAlerts(status) {
  const where =
    status === 'open' || !status
      ? `a.status <> 'RESOLVED'`
      : status === 'all'
      ? 'true'
      : `a.status = $1`;
  const params = where.includes('$1') ? [String(status).toUpperCase()] : [];

  const { rows } = await pool.query(
    `select a.id, a.user_id, a.source, a.status, a.last_lat, a.last_lng,
            a.created_at, a.patrol_unit_id,
            u.name, u.phone, u.emergency_phone,
            coalesce(h.at, a.created_at) as last_seen
       from alerts a
       join users u on u.id = a.user_id
       left join lateral (select at from heartbeats
                           where user_id = a.user_id
                           order by at desc limit 1) h on true
      where ${where}
      order by a.created_at desc`,
    params
  );

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    phone: r.phone,
    emergencyPhone: r.emergency_phone,
    source: r.source,
    status: r.status,
    lastLat: r.last_lat,
    lastLng: r.last_lng,
    lastSeen: new Date(r.last_seen).toISOString(),
    createdAt: new Date(r.created_at).toISOString(),
    patrolUnitId: r.patrol_unit_id,
  }));
}

// ---------------------------------------------------------------- resolving

// Resolve every unresolved alert of a user. Returns how many were resolved.
// Part 1's /sync can also call this instead of writing its own SQL.
async function resolveOpenAlertsForUser(userId) {
  const { rowCount } = await pool.query(
    `update alerts
        set status = 'RESOLVED', resolved_at = now()
      where user_id = $1 and status <> 'RESOLVED'`,
    [userId]
  );
  return rowCount;
}

// Patrol presses "Mark resolved". Already-resolved alerts are fine (idempotent).
async function resolveAlertById(id) {
  const { rowCount } = await pool.query(
    `update alerts
        set status = 'RESOLVED', resolved_at = now()
      where id = $1 and status <> 'RESOLVED'`,
    [id]
  );
  if (rowCount === 0) {
    const { rows } = await pool.query('select 1 from alerts where id = $1', [id]);
    if (rows.length === 0) throw httpError(404, 'alert not found');
  }
  return true;
}

// SMS reply from the gateway. Only "OK" (any case, trimmed) cancels the alarm.
// Unknown numbers are ignored quietly so the gateway does not keep retrying.
async function resolveByPhoneReply(phone, message) {
  const text = String(message || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  if (text !== 'OK') return { resolved: 0 };

  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length < 10) throw httpError(400, 'invalid phone');

  // Compare the last 10 digits so +91 / 91 / no prefix all match.
  const { rows } = await pool.query(
    `select id from users
      where right(regexp_replace(phone, '\\D', '', 'g'), 10) = $1`,
    [digits]
  );

  let resolved = 0;
  for (const u of rows) resolved += await resolveOpenAlertsForUser(u.id);
  return { resolved };
}

// ---------------------------------------------------------------- creating

// SOS button. If the user already has an unresolved alert, upgrade it to an SOS
// instead of creating a duplicate (also makes retries from the offline queue safe).
async function createSosAlert({ userId, lat, lng }) {
  const user = await pool.query('select id, name, phone, emergency_phone from users where id = $1', [userId]);
  if (user.rows.length === 0) throw httpError(404, 'user not found');

  const unit = await findNearestPatrolUnit(lng, lat);

  const existing = await pool.query(
    `select id from alerts where user_id = $1 and status <> 'RESOLVED'
      order by created_at desc limit 1`,
    [userId]
  );

  let alertId;
  if (existing.rows.length) {
    alertId = existing.rows[0].id;
    await pool.query(
      `update alerts
          set source = 'SOS', status = 'ESCALATED', last_lat = $2, last_lng = $3,
              patrol_unit_id = $4, escalated_at = coalesce(escalated_at, now())
        where id = $1`,
      [alertId, lat, lng, unit ? unit.id : null]
    );
  } else {
    const ins = await pool.query(
      `insert into alerts (user_id, source, status, last_lat, last_lng, patrol_unit_id, escalated_at)
       values ($1, 'SOS', 'ESCALATED', $2, $3, $4, now())
       returning id`,
      [userId, lat, lng, unit ? unit.id : null]
    );
    alertId = ins.rows[0].id;
  }

  await notifyPatrol(unit, user.rows[0], lat, lng, new Date(), 'SOS pressed');
  return alertId;
}

// Worker: silence detected -> create alert (SMS_SENT) and send "Are you safe?".
async function createSilenceAlert({ userId, phone, lat, lng }) {
  const { rows } = await pool.query(
    `insert into alerts (user_id, source, status, last_lat, last_lng, sms_sent_at)
     values ($1, 'SILENCE', 'SMS_SENT', $2, $3, now())
     returning id`,
    [userId, lat, lng]
  );
  const alertId = rows[0].id;

  try {
    await sendSms(phone, `Are you safe? Reply OK within ${escalateAfterMin()} minutes.`);
  } catch (err) {
    // The alert still exists and will escalate even if the SMS failed.
    console.error(`[alert ${alertId}] could not send safety SMS:`, err.message);
  }
  return alertId;
}

// Worker: no reply in time -> assign nearest patrol unit and mark ESCALATED.
// Returns false if the alert was resolved in the meantime (user replied).
async function escalateAlert(alertId) {
  const cur = await pool.query(
    `select a.id, a.last_lat, a.last_lng, a.user_id,
            u.name, u.phone, u.emergency_phone,
            coalesce(h.at, a.created_at) as last_seen
       from alerts a
       join users u on u.id = a.user_id
       left join lateral (select at from heartbeats
                           where user_id = a.user_id order by at desc limit 1) h on true
      where a.id = $1 and a.status = 'SMS_SENT'`,
    [alertId]
  );
  if (cur.rows.length === 0) return false;
  const a = cur.rows[0];

  const unit = await findNearestPatrolUnit(a.last_lng, a.last_lat);

  // Guard on status again so a reply that arrives right now wins.
  const upd = await pool.query(
    `update alerts
        set status = 'ESCALATED', patrol_unit_id = $2, escalated_at = now()
      where id = $1 and status = 'SMS_SENT'`,
    [alertId, unit ? unit.id : null]
  );
  if (upd.rowCount === 0) return false;

  await notifyPatrol(unit, a, a.last_lat, a.last_lng, a.last_seen, 'No reply to safety SMS');
  return true;
}

// SMS to the patrol unit: name, last location, last-seen time, emergency contact.
async function notifyPatrol(unit, user, lat, lng, lastSeen, reason) {
  if (!unit || !unit.phone) return;
  const text =
    `RCS ALERT (${reason}): ${user.name || 'Traveller'} ${user.phone}. ` +
    `Last location: ${mapsLink(lat, lng)} (seen ${new Date(lastSeen).toISOString()}). ` +
    `Emergency contact: ${user.emergency_phone || 'n/a'}.`;
  try {
    await sendSms(unit.phone, text);
  } catch (err) {
    console.error('could not notify patrol unit:', err.message);
  }
}

// ---------------------------------------------------------------- worker queries

// Users on a trip whose newest heartbeat is older than the limit and who have no unresolved alert.
async function findSilentUsers() {
  const { rows } = await pool.query(
    `select u.id as user_id, u.phone, h.lat, h.lng
       from users u
       join lateral (select lat, lng, at from heartbeats
                      where user_id = u.id order by at desc limit 1) h on true
      where u.trip_active = true
        and h.at < now() - ($1::float * interval '1 minute')
        and not exists (select 1 from alerts a
                         where a.user_id = u.id and a.status <> 'RESOLVED')`,
    [silenceLimitMin()]
  );
  return rows;
}

// SMS_SENT alerts that have waited longer than ESCALATE_AFTER_MIN.
async function findAlertsDueForEscalation() {
  const { rows } = await pool.query(
    `select id from alerts
      where status = 'SMS_SENT'
        and sms_sent_at < now() - ($1::float * interval '1 minute')`,
    [escalateAfterMin()]
  );
  return rows;
}

// ---------------------------------------------------------------- demo helpers

// Make the user look silent so the worker fires on its next run.
// Sets the newest heartbeat to (SILENCE_LIMIT_MIN + 1) minutes ago and makes sure the trip is active.
async function simulateSilence(userId) {
  const mins = silenceLimitMin() + 1;
  const { rowCount } = await pool.query(
    `update heartbeats
        set at = least(at, now() - ($2::float * interval '1 minute'))
      where id = (select id from heartbeats where user_id = $1 order by at desc limit 1)`,
    [userId, mins]
  );
  if (rowCount === 0) throw httpError(404, 'no heartbeat for this user - start a trip and sync first');
  await pool.query('update users set trip_active = true where id = $1', [userId]);
  return true;
}

// Wipe alerts and heartbeats so the demo can be run again.
async function resetDemo() {
  await pool.query('delete from alerts');
  await pool.query('delete from heartbeats');
  return true;
}

module.exports = {
  httpError,
  listAlerts,
  resolveOpenAlertsForUser,
  resolveAlertById,
  resolveByPhoneReply,
  createSosAlert,
  createSilenceAlert,
  escalateAlert,
  findSilentUsers,
  findAlertsDueForEscalation,
  simulateSilence,
  resetDemo,
};
