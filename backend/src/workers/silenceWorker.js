// Silence worker: runs every minute inside the backend process.
//   1. Silent users (trip active, no heartbeat for SILENCE_LIMIT_MIN, no open alert)
//      -> create alert SMS_SENT + send "Are you safe?" SMS
//   2. Alerts waiting longer than ESCALATE_AFTER_MIN -> ESCALATED with nearest patrol unit
// Every item is wrapped in try/catch so one bad row never stops the whole run.
const cron = require('node-cron');
const alertService = require('../services/alert.service');

let running = false; // stops two runs from overlapping if one is slow

async function runOnce() {
  if (running) return;
  running = true;
  try {
    // Step 1: silence detection
    let silent = [];
    try {
      silent = await alertService.findSilentUsers();
    } catch (err) {
      console.error('[worker] silent user query failed:', err.message);
    }
    for (const u of silent) {
      try {
        const id = await alertService.createSilenceAlert({
          userId: u.user_id,
          phone: u.phone,
          lat: u.lat,
          lng: u.lng,
        });
        console.log(`[worker] silence alert ${id} created for user ${u.user_id}`);
      } catch (err) {
        console.error(`[worker] failed for user ${u.user_id}:`, err.message);
      }
    }

    // Step 2: escalation
    let due = [];
    try {
      due = await alertService.findAlertsDueForEscalation();
    } catch (err) {
      console.error('[worker] escalation query failed:', err.message);
    }
    for (const a of due) {
      try {
        const escalated = await alertService.escalateAlert(a.id);
        if (escalated) console.log(`[worker] alert ${a.id} escalated`);
      } catch (err) {
        console.error(`[worker] failed to escalate alert ${a.id}:`, err.message);
      }
    }
  } finally {
    running = false;
  }
}

// Call once from server.js:  require('./workers/silenceWorker').startSilenceWorker();
function startSilenceWorker() {
  cron.schedule('* * * * *', runOnce);
  console.log('[worker] silence worker started (every minute)');
}

module.exports = { startSilenceWorker, runOnce };
