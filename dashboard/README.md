# dashboard (patrol control room)

**Purpose:** live map and side panel showing open RCS alerts, with a "Mark resolved" button for patrol.

## Setup
```
npm install
cp .env.example .env     # on Windows: copy .env.example .env
npm run dev              # opens on http://localhost:5174
```
The backend must be running (see `backend/`). If you set `ALLOWED_ORIGINS` in `backend/.env`, add `http://localhost:5174` to it.

## Environment variables
VITE_API_URL

## Folder guide
- `src/main.jsx`, `src/App.jsx`: app entry
- `src/pages/Alerts.jsx`: the page; polls `GET /alerts?status=open` and `GET /patrol-units` every 10 seconds
- `src/components/AlertMap.jsx`: Leaflet map; red markers for alerts, blue for patrol units; click a marker to select
- `src/components/AlertList.jsx`: side panel with name, phone, emergency contact, last seen, status and source
- `src/components/ResolveButton.jsx`: calls `POST /alerts/:id/resolve`, then refreshes
- `src/services/api.js`: all backend calls
- `src/styles/dashboard.css`: styles
