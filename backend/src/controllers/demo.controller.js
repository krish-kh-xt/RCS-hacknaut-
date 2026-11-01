const alertService = require('../services/alert.service');

function parseUserId(req) {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId)) throw alertService.httpError(400, 'invalid userId');
  return userId;
}

// POST /demo/silence/:userId - makes the user look silent; the worker fires on its next run.
async function demoSilence(req, res, next) {
  try {
    await alertService.simulateSilence(parseUserId(req));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /demo/reply/:userId - same resolve logic as a real "OK" SMS reply.
async function demoReply(req, res, next) {
  try {
    const resolved = await alertService.resolveOpenAlertsForUser(parseUserId(req));
    res.json({ ok: true, resolved });
  } catch (err) {
    next(err);
  }
}

// POST /demo/reset - deletes alerts and heartbeats.
async function demoReset(req, res, next) {
  try {
    await alertService.resetDemo();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { demoSilence, demoReply, demoReset };
