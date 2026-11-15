<div align="center">

# 🛣️ RCS — Road Convenience Suite

**Help that still works when the internet doesn't.**

Offline-first road safety for travellers on hill roads, forests and highways.

`Hacknauts 2.0` · `Team RCS` · `Guru Nanak Dev Engineering College, Ludhiana`

</div>

---

## 1. Overview

On hill roads, forest stretches and remote highways, mobile internet can disappear for hours. If something goes wrong, a traveller cannot search for the nearest hospital or police station, and at night there may be nobody nearby. Most safety apps need internet or a button press, so they fail exactly when they are needed.

**RCS** is a Progressive Web App (PWA) with two features that work together:

| Feature | What it does |
|---|---|
| **Offline Help** | While the phone has signal, the app syncs every 5 minutes and stores nearby **hospitals, police stations, highway help points and patrol units** on the device. With no signal, GPS (which works offline) picks the nearest of each, with distance and a tap-to-call number. |
| **Silence Alarm** | If the server hears nothing from a travelling user for **1 hour**, it sends an SMS *"Are you safe?"*. A reply of `OK` cancels the alarm. No reply within **10 minutes** and the nearest patrol unit sees the traveller's last known location on a live dashboard. |

The idea is the same as social apps that pre-load feed videos so they still play offline. RCS pre-loads **help** instead of videos.

## 2. Screenshots

> Replace the placeholders below with real screenshots from `docs/screenshots/`.

| Traveller app: Home | Offline nearest help | Patrol dashboard |
|:---:|:---:|:---:|
| ![Home](docs/screenshots/home.png) | ![Nearest help](docs/screenshots/nearest-help.png) | ![Dashboard](docs/screenshots/dashboard.png) |

## 3. Key Features

### Traveller app (PWA)
- 📍 **Background-style sync** every 5 minutes: sends a heartbeat (location, battery) and receives nearby help
- 📴 **Works offline**: places are cached in IndexedDB, the app shell is cached by a service worker
- 🏥 **Nearest help with no internet**: hospital, police station, highway help (NH/SH) and patrolling unit, ranked by Haversine distance
- 📞 **Tap-to-call** on every place
- 🆘 **SOS button**: if there is no internet, the SOS is queued and sent automatically when the connection returns
- 🟢 **Online / Offline badge** and last-synced time
- 🔋 **Screen wake lock** during a trip so syncing stays reliable
- 📲 **Installable** on the home screen

### Patrol control room (dashboard)
- 🗺️ **Live map** (Leaflet + OpenStreetMap) of open alerts and patrol units
- 📋 **Alert list** with name, phones, last location, last seen time and source (`SILENCE` or `SOS`)
- ✅ **Mark resolved** once the traveller has been checked
- 🚓 **Nearest patrol unit** is assigned automatically on escalation

### Backend
- ⏱️ **Silence worker** runs every minute: finds silent users, sends the SMS, escalates unanswered alerts
- 🔌 **SMS gateway abstraction** with a `mock` mode for development and demos
- 🧪 **Demo endpoints** to simulate silence and replies on stage

## 4. How It Works

**1. Sync (online).** The app calls `POST /sync` every 5 minutes. The server saves a heartbeat and returns up to 15 hospitals, police stations and highway help points, plus nearby patrol units, within the search radius. The app **replaces** its cached list.

**2. Offline help.** With no signal, the app reads GPS, loads the cached places from IndexedDB and shows the nearest of each type.

**3. SOS.** One tap sends `POST /sos` and creates an `ESCALATED` alert with the nearest patrol unit. If the request fails, it is queued and retried when the browser goes online.

**4. Silence detection.** Every minute the worker looks for users on an active trip whose last heartbeat is older than `SILENCE_LIMIT_MIN`. It creates an alert, sends the SMS and sets the status to `SMS_SENT`.

**5. Reply.** If the traveller replies `OK`, the alert becomes `RESOLVED`. If the traveller's app syncs again, the silence alert resolves on its own.

**6. Escalation.** No reply within `ESCALATE_AFTER_MIN`? The alert becomes `ESCALATED`, the nearest patrol unit is assigned and notified, and the alert appears on the dashboard with the last known location.

### Alert status flow

```mermaid
stateDiagram-v2
    [*] --> SMS_SENT: silence detected (no heartbeat for 1 hour)
    [*] --> ESCALATED: SOS pressed
    SMS_SENT --> RESOLVED: user replies OK / app syncs
    SMS_SENT --> ESCALATED: no reply in 10 minutes
    ESCALATED --> RESOLVED: patrol marks resolved
    RESOLVED --> [*]
```

## 5. Architecture

```mermaid
flowchart LR
    subgraph Phone["Traveller phone (PWA)"]
        A[React app] --> B[(IndexedDB cache)]
        A --> C[Service worker]
    end
    subgraph Server["Backend (Node + Express)"]
        D[REST API]
        E[Silence worker<br/>cron, every minute]
    end
    F[(PostgreSQL + PostGIS)]
    G[SMS gateway]
    H[Patrol dashboard<br/>React + Leaflet]

    A -- "/sync, /sos, /trip" --> D
    D <--> F
    E <--> F
    E -- "Are you safe?" --> G
    G -. SMS .-> Phone
    G -- "reply webhook" --> D
    H -- "/alerts, /patrol-units" --> D
```

| Part | Runs where | Job |
|---|---|---|
| Traveller app (`frontend/`) | Phone (PWA) | Reads GPS, syncs, caches places, shows nearest help offline, sends SOS |
| Backend API (`backend/`) | Server | Receives heartbeats, returns nearest places, creates and resolves alerts |
| Database (`db/`) | PostgreSQL + PostGIS | Stores users, places, heartbeats, alerts, patrol units and answers "nearest" queries |
| Silence worker | Inside the backend (cron) | Finds silent users, sends SMS, escalates unanswered alerts |
| SMS gateway | External service | Sends the safety check and forwards replies to the webhook |
| Patrol dashboard (`dashboard/`) | Browser | Shows open alerts and patrol units, lets patrol mark alerts resolved |

### Repository structure

```
rcs/
├── frontend/     # Traveller PWA (React + Vite)
├── dashboard/    # Patrol control room (React + Vite + Leaflet)
├── backend/      # REST API + silence worker (Node + Express)
├── db/           # schema.sql, seed.js, Overpass data
└── docs/         # architecture, API notes, demo script, slides
```

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Traveller app | React, Vite, `vite-plugin-pwa`, `idb` (IndexedDB) |
| Dashboard | React, Vite, Leaflet / `react-leaflet`, OpenStreetMap tiles |
| Backend | Node.js 18+, Express, `pg`, `node-cron`, `dotenv`, `cors` |
| Database | PostgreSQL with PostGIS (Supabase free tier works) |
| Map data | OpenStreetMap via the Overpass API |
| SMS | Pluggable gateway (`mock` mode for development) |
| Hosting | Render or Railway (API), Vercel (frontends) |

> **HTTPS matters.** Browsers only allow geolocation and service workers on HTTPS (`localhost` is the only exception). For testing on a real phone, deploy the frontends or use a tunnel such as ngrok.

## 7. Installation

### Prerequisites
- Node.js 18 or newer
- PostgreSQL with the PostGIS extension (local, or a free Supabase project)
- Git

### 1. Clone

```bash
git clone https://github.com/<your-org>/rcs.git
cd rcs
```

### 2. Database

```bash
# create a database, then enable PostGIS and load the schema
psql "$DATABASE_URL" -c "create extension if not exists postgis;"
psql "$DATABASE_URL" -f db/schema.sql

# load hospitals, police stations, highway help points and demo patrol units
node db/seed.js
```

See [`db/README.md`](db/README.md) for details on the Overpass data.

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values below
npm run dev               # http://localhost:4000
```

| Variable | Meaning | Example |
|---|---|---|
| `PORT` | API port | `4000` |
| `DATABASE_URL` | Postgres connection string | `postgres://user:pass@localhost:5432/rcs` |
| `SMS_MODE` | `mock` prints SMS to the console, `live` calls the gateway | `mock` |
| `SMS_API_KEY` | Gateway key (empty in mock mode) | |
| `SILENCE_LIMIT_MIN` | Minutes of silence before the SMS | `60` (use `1` for demo) |
| `ESCALATE_AFTER_MIN` | Minutes to wait for a reply | `10` (use `1` for demo) |
| `NEARBY_RADIUS_M` | Search radius in metres | `30000` |
| `DEMO_MODE` | `true` enables `/demo/*` routes | `true` |
| `ALLOWED_ORIGINS` | Comma-separated frontend and dashboard URLs | `http://localhost:5173,http://localhost:5174` |

### 4. Traveller app

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

| Variable | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:4000` |
| `VITE_SYNC_INTERVAL_MS` | `300000` normally, `15000` for demo |

### 5. Patrol dashboard

```bash
cd dashboard
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm run dev
```

> Never commit a real `.env`. Only `.env.example` files with empty values belong in Git.

## 8. API Documentation

All requests and responses are JSON. Timestamps are ISO 8601 in UTC. Coordinates are always `lat` and `lng`. Errors look like `{ "error": "short message" }` with a proper status code (400, 404, 500).

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/users` | Onboard a user (returns the existing user for the same phone) |
| `POST` | `/trip/start` | Turn silence monitoring on for a user |
| `POST` | `/trip/end` | Turn silence monitoring off |
| `POST` | `/sync` | Heartbeat plus prefetch of nearby help |
| `POST` | `/sos` | Create an immediate `ESCALATED` alert |
| `GET` | `/alerts?status=open` | Open alerts for the dashboard |
| `GET` | `/patrol-units` | Patrol units for the dashboard map |
| `POST` | `/alerts/:id/resolve` | Patrol marks an alert as checked |
| `POST` | `/sms/reply` | SMS gateway webhook |
| `POST` | `/demo/silence/:userId` | *(demo)* Simulate the silence limit being reached |
| `POST` | `/demo/reply/:userId` | *(demo)* Simulate the user replying `OK` |
| `POST` | `/demo/reset` | *(demo)* Delete alerts and heartbeats |

### `POST /users`

```json
// request
{ "name": "Aman", "phone": "+919876543210", "emergencyPhone": "+919812345678" }
// response
{ "userId": 12 }
```

### `POST /sync`

```json
// request
{ "userId": 12, "lat": 31.2, "lng": 76.5, "battery": 64, "timestamp": "2026-11-04T09:30:00Z" }

// response
{
  "ok": true,
  "alertResolved": false,
  "places": [
    { "id": 5, "type": "hospital", "name": "Civil Hospital", "phone": "01887-xxxxxx",
      "highwayRef": null, "lat": 31.21, "lng": 76.51 },
    { "id": 9, "type": "highway", "name": "Toll Plaza Help Point", "phone": "1033",
      "highwayRef": "NH-44", "lat": 31.19, "lng": 76.48 },
    { "id": 3, "type": "patrol", "name": "Patrol Unit 3", "phone": "+91...",
      "highwayRef": null, "lat": 31.25, "lng": 76.4 }
  ]
}
```

A sync resolves any open **silence** alert for that user (`alertResolved: true`). An **SOS** is never cancelled by a sync; only patrol can resolve it.

### `POST /sos`

```json
// request
{ "userId": 12, "lat": 31.2, "lng": 76.5 }
// response
{ "alertId": 40 }
```

### `GET /alerts?status=open`

```json
[
  { "id": 40, "userId": 12, "name": "Aman", "phone": "+919876543210",
    "emergencyPhone": "+919812345678", "source": "SILENCE", "status": "ESCALATED",
    "lastLat": 31.2, "lastLng": 76.5, "lastSeen": "2026-11-04T08:20:00Z",
    "createdAt": "2026-11-04T09:21:00Z", "patrolUnitId": 3 }
]
```

### `POST /sms/reply`

```json
// request (field names may differ by gateway provider)
{ "from": "+919876543210", "message": "OK" }
// response
{ "ok": true }
```

A reply of `OK` (any case, trimmed) resolves the user's open alert and records a fresh heartbeat, so the user is not flagged again straight away.

A full contract with every endpoint is kept in [`docs/api.md`](docs/api.md).

## 9. Innovation

- **Pre-fetching help, not content.** Borrowing the "videos stay playable offline" idea from social apps and applying it to emergency services.
- **Offline-first by design.** GPS needs no internet, so cached places plus Haversine distance give accurate nearest-help results in a dead zone.
- **A dead-man's switch for travellers.** The user does not have to press anything. Silence itself triggers the safety check.
- **SMS as the safety channel.** SMS travels on the basic cellular network and works where mobile data and app notifications fail. A reply by SMS is enough; no app, data or internet is needed.
- **Server-side detection.** The alarm does not depend on the phone's battery, the app or a data connection to *raise* the alert, only the traveller's silence.
- **Human in the loop.** Escalation reaches the nearest patrol unit with the last known location, not just an automated message.

## 10. Limitations and Future Scope

### Current limitations
- **PWA, not native.** A PWA only syncs reliably while it is open, so the screen is kept awake during a trip. Reliable background sync with the screen locked needs a native app.
- **SMS still needs some signal.** If the phone has none, the message waits and is delivered when signal returns. The escalation timer still protects the user.
- **Simulated patrol integration.** The dashboard is a simulated control room. It is not connected to real police systems.
- **Mock SMS in the demo.** Real inbound replies need a paid virtual number. The demo panel calls the same resolve logic with a button; the production version uses the gateway webhook.
- **Data coverage.** Places come from OpenStreetMap and are only as complete as the map data for the region.
- **Detection delay.** The worker runs once a minute, so alerts can take up to about two minutes to appear after the silence limit.

### Future scope
- Landslide and road-blockage alerts for nearby travellers, based on reports
- Risk zones from weather and terrain data
- Integration with **112** and highway authorities (NHAI / 1033)
- Bluetooth or satellite fallback where SMS fails
- Regional languages and voice SOS
- Native Android and iOS apps for reliable background sync
- Fleet and tour-operator dashboards

**Sustainable Development Goals:** SDG 9 (Industry, Innovation and Infrastructure) and SDG 13 (Climate Action).

## 11. Contributors and License

### Team RCS

| Role | Folder | Member |
|---|---|---|
| Backend and silence worker | `backend/` | Krish Khanna |
| Database, data and SMS | `db/` | _add name_ |
| Traveller app | `frontend/` | _add name_ |
| Patrol dashboard | `dashboard/` | _add name_ |
| Demo, docs and QA | `docs/` | _add name_ |

Built for **Hacknauts 2.0** at Guru Nanak Dev Engineering College, Ludhiana.

### License

Released under the [MIT License](LICENSE).

---

<div align="center">

Made with care for everyone on the road. 🛣️

</div>
