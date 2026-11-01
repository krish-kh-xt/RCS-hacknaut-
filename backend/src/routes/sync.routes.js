// PART 1
const router = require('express').Router();
const c = require('../controllers/sync.controller');

router.post('/sync', c.sync);

module.exports = router;
