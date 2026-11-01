// Reads .env once and exports clean, typed settings. Shared by Part 1 and Part 2.
require('dotenv').config();

const num = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

module.exports = {
  port: num(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL || '',
  smsMode: process.env.SMS_MODE || 'mock',
  smsApiKey: process.env.SMS_API_KEY || '',
  silenceLimitMin: num(process.env.SILENCE_LIMIT_MIN, 60),
  escalateAfterMin: num(process.env.ESCALATE_AFTER_MIN, 10),
  nearbyRadiusM: num(process.env.NEARBY_RADIUS_M, 30000),
  demoMode: process.env.DEMO_MODE === 'true',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
