// PART 1. Saves a heartbeat, switches the trip on, and resolves any open alert (Flow 1, steps 3-4).
// Uses server time for the heartbeat ("at" defaults to now()), which is what the silence worker compares against.
const { pool } = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');

async function recordHeartbeat({ userId, lat, lng, battery }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Sync also sets trip_active = true. Doubles as the "user exists" check.
    const user = await client.query('update users set trip_active = true where id = $1 returning id', [userId]);
    if (user.rowCount === 0) throw new HttpError(404, 'user not found');

    await client.query('insert into heartbeats (user_id, lat, lng, battery) values ($1, $2, $3, $4)', [
      userId,
      lat,
      lng,
      battery,
    ]);

    // The traveller is online again, so any unresolved alert is over.
    const resolved = await client.query(
      `update alerts set status = 'RESOLVED', resolved_at = now()
       where user_id = $1 and status <> 'RESOLVED'`,
      [userId]
    );

    await client.query('COMMIT');
    return { alertResolved: resolved.rowCount > 0 };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { recordHeartbeat };
