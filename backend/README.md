# backend (API + worker)

**Purpose:** Express API and silence worker for RCS (Part 1 + Part 2 combined).

## Setup
```
npm install
cp .env.example .env      # fill DATABASE_URL; for demos set DEMO_MODE=true, SILENCE_LIMIT_MIN=1, ESCALATE_AFTER_MIN=1
npm run dev
```
Database: use Role B's `db/schema.sql` + `db/seed.js`. For solo testing:
```
psql $DATABASE_URL -f dev/schema.dev.sql
psql $DATABASE_URL -f dev/seed.dev.sql
```

## Environment variables
PORT, DATABASE_URL, SMS_MODE, SMS_API_KEY, SILENCE_LIMIT_MIN, ESCALATE_AFTER_MIN, NEARBY_RADIUS_M, DEMO_MODE, ALLOWED_ORIGINS

## Folder guide
- `src/server.js`: starts Express and the silence worker
- `src/app.js`: middleware, CORS and the route table (mount path per route file)
- `src/config/`: env settings and pg pool
- `src/routes/`, `src/controllers/`: one file per route group
- `src/services/`: all SQL lives here (places, heartbeat, user, alert, patrol, sms)
- `src/workers/silenceWorker.js`: runs every minute (silence check + escalation)

## Endpoints
Part 1: POST /users, /trip/start, /trip/end, /sync
Part 2: POST /sos, GET /alerts?status=open, GET /patrol-units, POST /alerts/:id/resolve, POST /sms/reply, POST /demo/silence/:userId, /demo/reply/:userId, /demo/reset (demo only)

## Full demo test (curl, SMS_MODE=mock, demo timings)
```
H='Content-Type: application/json'
curl -X POST localhost:4000/users -H "$H" -d '{"name":"Aman","phone":"+919876543210","emergencyPhone":"+919812345678"}'
curl -X POST localhost:4000/sync  -H "$H" -d '{"userId":1,"lat":31.2,"lng":76.5,"battery":64}'
curl -X POST localhost:4000/demo/silence/1        # wait ~1 min: log shows the "Are you safe?" SMS, alert SMS_SENT
curl "localhost:4000/alerts?status=open"           # wait ~1 more min: status ESCALATED, patrolUnitId set
curl -X POST localhost:4000/sync  -H "$H" -d '{"userId":1,"lat":31.2,"lng":76.5}'   # alertResolved: true
curl -X POST localhost:4000/demo/silence/1; sleep 70; curl -X POST localhost:4000/demo/reply/1   # "Reply OK" path
```
