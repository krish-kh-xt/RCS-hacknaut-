const express = require('express');
const { getAlerts, resolveAlert } = require('../controllers/alerts.controller');

const router = express.Router();
router.get('/', getAlerts); // GET  /alerts?status=open
router.post('/:id/resolve', resolveAlert); // POST /alerts/:id/resolve

module.exports = router; // mounted at /alerts
