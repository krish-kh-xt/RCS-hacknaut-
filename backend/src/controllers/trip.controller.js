// PART 1. POST /trip/start and POST /trip/end
const { asyncHandler } = require('../middleware/errorHandler');
const { requireInt } = require('../utils/validate');
const userService = require('../services/user.service');

exports.startTrip = asyncHandler(async (req, res) => {
  await userService.setTripActive(requireInt(req.body.userId, 'userId'), true);
  res.json({ ok: true });
});

exports.endTrip = asyncHandler(async (req, res) => {
  await userService.setTripActive(requireInt(req.body.userId, 'userId'), false);
  res.json({ ok: true });
});
