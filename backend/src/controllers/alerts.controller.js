const alertService = require('../services/alert.service');

// GET /alerts?status=open
async function getAlerts(req, res, next) {
  try {
    res.json(await alertService.listAlerts(req.query.status || 'open'));
  } catch (err) {
    next(err);
  }
}

// POST /alerts/:id/resolve
async function resolveAlert(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw alertService.httpError(400, 'invalid alert id');
    await alertService.resolveAlertById(id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAlerts, resolveAlert };
