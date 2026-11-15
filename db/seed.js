// Loads db/data/*.json into the database (tables places and patrol_units).
//
// Run from the repo root (RCS FINAL):
//   node db/seed.js --schema     creates / updates the tables first, then loads the data
//   node db/seed.js              loads the data only
//
// Reads DATABASE_URL from backend/.env (or from the environment). Safe to re-run: it clears and
// reloads ONLY places and patrol_units. Users, heartbeats and alerts are never touched.
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

// pg and dotenv are installed in backend/, so load them from there.
const req = createRequire(path.join(__dirname, '..', 'backend', 'package.json'));
const { Pool } = req('pg');
req('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const FILES = [
  { file: 'hospitals.json', type: 'hospital' },
  { file: 'police.json', type: 'police' },
  { file: 'highways.json', type: 'highway' },
  { file: 'fuel.json', type: 'fuel', optional: true },
];

function readRows(file, optional) {
  const full = path.join(__dirname, 'data', file);
  if (!fs.existsSync(full)) {
    if (!optional) throw new Error(`Missing ${full}`);
    console.log(`  ${file}: not found, skipped`);
    return [];
  }
  const rows = JSON.parse(fs.readFileSync(full, 'utf8'));
  return rows.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}

// Inserts rows in chunks. Each row becomes: (name, phone, geom[, type, highway_ref]).
async function insertChunks(client, table, cols, rows, toValues) {
  const SIZE = 500;
  for (let i = 0; i < rows.length; i += SIZE) {
    const chunk = rows.slice(i, i + SIZE);
    const params = [];
    const tuples = chunk.map((r) => {
      const v = toValues(r);
      const ph = v.map((x) => {
        params.push(x);
        return `$${params.length}`;
      });
      // Last two values are lng, lat: they become the PostGIS point (LONGITUDE FIRST).
      const lngP = ph[ph.length - 2];
      const latP = ph[ph.length - 1];
      return `(${ph.slice(0, -2).join(', ')}, ST_SetSRID(ST_MakePoint(${lngP}::float8, ${latP}::float8), 4326)::geography)`;
    });
    await client.query(`insert into ${table} (${cols}) values ${tuples.join(', ')}`, params);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Put it in backend/.env first.');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: url,
    ssl: /supabase\.(co|com)/.test(url) ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();
  try {
    if (process.argv.includes('--schema')) {
      console.log('Applying schema.sql ...');
      await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    }
    console.log('Reading data files ...');
    const places = [];
    for (const { file, type, optional } of FILES) {
      const rows = readRows(file, optional);
      console.log(`  ${file}: ${rows.length} rows`);
      rows.forEach((r) => places.push({ ...r, type }));
    }
    const patrol = readRows('patrol_units.json', false);
    console.log(`  patrol_units.json: ${patrol.length} rows`);

    await client.query('begin');
    await client.query('delete from places');
    await client.query('delete from patrol_units');
    await insertChunks(client, 'places', 'type, name, phone, highway_ref, geom', places, (r) => [
      r.type, r.name || null, r.phone || null, r.type === 'highway' ? r.highway_ref || null : null, r.lng, r.lat,
    ]);
    await insertChunks(client, 'patrol_units', 'name, phone, geom', patrol, (r) => [
      r.name || null, r.phone || null, r.lng, r.lat,
    ]);
    await client.query('commit');

    const { rows } = await client.query('select type, count(*)::int as n from places group by type order by type');
    console.log('\nLoaded into the database:');
    rows.forEach((r) => console.log(`  places / ${r.type}: ${r.n}`));
    console.log(`  patrol_units: ${patrol.length}`);
  } catch (e) {
    await client.query('rollback').catch(() => {});
    console.error('\nSeed failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}
main();
