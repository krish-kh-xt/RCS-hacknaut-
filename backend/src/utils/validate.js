// Small input checks. Throw HttpError(400) on bad input. Shared by Part 1 and Part 2.
const { HttpError } = require('../middleware/errorHandler');

function requireString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, `${name} is required`);
  }
  return value.trim();
}

function requireInt(value, name) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${name} must be a positive integer`);
  return n;
}

function requireNumber(value, name, min, max) {
  const n = typeof value === 'number' ? value : Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(n) || n < min || n > max) {
    throw new HttpError(400, `${name} must be a number between ${min} and ${max}`);
  }
  return n;
}

// Battery is optional: null/undefined is fine, otherwise integer 0..100.
function optionalBattery(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new HttpError(400, 'battery must be 0 to 100 or null');
  return Math.round(n);
}

module.exports = { requireString, requireInt, requireNumber, optionalBattery };
