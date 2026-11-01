const express = require('express');
const { smsReply } = require('../controllers/sms.controller');

const router = express.Router();
router.post('/reply', smsReply);

module.exports = router; // mounted at /sms
