// OPTIONAL: replaces the sample hospitals.json and police.json with REAL data from OpenStreetMap (Overpass API).
// Needs internet. Run from the repo root:  node db/fetch-overpass.js   then   node db/seed.js
// Change BBOX to your demo region: south, west, north, east.
const fs = require('fs');
const path = require('path');

const BBOX = '30.90,76.30,31.50,76.95'; // Ropar - Anandpur Sahib - Kiratpur - Bilaspur

async function fetchAmenity(amenity) {
  const query = `[out:json][timeout:60];nwr["amenity"="${amenity}"](${BBOX});out center tags;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}`);
  const data = await res.json();
  const fallback = amenity === 'police' ? '112' : '108'; // national emergency numbers when OSM has no phone
  return data.elements
    .map((e) => ({
      name: (e.tags && (e.tags.name || e.tags['name:en'])) || (amenity === 'police' ? 'Police station' : 'Hospital'),
      phone: (e.tags && (e.tags.phone || e.tags['contact:phone'])) || fallback,
      lat: e.lat ?? (e.center && e.center.lat),
      lng: e.lon ?? (e.center && e.center.lon),
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}

async function main() {
  for (const [amenity, file] of [['hospital', 'hospitals.json'], ['police', 'police.json']]) {
    const rows = await fetchAmenity(amenity);
    fs.writeFileSync(path.join(__dirname, 'data', file), JSON.stringify(rows, null, 2));
    console.log(`${file}: ${rows.length} rows`);
  }
  console.log('Done. highways.json and patrol_units.json stay hand-made. Now run: node db/seed.js');
}
main().catch((e) => { console.error(e.message); process.exit(1); });
