# RCS: Road Convenience Suite

An offline safety net for people travelling in remote areas. Built by Team RCS for **Hacknauts 2.0**, Guru Nanak Dev Engineering College, Ludhiana.

## The problem
On hill roads, forest stretches and highways, mobile internet can disappear for hours. A traveller cannot search for the nearest hospital or police station, and at night there may be nobody nearby. Most safety apps need internet or a button press, so they fail exactly when they are needed.

## Our solution
- **Offline Help.** While the phone has signal, the app syncs every 5 minutes and saves nearby hospitals, police stations, highway help and patrolling units on the device. With no signal, GPS shows the nearest of each, with distance and a tap-to-call number.
- **Silence Alarm.** If the server hears nothing from a travelling user for 1 hour, it sends an SMS "Are you safe?". A reply cancels the alarm. No reply within 10 minutes and the nearest patrol unit sees the traveller's last known location on a live dashboard.

## Repository structure
| Folder | What it is | Docs |
|---|---|---|
| `frontend/` | Traveller app (React + Vite PWA) | `frontend/README.md` |
| `backend/` | API + silence worker (Node + Express) | `backend/README.md` |
| `db/` | PostgreSQL + PostGIS schema and demo data | `db/README.md` |
| `dashboard/` | Patrol control room (React + Leaflet) | `dashboard/README.md` |
| `docs/` | Presentation, architecture diagram, API contract, demo script | `docs/README.md` |

Each folder has one owner and you only edit files inside your own folder. The API contract (`docs/api.md`) and the database schema (`db/schema.sql`) are fixed: tell the team lead before changing either.

## Quick start (local)
You need Node.js 18+ and a PostgreSQL database with PostGIS (a free Supabase project works).

1. **Backend settings:** `cd backend`, `npm install`, copy `.env.example` to `.env`, and fill in `DATABASE_URL`.
2. **Database:** from the repo root run `node db/seed.js --schema` to create the tables and load the demo data.
3. **Backend:** `cd backend && npm run dev` (check `http://localhost:4000/health`).
4. **Traveller app:** `cd frontend`, `npm install`, copy `.env.example` to `.env`, then `npm run dev`.
5. **Dashboard:** `cd dashboard`, `npm install`, copy `.env.example` to `.env`, then `npm run dev` (opens on port 5174).

Browsers only allow GPS and service workers on HTTPS (localhost is the exception). For phone testing, use a deployed site or a tunnel such as ngrok.

## Environment variables
See `.env.example` for the full list. Never commit a real `.env` file.

## Running the demo
Set `DEMO_MODE=true`, `SILENCE_LIMIT_MIN=1` and `ESCALATE_AFTER_MIN=1` in `backend/.env`, then follow `docs/demo-script.md`.

## Team
| Role | Owns | Name |
|---|---|---|
| A. Backend | `backend/` | |
| B. Database and data | `db/`, `sms.service.js` | |
| C. Traveller app | `frontend/` | |
| D. Patrol dashboard | `dashboard/` | |
| E. Demo, docs and QA | `docs/`, root files | |

## Honest limits
- A PWA syncs reliably only while it is open; keep the screen awake during the demo.
- Real inbound SMS replies need a paid virtual number; the demo panel calls the same logic.
- SMS still needs some cellular signal. With none, the message waits and the 10-minute escalation still protects the user.
- The patrol dashboard is a simulated control room, not connected to real police systems.

## Future scope
Landslide and blockage alerts from reports, risk zones from weather and terrain data, links with 112 and highway authorities, Bluetooth or satellite fallback, regional languages and voice SOS, and a native app for reliable background sync.

Supports SDG 9 (Industry, Innovation and Infrastructure) and SDG 13 (Climate Action).

## License
MIT, see `LICENSE`.
