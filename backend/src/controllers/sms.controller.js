const alertService = require('../services/alert.service');

// POST /sms/reply   body: { from, message }   ->   { ok: true }
// Gateways name these fields differently, so a few common aliases are accepted.
async function smsReply(req, res, next) {
  try {
    const b = req.body || {};
    const from = b.from || b.sender || b.mobile || b.msisdn;
    const message = b.message || b.text || b.body || b.content;
    if (!from) throw alertService.httpError(400, 'from is required');
    await alertService.resolveByPhoneReply(from, message);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { smsReply };
