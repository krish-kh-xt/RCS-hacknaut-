// SOS handling. Try POST /sos first; if there is no internet, save the SOS in
// IndexedDB and send it automatically when the browser comes back online.
//
// A queued SOS is NEVER silently deleted. If the server rejects it (4xx) it is
// kept and marked `rejected`, so the app can tell the user to call 112 instead.
import { sosApi } from './api.js';
import {
  enqueueSos,
  getQueuedSos,
  removeQueuedSos,
  updateQueuedSos,
  getStoredUser,
} from '../storage/db.js';
import { getBestPosition } from '../utils/geolocation.js';

let flushing = false;
let retryStarted = false;

/* ---------- counts + change notifications (used by the Home screen) ---------- */

const listeners = new Set();

// { pending: waiting for internet, rejected: server refused it }
export async function getSosCounts() {
  const queued = await getQueuedSos();
  const rejected = queued.filter((i) => i.rejected).length;
  return { pending: queued.length - rejected, rejected };
}

async function notify() {
  if (listeners.size === 0) return;
  try {
    const counts = await getSosCounts();
    listeners.forEach((cb) => {
      try {
        cb(counts);
      } catch {
        // a bad subscriber must not break the others
      }
    });
  } catch {
    // ignore
  }
}

// cb gets { pending, rejected } now and after every change. Returns unsubscribe.
export function subscribeSosQueue(cb) {
  listeners.add(cb);
  getSosCounts().then(cb).catch(() => {});
  return () => listeners.delete(cb);
}

/* ---------- sending ---------- */

// Called when the user taps the SOS button.
// Returns { sent, queued, alertId? }. Throws only if SOS cannot even be recorded
// (user not registered, no location at all) or the server rejects it.
export async function triggerSos() {
  const user = await getStoredUser();
  if (!user) throw new Error('Please complete onboarding first');

  const pos = await getBestPosition({ timeoutMs: 8000 });
  if (!pos) throw new Error('Location unavailable. Turn on GPS and try again');

  const payload = { userId: user.userId, lat: pos.lat, lng: pos.lng };

  try {
    const res = await sosApi(payload);
    return { sent: true, queued: false, alertId: res?.alertId };
  } catch (err) {
    if (err.isNetworkError) {
      await enqueueSos({ ...payload, createdAt: new Date().toISOString() });
      await notify();
      return { sent: false, queued: true };
    }
    throw err; // server rejected it (bad input etc.): the caller shows the reason
  }
}

// 5xx, timeouts and rate limits are temporary: keep the SOS and retry later.
const isTemporary = (status) => status >= 500 || status === 408 || status === 429;

// Send every queued SOS. Safe to call many times; only one run at a time.
export async function flushSosQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const queued = await getQueuedSos();
    for (const item of queued) {
      if (item.rejected) continue; // already refused by the server, do not retry
      try {
        await sosApi({ userId: item.userId, lat: item.lat, lng: item.lng });
        await removeQueuedSos(item.qid);
      } catch (err) {
        if (err.isNetworkError) break; // still offline, try again later
        if (isTemporary(err.status)) break; // server trouble, keep it and retry later
        // 4xx: it will never succeed as is. Keep it, mark it, and let the UI warn the user.
        await updateQueuedSos({ ...item, rejected: true, error: err.message, status: err.status });
      }
    }
  } finally {
    flushing = false;
    await notify();
  }
}

// SOS requests still waiting for internet.
export async function getPendingSosCount() {
  return (await getSosCounts()).pending;
}

// SOS requests the server refused.
export async function getRejectedSosCount() {
  return (await getSosCounts()).rejected;
}

// The user has seen the warning: remove the rejected entries.
export async function clearRejectedSos() {
  const queued = await getQueuedSos();
  for (const item of queued) {
    if (item.rejected) await removeQueuedSos(item.qid);
  }
  await notify();
}

// Retry whenever the browser fires the `online` event, and once right now.
export function startSosRetry() {
  if (retryStarted || typeof window === 'undefined') return;
  retryStarted = true;
  window.addEventListener('online', () => {
    flushSosQueue();
  });
  if (navigator.onLine) flushSosQueue();
}
