// Patrol unit queries. NOTE: PostGIS ST_MakePoint takes (lng, lat) - longitude FIRST.
const db = require('../config/db');
const pool = db.pool || db;

// Nearest patrol unit to a point. Returns { id, name, phone } or null if there are no units.
async function findNearestPatrolUnit(lng, lat) {
  const { rows } = await pool.query(
    `select id, name, phone
       from patrol_units
      order by geom <-> ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography
      limit 1`,
    [lng, lat]
  );
  return rows[0] || null;
}

// All patrol units for the dashboard map.
async function listPatrolUnits() {
  const { rows } = await pool.query(
    `select id, name, phone,
            ST_Y(geom::geometry) as lat,
            ST_X(geom::geometry) as lng
       from patrol_units
      order by id`
  );
  return rows;
}

module.exports = { findNearestPatrolUnit, listPatrolUnits };
