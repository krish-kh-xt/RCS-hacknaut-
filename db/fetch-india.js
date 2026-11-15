// Downloads REAL hospitals, police stations and highway help points from OpenStreetMap (Overpass API)
// for the Indian states you name, and writes db/data/*.json.
// Police stations are ALSO written to patrol_units.json, so "nearest patrol unit" = the nearest real
// police station (patrol vehicles are dispatched from stations).
//
// Needs internet. Run from the repo root (RCS FINAL):
//   node db/fetch-india.js Ludhiana Chandigarh          (small cities: fast, recommended first)
//   node db/fetch-india.js Punjab Haryana "Himachal Pradesh"
//   node db/fetch-india.js --all          (all states, takes a long time)
// Then load it:  node db/seed.js
const fs = require('fs');
const path = require('path');

const STATES = {
  'andhra pradesh': 'IN-AP', 'arunachal pradesh': 'IN-AR', 'assam': 'IN-AS', 'bihar': 'IN-BR',
  'chhattisgarh': 'IN-CT', 'goa': 'IN-GA', 'gujarat': 'IN-GJ', 'haryana': 'IN-HR',
  'himachal pradesh': 'IN-HP', 'jharkhand': 'IN-JH', 'karnataka': 'IN-KA', 'kerala': 'IN-KL',
  'madhya pradesh': 'IN-MP', 'maharashtra': 'IN-MH', 'manipur': 'IN-MN', 'meghalaya': 'IN-ML',
  'mizoram': 'IN-MZ', 'nagaland': 'IN-NL', 'odisha': 'IN-OR', 'punjab': 'IN-PB',
  'rajasthan': 'IN-RJ', 'sikkim': 'IN-SK', 'tamil nadu': 'IN-TN', 'telangana': 'IN-TG',
  'tripura': 'IN-TR', 'uttar pradesh': 'IN-UP', 'uttarakhand': 'IN-UT', 'west bengal': 'IN-WB',
  'delhi': 'IN-DL', 'chandigarh': 'IN-CH', 'jammu and kashmir': 'IN-JK', 'ladakh': 'IN-LA',
  'puducherry': 'IN-PY',
};

// Small areas (south,west,north,east). Much lighter for the free server than a whole state.
const CITIES = {
  'ludhiana': '30.75,75.65,31.05,76.05',
  'chandigarh': '30.62,76.65,30.82,76.90', // includes Mohali and Panchkula
  'amritsar': '31.54,74.76,31.74,74.98',
  'jalandhar': '31.24,75.48,31.42,75.68',
  'patiala': '30.27,76.30,30.41,76.47',
};

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query) {
  let lastErr;
  // Try every server in turn; give each at most 90 seconds (4 minutes for a whole state), so nothing hangs silently.
  for (let attempt = 0; attempt < MIRRORS.length * 2; attempt++) {
    const url = MIRRORS[attempt % MIRRORS.length];
    const host = new URL(url).hostname;
    try {
      console.log(`   trying ${host} ...`);
      const res = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(query.includes('area[') ? 240000 : 90000), // whole states need longer than city boxes
      });
      if (res.ok) return (await res.json()).elements || [];
      lastErr = new Error(`Overpass error ${res.status}`);
      console.log(`   ${host} said ${res.status}, switching server`);
    } catch (e) {
      lastErr = e;
      console.log(`   ${host} did not answer (${e.name === 'TimeoutError' ? 'too slow' : e.message}), switching server`);
    }
    await sleep(3000);
  }
  throw lastErr;
}

// region is either a city box like '30.75,75.65,31.05,76.05' or a state code like 'IN-PB'.
const areaQuery = (region, filter) =>
  /^IN-/.test(region)
    ? `[out:json][timeout:240];area["ISO3166-2"="${region}"]->.a;(${filter.map((f) => `nwr${f}(area.a);`).join('')});out center tags;`
    : `[out:json][timeout:240];(${filter.map((f) => `nwr${f}(${region});`).join('')});out center tags;`;

function cleanPhone(tags, fallback) {
  const raw = (tags && (tags.phone || tags['contact:phone'] || tags['phone:mobile'])) || '';
  const first = String(raw).split(/[;,/]/)[0].trim();
  return first || fallback;
}

function toRows(elements, defaultName, fallbackPhone, extra) {
  const out = [];
  for (const e of elements) {
    const lat = e.lat ?? (e.center && e.center.lat);
    const lng = e.lon ?? (e.center && e.center.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const t = e.tags || {};
    const row = {
      name: t.name || t['name:en'] || defaultName,
      phone: cleanPhone(t, fallbackPhone),
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
    };
    if (extra) Object.assign(row, extra(t));
    out.push(row);
  }
  return out;
}

function dedupe(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.name}|${r.lat.toFixed(4)}|${r.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Keeps one point per highway per ~3 km square, so a long highway becomes a sensible number of rows.
function thin(rows, cell = 0.03) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.highway_ref}|${Math.round(r.lat / cell)}|${Math.round(r.lng / cell)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const names = args.includes('--all') ? Object.keys(STATES) : args.map((a) => a.toLowerCase());
  if (!names.length) {
    console.error('Give city or state names, e.g.  node db/fetch-india.js Ludhiana Chandigarh');
    process.exit(1);
  }
  const regionOf = (n) => CITIES[n] || STATES[n];
  const bad = names.filter((n) => !regionOf(n));
  if (bad.length) {
    console.error('Unknown name(s):', bad.join(', '), '\nCities:', Object.keys(CITIES).join(', '), '\nStates:', Object.keys(STATES).join(', '));
    process.exit(1);
  }

  let hospitals = [], police = [], highways = [], fuel = [];
  const failed = [];
  for (const name of names) {
    const iso = regionOf(name);
    try {
      console.log(`\n[${name}] hospitals...`);
      hospitals.push(...toRows(await overpass(areaQuery(iso, ['["amenity"="hospital"]'])), 'Hospital', '108'));
      await sleep(2000);
      console.log(`[${name}] police...`);
      police.push(...toRows(await overpass(areaQuery(iso, ['["amenity"="police"]'])), 'Police station', '112'));
      await sleep(2000);
      console.log(`[${name}] highway points...`);
      highways.push(
        ...toRows(
          await overpass(
            areaQuery(iso, [
              '["barrier"="toll_booth"]',
              '["highway"="emergency_access_point"]',
              '["emergency"="phone"]',
              // the national and state highways themselves (one point per road segment)
              '["highway"~"^(motorway|trunk|primary)$"]["ref"~"^(NH|SH)"]',
            ])
          ),
          'Highway help point', '1033',
          (t) => {
            const ref = String(t.ref || t.highway_ref || '').split(';')[0].trim();
            const isRoad = /^(motorway|trunk|primary)$/.test(t.highway || '');
            const row = { highway_ref: ref || 'NH' };
            if (isRoad) row.name = `${ref || 'Highway'}${t.name ? ' - ' + t.name : ''}`; // e.g. "NH 44 - GT Road"
            return row;
          }
        )
      );
      await sleep(2000);
      console.log(`[${name}] fuel stations...`);
      fuel.push(...toRows(await overpass(areaQuery(iso, ['["amenity"="fuel"]'])), 'Fuel station', ''));
      await sleep(2000);
    } catch (e) {
      console.error(`[${name}] FAILED: ${e.message}  (run it again later for this state)`);
      failed.push(name);
    }
  }

  hospitals = dedupe(hospitals);
  police = dedupe(police);
  highways = thin(dedupe(highways));
  fuel = dedupe(fuel);
  if (!hospitals.length && !police.length) {
    console.error('Nothing downloaded, so the existing data files were NOT changed.');
    process.exit(1);
  }

  const dir = path.join(__dirname, 'data');
  const write = (file, rows) => fs.writeFileSync(path.join(dir, file), JSON.stringify(rows, null, 1));
  write('hospitals.json', hospitals);
  write('police.json', police);
  write('highways.json', highways);
  write('fuel.json', fuel);
  write('patrol_units.json', police); // nearest patrol unit = nearest real police station

  console.log(`\nSaved: hospitals=${hospitals.length}, police=${police.length}, highway points=${highways.length}, fuel stations=${fuel.length}, patrol units=${police.length}`);
  if (failed.length) console.log('Failed states (re-run for these):', failed.join(', '));
  console.log('Now run: node db/seed.js');
}
main().catch((e) => { console.error(e.message); process.exit(1); });
