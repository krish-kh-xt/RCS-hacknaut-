const express = require('express');
const { getPatrolUnits } = require('../controllers/patrol.controller');

const router = express.Router();
router.get('/', getPatrolUnits);

module.exports = router; // mounted at /patrol-units
