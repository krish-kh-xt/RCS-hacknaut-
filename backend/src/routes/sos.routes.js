const express = require('express');
const { createSos } = require('../controllers/sos.controller');

const router = express.Router();
router.post('/', createSos); // mounted at /sos

module.exports = router;
