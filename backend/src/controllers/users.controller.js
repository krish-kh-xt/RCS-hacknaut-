// PART 1. POST /users
const { asyncHandler } = require('../middleware/errorHandler');
const { requireString } = require('../utils/validate');
const userService = require('../services/user.service');

exports.createUser = asyncHandler(async (req, res) => {
  const name = requireString(req.body.name, 'name');
  const phone = requireString(req.body.phone, 'phone');
  const emergencyPhone = requireString(req.body.emergencyPhone, 'emergencyPhone');
  const userId = await userService.createOrGetUser({ name, phone, emergencyPhone });
  res.json({ userId });
});
