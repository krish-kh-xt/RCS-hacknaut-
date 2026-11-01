const alertService = require('../services/alert.service');

// POST /sos   body: { userId, lat, lng }   ->   { alertId }
async function createSos(req, res, next) {
  try {
    const userId = Number(req.body.userId);
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    if (!Number.isInteger(userId) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw alertService.httpError(400, 'userId, lat and lng are required numbers');
    }
    const alertId = await alertService.createSosAlert({ userId, lat, lng });
    res.json({ alertId });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSos };
