// PART 1. POST /sync  (heartbeat + prefetch)
const { asyncHandler } = require('../middleware/errorHandler');
const { requireInt, requireNumber, optionalBattery } = require('../utils/validate');
const { recordHeartbeat } = require('../services/heartbeat.service');
const { getNearbyPlaces } = require('../services/places.service');

exports.sync = asyncHandler(async (req, res) => {
  const userId = requireInt(req.body.userId, 'userId');
  const lat = requireNumber(req.body.lat, 'lat', -90, 90);
  const lng = requireNumber(req.body.lng, 'lng', -180, 180);
  const battery = optionalBattery(req.body.battery);
  // req.body.timestamp is accepted but ignored: the server clock is used so silence detection is reliable.

  const { alertResolved } = await recordHeartbeat({ userId, lat, lng, battery });
  const places = await getNearbyPlaces(lat, lng);

  res.json({ ok: true, alertResolved, places });
});
