# RCS demo script

Goal: show that RCS keeps travellers safe **without internet**. Total time: about 5 minutes.
Anyone who has never seen the project should be able to follow this page.

## Before the demo (10 minutes earlier)
1. **Backend** (`backend/.env`): `DEMO_MODE=true`, `SILENCE_LIMIT_MIN=1`, `ESCALATE_AFTER_MIN=1`, `SMS_MODE=mock` (or `live` with a real key). Run `npm run dev` in `backend/`; the terminal should say `[db] connected`.
2. **Database**: from the repo root run `node db/seed.js --schema` so places and patrol units exist.
3. **Frontend** (`frontend/.env`): `VITE_API_URL` points to the backend, `VITE_SYNC_INTERVAL_MS=15000`. Open the app over HTTPS on the phone (deployed site or ngrok); GPS does not work on plain HTTP.
4. **Dashboard**: open it on the laptop, showing the map with patrol units.
5. Keep the phone screen awake and charged. Allow location when asked.
6. Reset old data: `POST /demo/reset`.

## The 5 steps (what to do, what to say)

| # | Do | Judges should see | Say |
|---|---|---|---|
| 1 | Onboard (name, phone, emergency contact) and tap **Start trip** while online | Online badge; in DevTools or the app, nearby hospitals, police, highway help and patrol units saved on the phone | "While there is signal, RCS saves help on the phone every 5 minutes." |
| 2 | Switch on **airplane mode**, open **Nearest help** | Nearest hospital, police station, highway help and patrolling unit with distance and tap-to-call | "No internet, yet help is still there. GPS works offline." |
| 3 | Open the hidden demo panel (tap the logo 5 times), press **Simulate 1 hour silence** | Within about 1 minute the backend log shows the SMS "Are you safe? Reply OK..." (or the SMS arrives on the phone) | "If the server hears nothing for an hour, it sends an SMS. SMS needs no data." |
| 4 | **Do not reply.** Wait about 1 more minute | Alert appears on the patrol dashboard as a red marker at the last known location, with name, phone and emergency contact | "No reply means the nearest patrol unit sees where the traveller was last seen." |
| 5 | Press **Simulate 1 hour silence** again, then **Reply OK** | Alert becomes RESOLVED, marker disappears | "A single reply cancels the alarm. In production this comes from the SMS gateway webhook; here a button calls the same logic." |

Optional extra: turn airplane mode off and show the badge turning Online and an escalated alert resolving after the next sync. Or press **SOS** offline, reconnect, and show the alert arriving automatically.

## Honest limits (say these before the judges ask)
- It is a PWA, so it syncs reliably only while the app is open; keep the screen awake. A native app is future scope.
- Real inbound SMS replies need a paid virtual number; the demo button uses the same logic.
- SMS still needs some cellular signal. With none, the message waits and the 10-minute escalation still protects the user.
- The patrol dashboard is simulated; we do not connect to real police systems.

## If something goes wrong
| Problem | Fix |
|---|---|
| Nothing happens after Simulate silence | Wait a full minute (the worker runs every minute); check `DEMO_MODE=true` and that the user synced at least once |
| Places list is empty | Run `node db/seed.js`; check `NEARBY_RADIUS_M` and that you are near the demo route |
| Phone cannot get location | Use HTTPS (deployed site or ngrok) and allow location |
| Dashboard shows nothing | Check it points to the same backend URL; open `/alerts?status=open` in the browser |
| Need to restart the demo | `POST /demo/reset`, then sync again |

## Demo checklist
- [ ] Backend, frontend and dashboard running, `[db] connected`
- [ ] Phone on HTTPS, location allowed, screen awake
- [ ] Data reset, trip started online, cache filled
- [ ] Airplane-mode screen rehearsed
- [ ] SMS visible (backend log or phone)
