// PART 1. SQL for users and trip on/off.
const { query } = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');

// Creates the user, or returns the existing one with the same phone.
async function createOrGetUser({ name, phone, emergencyPhone }) {
  const { rows } = await query(
    `insert into users (name, phone, emergency_phone)
     values ($1, $2, $3)
     on conflict (phone) do update
       set name = excluded.name, emergency_phone = excluded.emergency_phone
     returning id`,
    [name, phone, emergencyPhone]
  );
  return rows[0].id;
}

// Turns silence monitoring on or off for one user.
async function setTripActive(userId, active) {
  const { rowCount } = await query('update users set trip_active = $2 where id = $1', [userId, active]);
  if (rowCount === 0) throw new HttpError(404, 'user not found');
}

module.exports = { createOrGetUser, setTripActive };
