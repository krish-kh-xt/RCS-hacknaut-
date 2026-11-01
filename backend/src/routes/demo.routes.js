const express = require('express');
const { demoSilence, demoReply, demoReset } = require('../controllers/demo.controller');

const router = express.Router();

// Demo routes only exist when DEMO_MODE=true (checked on every request).
router.use((req, res, next) => {
  if (process.env.DEMO_MODE !== 'true') return res.status(404).json({ error: 'not found' });
  next();
});

router.post('/silence/:userId', demoSilence);
router.post('/reply/:userId', demoReply);
router.post('/reset', demoReset);

module.exports = router; // mounted at /demo
