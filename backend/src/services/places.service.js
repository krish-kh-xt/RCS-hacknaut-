// PART 1. Nearest help for /sync (Flow 1, step 5).
// ST_MakePoint takes LONGITUDE FIRST.
const { query } = require('../config/db');
const config = require('../config/env');

const LIMIT = 15;
const POINT = 'ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography';

// type is one of: hospital, police, highway
async function nearestOfType(lng, lat, type) {
  const { rows } = await query(
    `select id, type, name, coalesce(phone, '') as phone, highway_ref as "highwayRef",
            ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng,
            ST_Distance(geom, ${POINT}) as dist
     from places
     where type = $3
       and ST_DWithin(geom, ${POINT}, $4::float8)
     order by geom <-> ${POINT}
     limit ${LIMIT}`,
    [lng, lat, type, config.nearbyRadiusM]
  );
  return rows;
}

// Patrolling units live in patrol_units and go to the phone as type "patrol".
async function nearestPatrol(lng, lat) {
  const { rows } = await query(
    `select id, 'patrol' as type, name, coalesce(phone, '') as phone, null::text as "highwayRef",
            ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lng,
            ST_Distance(geom, ${POINT}) as dist
     from patrol_units
     where ST_DWithin(geom, ${POINT}, $3::float8)
     order by geom <-> ${POINT}
     limit ${LIMIT}`,
    [lng, lat, config.nearbyRadiusM]
  );
  return rows;
}

// Returns up to 15 of each type within the radius, all sorted by distance.
async function getNearbyPlaces(lat, lng) {
  const groups = await Promise.all([
    nearestOfType(lng, lat, 'hospital'),
    nearestOfType(lng, lat, 'police'),
    nearestOfType(lng, lat, 'highway'),
    nearestPatrol(lng, lat),
  ]);
  return groups
    .flat()
    .sort((a, b) => a.dist - b.dist)
    .map(({ dist, ...place }) => place); // dist is only for sorting, not part of the contract
}

module.exports = { getNearbyPlaces };
