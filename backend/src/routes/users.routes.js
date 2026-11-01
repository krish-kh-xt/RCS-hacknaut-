// PART 1
const router = require('express').Router();
const c = require('../controllers/users.controller');

router.post('/users', c.createUser);

module.exports = router;
