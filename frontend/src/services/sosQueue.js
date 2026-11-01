// SOS handling. Try POST /sos first; if there is no internet, save the SOS in
// IndexedDB and send it automatically when the browser comes back online.
import { sosApi } from './api.js';
import { enqueueSos, getQueuedSos, removeQueuedSos, getStoredUser } from '../storage/db.js';
import { getBestPosition } from '../utils/geolocation.js';

let flushing = false;
let retryStarted = false;

// Called when the user taps the SOS button.
// Returns { sent, queued, alertId? }. Throws only if SOS cannot even be recorded
// (user not registered, or no location at all).
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
      return { sent: false, queued: true };
    }
    throw err; // server rejected it (bad input etc.)
  }
}

// Send every queued SOS. Safe to call many times; only one run at a time.
export async function flushSosQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const queued = await getQueuedSos();
    for (const item of queued) {
      try {
        await sosApi({ userId: item.userId, lat: item.lat, lng: item.lng });
        await removeQueuedSos(item.qid);
      } catch (err) {
        if (err.isNetworkError) break; // still offline, try again later
        if (err.status >= 500) break; // server trouble, keep it and retry later
        await removeQueuedSos(item.qid); // 4xx: it will never succeed, drop it
      }
    }
  } finally {
    flushing = false;
  }
}

export async function getPendingSosCount() {
  return (await getQueuedSos()).length;
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
