// Loads db/data/*.json into the places and patrol_units tables.
// Safe to run twice: it clears those two tables first (users, heartbeats and alerts are NOT touched).
//
// Run from the repo root:
//   node db/seed.js              -> seed only
//   node db/seed.js --schema     -> run db/schema.sql first, then seed (no psql needed)
//
// Reads DATABASE_URL from backend/.env and uses the pg package installed in backend/.
const fs = require('fs');
const path = require('path');

function load(name) {
  try {
    return require(name);
  } catch (e) {
    return require(path.join(__dirname, '..', 'backend', 'node_modules', name));
  }
}
load('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { Pool } = load('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is empty. Fill it in backend/.env first.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
});

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'));

function check(row, file) {
  const ok =
    row.name &&
    Number.isFinite(row.lat) && row.lat >= -90 && row.lat <= 90 &&
    Number.isFinite(row.lng) && row.lng >= -180 && row.lng <= 180;
  if (!ok) throw new Error(`Bad row in ${file}: ${JSON.stringify(row)} (needs name, lat, lng)`);
}

// ST_MakePoint(lng, lat): LONGITUDE FIRST.
const POINT = 'ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography';

async function main() {
  if (process.argv.includes('--schema')) {
    await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    console.log('schema.sql applied');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('delete from places');
    await client.query('delete from patrol_units');
    await client.query('alter sequence places_id_seq restart with 1');
    await client.query('alter sequence patrol_units_id_seq restart with 1');

    const sets = [
      ['hospital', 'hospitals.json'],
      ['police', 'police.json'],
      ['highway', 'highways.json'],
    ];
    for (const [type, file] of sets) {
      for (const r of readJson(file)) {
        check(r, file);
        await client.query(
          `insert into places (type, name, phone, highway_ref, geom) values ($3, $4, $5, $6, ${POINT})`,
          [r.lng, r.lat, type, r.name, r.phone || '', type === 'highway' ? r.highway_ref || null : null]
        );
      }
    }
    for (const r of readJson('patrol_units.json')) {
      check(r, 'patrol_units.json');
      await client.query(`insert into patrol_units (name, phone, geom) values ($3, $4, ${POINT})`, [
        r.lng, r.lat, r.name, r.phone || '',
      ]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const counts = await pool.query('select type, count(*) from places group by type order by type');
  const patrol = await pool.query('select count(*) from patrol_units');
  console.log('places:', counts.rows.map((r) => `${r.type}=${r.count}`).join(', '));
  console.log('patrol_units:', patrol.rows[0].count);

  // Sanity check: nearest 3 places to lat 31.2, lng 76.5 should be near Anandpur Sahib / Kiratpur.
  const near = await pool.query(
    'select name from places order by geom <-> ST_SetSRID(ST_MakePoint(76.5, 31.2), 4326)::geography limit 3'
  );
  console.log('nearest to (31.2, 76.5):', near.rows.map((r) => r.name));
}

main()
  .catch((err) => {
    console.error('seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
