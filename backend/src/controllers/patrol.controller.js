const patrolService = require('../services/patrol.service');

// GET /patrol-units
async function getPatrolUnits(req, res, next) {
  try {
    res.json(await patrolService.listPatrolUnits());
  } catch (err) {
    next(err);
  }
}

module.exports = { getPatrolUnits };
