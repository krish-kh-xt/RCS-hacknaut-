# RCS API contract (v1.0)

Source of truth: section 7 of the Team Implementation Guide. **Fixed**: do not rename fields or endpoints.
Base URL comes from `VITE_API_URL` (for example `http://localhost:4000`).

## Rules for every endpoint
- Requests and responses are JSON (`Content-Type: application/json`).
- Timestamps are ISO 8601 in UTC, e.g. `2026-11-04T09:30:00Z`.
- Coordinates are numbers named `lat` and `lng`. Never swap them.
- Errors look like `{ "error": "short message" }` with status 400 (bad input), 404 (not found) or 500 (server).
- CORS allows the origins listed in `ALLOWED_ORIGINS` (everything when it is empty).

## Traveller app

### POST /users
Onboarding. Creates a user, or returns the existing one with the same phone.
```json
{ "name": "Aman", "phone": "+919876543210", "emergencyPhone": "+919812345678" }
```
Response: `{ "userId": 12 }`

### POST /trip/start and POST /trip/end
Turns silence monitoring on or off for this user.
Request: `{ "userId": 12 }`  Response: `{ "ok": true }`

### POST /sync
Heartbeat plus prefetch, called every 5 minutes while online.
```json
{ "userId": 12, "lat": 31.2, "lng": 76.5, "battery": 64, "timestamp": "2026-11-04T09:30:00Z" }
```
Response:
```json
{
  "ok": true,
  "alertResolved": false,
  "places": [
    { "id": 5, "type": "hospital", "name": "Civil Hospital", "phone": "01887-xxxxxx", "highwayRef": null, "lat": 31.21, "lng": 76.51 },
    { "id": 9, "type": "highway",  "name": "Toll Plaza Help Point", "phone": "1033", "highwayRef": "NH-44", "lat": 31.19, "lng": 76.48 },
    { "id": 3, "type": "patrol",   "name": "Patrol Unit 3", "phone": "+91...", "highwayRef": null, "lat": 31.25, "lng": 76.4 }
  ]
}
```
Server behaviour: saves a heartbeat, sets `trip_active = true`, resolves any unresolved alert for the user (`alertResolved: true` if one was resolved), and returns up to 15 places of each type (`hospital`, `police`, `highway`) within 30 km plus nearby patrol units as type `patrol`, all sorted by distance. The server clock is used for the heartbeat time.

### POST /sos
Request: `{ "userId": 12, "lat": 31.2, "lng": 76.5 }`  Response: `{ "alertId": 40 }`
Creates an alert with source `SOS` and status `ESCALATED`, with the nearest patrol unit assigned. If the user already has an open alert it is upgraded instead of duplicated, so retries from the offline queue are safe.

## Patrol dashboard

### GET /alerts?status=open
"open" means status is not `RESOLVED`. (`status=all` or an exact status name also work.)
```json
[
  { "id": 40, "userId": 12, "name": "Aman", "phone": "+919876543210",
    "emergencyPhone": "+919812345678", "source": "SILENCE", "status": "ESCALATED",
    "lastLat": 31.2, "lastLng": 76.5, "lastSeen": "2026-11-04T08:20:00Z",
    "createdAt": "2026-11-04T09:21:00Z", "patrolUnitId": 3 }
]
```

### GET /patrol-units
`[ { "id": 3, "name": "Patrol Unit 3", "phone": "+91...", "lat": 31.25, "lng": 76.4 } ]`

### POST /alerts/:id/resolve
Patrol marks an alert as checked. Response: `{ "ok": true }` (404 if the alert does not exist).

## SMS gateway

### POST /sms/reply
Webhook called by the SMS gateway.
Request: `{ "from": "+919876543210", "message": "OK" }`  Response: `{ "ok": true }`
Server behaviour: finds the unresolved alert for that phone number; if the message (trimmed, any case) is `OK`, sets it to `RESOLVED`. Other messages and unknown numbers are ignored. Common gateway field names (`sender`, `mobile`, `text`, ...) are accepted too.

## Demo endpoints (only when `DEMO_MODE=true`)
| Endpoint | What it does |
|---|---|
| `POST /demo/silence/:userId` | Moves the user's latest heartbeat back by `SILENCE_LIMIT_MIN + 1` minutes so the worker fires on its next run |
| `POST /demo/reply/:userId` | Runs the same resolve logic as `/sms/reply` for this user (returns `{ "ok": true, "resolved": n }`) |
| `POST /demo/reset` | Deletes alerts and heartbeats so the demo can be re-run |

## Alert status flow
`SMS_SENT` (SMS sent, waiting up to `ESCALATE_AFTER_MIN`) → `ESCALATED` (nearest patrol unit assigned) → `RESOLVED`.
An SOS starts directly at `ESCALATED`. A reply of OK, a new `/sync`, or "Mark resolved" ends an alert.
