# db (database and data)

**Purpose:** PostgreSQL + PostGIS schema and demo data for RCS.

## Setup (run from the repo root, after `npm install` in backend/)
```
node db/seed.js --schema     # creates the tables, then loads the data (no psql needed)
```
Or with psql: `psql $DATABASE_URL -f db/schema.sql` then `node db/seed.js`.
`seed.js` is safe to re-run: it clears only `places` and `patrol_units`.

Optional, with internet: `node db/fetch-overpass.js` replaces the sample hospitals and police with real OpenStreetMap data, then run `node db/seed.js` again.

## Environment variables
DATABASE_URL (read from backend/.env)

## Folder guide
- `schema.sql`: the five tables from section 6 (users, places, heartbeats, alerts, patrol_units) and indexes
- `seed.js`: loads `data/*.json` into places and patrol_units
- `fetch-overpass.js`: optional, downloads real hospitals and police stations
- `data/hospitals.json`, `police.json`: places along the demo route
- `data/highways.json`: highway help points (include the 1033 national helpline)
- `data/patrol_units.json`: fake demo patrol units

## Notes
- Demo region: Ropar to Anandpur Sahib to Kiratpur to Bilaspur. Sample rows have approximate coordinates and are marked "(sample)".
- Phone numbers: 108 (ambulance), 112 (police) and 1033 (highway helpline) are national numbers used as fallbacks. Patrol unit numbers are fake.
- `highway_ref` values (NH-205, SH-22) are placeholders: check them before the final demo.
- Coordinates: PostGIS `ST_MakePoint(lng, lat)` takes longitude first.

## Troubleshooting: dashboard shows 500 / new SOS alerts do not appear
```
node db/check.js          # checks the connection, tables, columns and the exact dashboard queries
node db/check.js --fix    # also adds columns that an older database is missing (never deletes anything)
```
It prints OK / FAIL lines and what to do. It also lists the newest alerts in the database, so you can see whether an SOS arrived.
