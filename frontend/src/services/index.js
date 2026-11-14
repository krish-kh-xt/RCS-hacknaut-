// Single entry point used by the screens (Part 2).
// Screens import ONLY from here; they never touch storage, sync or api files.
import {
  createUser,
  startTripApi,
  endTripApi,
  demoSilenceApi,
  demoReplyApi,
  demoResetApi,
  isForcedOffline,
} from './api.js';
import {
  saveUser,
  getStoredUser,
  getMeta,
  setMeta,
  getAllPlaces,
} from '../storage/db.js';
import {
  startSync,
  stopSync,
  subscribeStatus,
  getStatus,
  setSimulatedOffline,
  syncNow,
  restoreStatus,
} from './syncService.js';
import {
  triggerSos,
  startSosRetry,
  getPendingSosCount,
  getRejectedSosCount,
  subscribeSosQueue,
  clearRejectedSos,
} from './sosQueue.js';
import { getBestPosition } from '../utils/geolocation.js';
import { distanceKm } from '../utils/haversine.js';

export {
  subscribeStatus,
  getStatus,
  setSimulatedOffline,
  triggerSos,
  getPendingSosCount,
  getRejectedSosCount,
  subscribeSosQueue,
  clearRejectedSos,
  syncNow,
};

/* ---------- demo panel helpers (backend needs DEMO_MODE=true) ---------- */

export const isSimulatedOffline = isForcedOffline;
export const demoSilence = (userId) => demoSilenceApi(userId);
export const demoReply = (userId) => demoReplyApi(userId);
export const demoReset = () => demoResetApi();

/* ---------- start-up ---------- */

// Call once when the app loads (for example in main.jsx or App.jsx).
// Resumes syncing if a trip was active, and retries any queued SOS.
export async function initEngine() {
  startSosRetry();
  await restoreStatus();
  await flushPendingTripEnd();
  const meta = await getMeta();
  const user = await getStoredUser();
  if (user && meta.tripActive) {
    await startSync();
  }
}

/* ---------- user ---------- */

// Onboarding. Needs internet (creates the user on the server).
// Returns { userId }.
export async function registerUser({ name, phone, emergencyPhone }) {
  const { userId } = await createUser({ name, phone, emergencyPhone });
  await saveUser({ userId, name, phone, emergencyPhone });
  return { userId };
}

// The saved user ({ userId, name, phone, emergencyPhone }) or null.
export async function getUser() {
  return getStoredUser();
}

/* ---------- trip ---------- */

export async function startTrip() {
  const user = await getStoredUser();
  if (!user) throw new Error('Please complete onboarding first');
  await setMeta({ pendingTripEnd: false });
  try {
    await startTripApi(user.userId);
  } catch (err) {
    // If offline the first /sync will switch monitoring on anyway.
    if (!err.isNetworkError) throw err;
  }
  await startSync();
}

export async function endTrip() {
  const user = await getStoredUser();
  await stopSync();
  if (!user) return;
  try {
    await endTripApi(user.userId);
  } catch (err) {
    // Offline: remember it and tell the server later, so no false alarm is raised.
    if (err.isNetworkError) {
      await setMeta({ pendingTripEnd: true });
      if (typeof window !== 'undefined') {
        window.addEventListener('online', flushPendingTripEnd, { once: true });
      }
    } else {
      throw err;
    }
  }
}

async function flushPendingTripEnd() {
  const meta = await getMeta();
  if (!meta.pendingTripEnd) return;
  const user = await getStoredUser();
  if (!user) return;
  try {
    await endTripApi(user.userId);
    await setMeta({ pendingTripEnd: false });
  } catch (err) {
    if (!err.isNetworkError) await setMeta({ pendingTripEnd: false });
  }
}

/* ---------- nearest help (works fully offline) ---------- */

const TYPES = ['hospital', 'police', 'highway', 'patrol'];

// Reads GPS and the cached places, then returns the nearest of each kind.
// {
//   cacheEmpty, locationAvailable, position: { lat, lng } | null,
//   positionFresh: true if GPS gave a new fix, false if the LAST KNOWN position was used,
//   positionAt: ISO time of that last known position (only when positionFresh is false),
//   hospital: Place[], police: Place[], highway: Place[], patrol: Place[]
// }
// Place = { id, type, name, phone, highwayRef, lat, lng, distanceKm }
// Each list is sorted nearest first and limited to `limitPerType` (default 3:
// the nearest, then the next two). If no location can be found at all,
// distanceKm is null and the list keeps the order the server sent.
export async function getNearestHelp({ limitPerType = 3 } = {}) {
  const [places, position] = await Promise.all([getAllPlaces(), getBestPosition()]);

  const result = {
    cacheEmpty: places.length === 0,
    locationAvailable: Boolean(position),
    position: position ? { lat: position.lat, lng: position.lng } : null,
    positionFresh: position ? position.fresh : false,
    positionAt: position && !position.fresh ? position.at || null : null,
    hospital: [],
    police: [],
    highway: [],
    patrol: [],
  };

  for (const p of places) {
    if (!TYPES.includes(p.type)) continue;
    result[p.type].push({
      id: p.id,
      type: p.type,
      name: p.name,
      phone: p.phone || '',
      highwayRef: p.highwayRef ?? null,
      lat: p.lat,
      lng: p.lng,
      distanceKm: position ? distanceKm(position.lat, position.lng, p.lat, p.lng) : null,
    });
  }

  for (const type of TYPES) {
    if (position) result[type].sort((a, b) => a.distanceKm - b.distanceKm);
    result[type] = result[type].slice(0, limitPerType);
  }
  return result;
}
