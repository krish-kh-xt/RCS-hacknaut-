// Checks the database the way the backend uses it, and says what is wrong in plain words.
// Use it when the dashboard shows "500" / "server error" or new SOS alerts do not appear.
//
// Run from the repo root (RCS FINAL), after `npm install` in backend/:
//   node db/check.js          checks everything, changes nothing
//   node db/check.js --fix    also adds missing columns (never deletes anything)
//
// Reads DATABASE_URL from backend/.env (or the environment). The password is never printed.
const path = require('path');
const { createRequire } = require('module');

const req = createRequire(path.join(__dirname, '..', 'backend', 'package.json'));
req('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Columns the backend needs (same names as db/schema.sql) and how to add one that is missing.
const EXPECTED = {
  users: { id: 'serial', name: 'text', phone: 'text', emergency_phone: 'text', trip_active: 'boolean default false', created_at: 'timestamptz default now()' },
  places: { id: 'serial', type: 'text', name: 'text', phone: 'text', highway_ref: 'text', geom: 'geography(Point,4326)' },
  heartbeats: { id: 'serial', user_id: 'int', lat: 'double precision', lng: 'double precision', battery: 'int', at: 'timestamptz default now()' },
  alerts: {
    id: 'serial', user_id: 'int', source: 'text', status: 'text', last_lat: 'double precision', last_lng: 'double precision',
    patrol_unit_id: 'int', created_at: 'timestamptz default now()', sms_sent_at: 'timestamptz', escalated_at: 'timestamptz', resolved_at: 'timestamptz',
  },
  patrol_units: { id: 'serial', name: 'text', phone: 'text', geom: 'geography(Point,4326)' },
};

// Which tables / columns are missing? `query` is pool.query (or a fake one in tests).
async function inspectSchema(query) {
  const { rows } = await query(
    `select table_name, column_name from information_schema.columns
      where table_schema = 'public' and table_name = any($1)`,
    [Object.keys(EXPECTED)]
  );
  const have = {};
  rows.forEach((r) => ((have[r.table_name] ||= new Set()).add(r.column_name)));

  const missingTables = [];
  const missingColumns = {};
  const fixes = [];
  for (const [table, cols] of Object.entries(EXPECTED)) {
    if (!have[table]) {
      missingTables.push(table);
      continue;
    }
    for (const [col, def] of Object.entries(cols)) {
      if (!have[table].has(col)) {
        (missingColumns[table] ||= []).push(col);
        // serial cannot be added to an existing table: that case needs the schema re-created.
        if (!def.startsWith('serial')) fixes.push(`alter table ${table} add column if not exists ${col} ${def};`);
      }
    }
  }
  return { ok: missingTables.length === 0 && Object.keys(missingColumns).length === 0, missingTables, missingColumns, fixes };
}

// Plain-words advice for a connection error.
function hintFor(err) {
  const m = `${err.code || ''} ${err.message || ''}`;
  if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH/.test(m))
    return 'This computer cannot reach the database address. The "direct" Supabase address (db.xxxx.supabase.co) needs IPv6, which many networks lack. In Supabase click Connect, copy the "Session pooler" link, and put it in backend/.env as DATABASE_URL.';
  if (/Tenant or user not found/i.test(m))
    return 'With the pooler link the user must be postgres.<project-ref> (copy the whole link from Supabase > Connect), and the project must be the one you seeded.';
  if (/28P01|password authentication failed/i.test(m))
    return 'The password in DATABASE_URL is wrong. Reset it in Supabase (Project Settings > Database), use letters and numbers only, and update backend/.env.';
  if (/max clients|MaxClients|too many (clients|connections)|remaining connection slots/i.test(m))
    return 'The database has no free connections. Close extra copies of the backend (other terminals, a deployed copy on Render) and try again.';
  if (/self.signed|certificate|SSL/i.test(m))
    return 'SSL problem. Use the link exactly as Supabase gives it. If it still fails add ?sslmode=require to the end.';
  if (/Invalid URL|ERR_INVALID_URL/i.test(m))
    return 'DATABASE_URL is not a valid link. A password with symbols such as @ # / : breaks it: reset the password to letters and numbers only.';
  return null;
}

function describeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || '5432'} as user ${decodeURIComponent(u.username)}`;
  } catch {
    return '(could not read the link: it may contain symbols in the password)';
  }
}

async function main() {
  const fix = process.argv.includes('--fix');
  const url = process.env.DATABASE_URL;
  const problems = [];
  const ok = (m) => console.log(`  OK    ${m}`);
  const bad = (m) => { console.log(`  FAIL  ${m}`); problems.push(m); };

  console.log('\nRCS database check\n');
  if (!url) {
    console.log('  FAIL  DATABASE_URL is empty. Put it in backend/.env first.');
    process.exit(1);
  }
  console.log(`Database: ${describeUrl(url)}\n`);

  const { Pool } = req('pg');
  const pool = new Pool({
    connectionString: url,
    ssl: /supabase\.(co|com)/.test(url) ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', () => {});
  const q = (text, params) => pool.query(text, params);

  try {
    // 1. connection
    try {
      await q('select 1');
      ok('connected to the database');
    } catch (err) {
      bad(`cannot connect: ${err.message}`);
      const h = hintFor(err);
      if (h) console.log(`\n  What to do: ${h}`);
      return;
    }

    // 2. PostGIS
    try {
      const { rows } = await q('select postgis_version() as v');
      ok(`PostGIS is on (${String(rows[0].v).split(' ')[0]})`);
    } catch {
      bad('PostGIS is not on. Run in the Supabase SQL Editor: create extension if not exists postgis;');
    }

    // 3. tables and columns
    const schema = await inspectSchema(q);
    if (schema.ok) ok('all 5 tables and every column the backend needs exist');
    schema.missingTables.forEach((t) => bad(`table "${t}" is missing. Run: node db/seed.js --schema`));
    Object.entries(schema.missingColumns).forEach(([t, cols]) => bad(`table "${t}" is missing column(s): ${cols.join(', ')}`));
    if (schema.fixes.length) {
      if (fix) {
        for (const sql of schema.fixes) {
          await q(sql);
          console.log(`        fixed: ${sql}`);
        }
        console.log('        Columns added. Run this check again.');
      } else {
        console.log('\n  These are old tables that lack newer columns. Fix them by running: node db/check.js --fix');
        console.log('  (or paste this into the Supabase SQL Editor):');
        schema.fixes.forEach((s) => console.log(`    ${s}`));
      }
    }

    // 4. data
    if (schema.missingTables.length === 0) {
      console.log('');
      for (const t of Object.keys(EXPECTED)) {
        const { rows } = await q(`select count(*)::int as n from ${t}`);
        console.log(`        ${t.padEnd(13)} ${rows[0].n} rows`);
        if ((t === 'places' || t === 'patrol_units') && rows[0].n === 0) bad(`${t} is empty. Run: node db/seed.js`);
      }
    }

    // 5. exactly what the dashboard asks the backend for
    console.log('');
    const alertService = req('./src/services/alert.service.js');
    const patrolService = req('./src/services/patrol.service.js');
    const tries = [
      ['dashboard: open alerts', () => alertService.listAlerts('open')],
      ['dashboard: resolved alerts', () => alertService.listAlerts('resolved')],
      ['dashboard: patrol units', () => patrolService.listPatrolUnits()],
    ];
    for (const [label, run] of tries) {
      try {
        const rows = await run();
        ok(`${label} (${rows.length} found)`);
      } catch (err) {
        bad(`${label} FAILED: ${err.message}`);
      }
    }

    // 6. newest alerts: proves whether an SOS reached the database
    if (!schema.missingTables.includes('alerts') && !schema.missingColumns.alerts) {
      const { rows } = await q(
        `select a.id, a.source, a.status, a.last_lat, a.last_lng, a.created_at, u.name
           from alerts a left join users u on u.id = a.user_id order by a.created_at desc limit 5`
      );
      console.log('\n  Newest alerts in the database:');
      if (rows.length === 0) console.log('        none yet (an SOS that reached this database would be listed here)');
      rows.forEach((r) =>
        console.log(`        #${r.id} ${r.source}/${r.status} ${r.name || '?'} at ${r.last_lat},${r.last_lng} (${new Date(r.created_at).toISOString()})`)
      );
    }

    // 7. connection use
    try {
      const { rows } = await q('select count(*)::int as n from pg_stat_activity where datname = current_database()');
      console.log(`\n        open connections to this database: ${rows[0].n}`);
    } catch {
      // not allowed on every plan: ignore
    }
  } catch (err) {
    bad(`check stopped: ${err.message}`);
    const h = hintFor(err);
    if (h) console.log(`\n  What to do: ${h}`);
  } finally {
    await pool.end().catch(() => {});
    try {
      await req('./src/config/db.js').pool.end();
    } catch {
      // backend pool was never opened
    }
    console.log(problems.length ? `\n${problems.length} problem(s) found. Fix the FAIL lines above, then run this again.\n` : '\nAll checks passed. If the dashboard still shows an error, the dashboard and the traveller app may be using different backends (compare VITE_API_URL in both .env files).\n');
    process.exitCode = problems.length ? 1 : 0;
  }
}

module.exports = { inspectSchema, hintFor, EXPECTED };
if (require.main === module) main();
