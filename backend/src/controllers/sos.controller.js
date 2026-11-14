const alertService = require('../services/alert.service');
const { requireInt, requireNumber } = require('../utils/validate');

// POST /sos   body: { userId, lat, lng }   ->   { alertId }
async function createSos(req, res, next) {
  try {
    const userId = requireInt(req.body.userId, 'userId');
    const lat = requireNumber(req.body.lat, 'lat', -90, 90);
    const lng = requireNumber(req.body.lng, 'lng', -180, 180);
    const alertId = await alertService.createSosAlert({ userId, lat, lng });
    res.json({ alertId });
  } catch (err) {
    next(err);
  }
}

module.exports = { createSos };
