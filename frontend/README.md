# RCS Traveller App (frontend)

**Purpose:** the PWA that travellers use. It syncs every 5 minutes, caches nearby help on the phone and shows the nearest help offline.

## Setup

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev
```

## Environment variables

- `VITE_API_URL` (backend address, e.g. http://localhost:4000)
- `VITE_SYNC_INTERVAL_MS` (300000 normally, 15000 for demo)

## Folder guide (Part 1: offline engine)

- `vite.config.js` PWA config. Caches the app shell only, never API calls.
- `src/storage/db.js` IndexedDB (stores: user, places, sosQueue).
- `src/utils/haversine.js` distance between two GPS points.
- `src/utils/geolocation.js` GPS helpers, with last-known-position fallback.
- `src/utils/wakeLock.js` keeps the screen awake while syncing.
- `src/services/api.js` fetch wrapper for the fixed API contract.
- `src/services/syncService.js` 5-minute sync, online/offline handling.
- `src/services/sosQueue.js` SOS with offline queue and automatic retry.
- `src/services/index.js` the one file the screens import from.

## Functions the screens use (from `src/services/index.js`)

- `initEngine()` call once at app start
- `registerUser({ name, phone, emergencyPhone })` returns `{ userId }`
- `getUser()` returns the saved user or `null`
- `startTrip()` / `endTrip()`
- `getNearestHelp()` returns `{ cacheEmpty, locationAvailable, position, hospital, police, highway, patrol }`, each list sorted nearest first with `distanceKm`
- `triggerSos()` returns `{ sent, queued }`
- `subscribeStatus(cb)` cb gets `{ online, tripActive, lastSyncedAt, alertResolved, error }`; returns an unsubscribe function
- `setSimulatedOffline(bool)` for the demo panel

## Folder guide (Part 2: screens and design)

- `index.html`, `public/manifest.webmanifest`, `public/icons/` the installable PWA shell. The manifest is hand-written, so `vite.config.js` has `manifest: false`.
- `src/main.jsx`, `src/App.jsx` start-up and hash routing (`#/`, `#/help`, `#/demo`). `App.jsx` is the only screen file that imports from `services/index.js`.
- `src/screens/Onboarding.jsx`, `Home.jsx`, `NearestHelp.jsx` the three screens.
- `src/components/StatusBadge.jsx`, `SosButton.jsx`, `PlaceCard.jsx` shared pieces.
- `src/styles/app.css` all styling (system fonts and inline icons, so it renders offline).

## Demo panel (Role E)

Add `src/screens/DemoPanel.jsx` (props: `user`, `onClose`). It is picked up automatically and opens by tapping the logo 5 times. Use `setSimulatedOffline(bool)` from `services/index.js` for "Simulate no internet".

## Part 3: new UI (dark navy design)

Screens now follow the shared design: Home (status pill, hold-to-send SOS, Nearest Help grid, Works Offline banner), Maps (search, filter chips, dark map), Nearest Help list, and the admin dashboard.

- `src/components/` Icon, Logo, StatusBadge, SosButton (hold 3 s), BottomNav, PlaceCard, MapView
- `src/screens/Home.jsx`, `MapScreen.jsx`, `NearestHelp.jsx`, `Onboarding.jsx`
- `src/screens/dashboard/` `Dashboard.jsx` (`#/dashboard` and `#/dashboard/alerts`) and `useDashboardData.js` (reads `GET /alerts` and `GET /patrol-units`, falls back to sample data)
- `src/utils/format.js` display helpers
- Routes: `#/`, `#/help`, `#/map`, `#/demo`, `#/dashboard`, `#/dashboard/alerts`

### UI update 2
- Font: Poppins, bundled with `@fontsource/poppins` (run `npm install`; it works offline because the font files are cached by the service worker).
- SOS: hold 2 seconds; the button turns green ("SENT", or "SAVED" if offline) for 10 seconds, then goes back to red.
- Trip: Home shows a gold Start Trip button. After tapping it the screen shows "Trip Active", the SOS button and an End Trip button.
