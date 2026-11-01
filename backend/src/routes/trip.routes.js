// PART 1
const router = require('express').Router();
const c = require('../controllers/trip.controller');

router.post('/trip/start', c.startTrip);
router.post('/trip/end', c.endTrip);

module.exports = router;
