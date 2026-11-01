// Sync every 5 minutes while a trip is active.
// One POST /sync is both the "I am alive" heartbeat and the prefetch of nearby help.
import { syncApi, setForceOffline, isForcedOffline } from './api.js';
import { replacePlaces, setMeta, getMeta, getStoredUser } from '../storage/db.js';
import { getFreshPosition } from '../utils/geolocation.js';
import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock.js';
import { flushSosQueue } from './sosQueue.js';
import { prefetchTiles } from './tileCache.js'; // offline map tiles
import { startBackgroundTracking, stopBackgroundTracking } from './backgroundTracker.js'; // Android background sync

const SYNC_INTERVAL_MS = Number(import.meta.env?.VITE_SYNC_INTERVAL_MS) || 300000; // 5 min

const hasNavigator = typeof navigator !== 'undefined';

let timer = null;
let running = false;
let syncing = false;
let listenersAttached = false;

const status = {
  online: hasNavigator ? navigator.onLine : true,
  tripActive: false,
  lastSyncedAt: null,
  alertResolved: false,
  error: null, // null | 'gps' | 'server'
};

const subscribers = new Set();

function emit() {
  const snapshot = { ...status };
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch {
      // a bad subscriber must not break the others
    }
  });
}

function update(patch) {
  Object.assign(status, patch);
  emit();
}

export function getStatus() {
  return { ...status };
}

// Subscribe to status changes. Calls cb right away with the current status.
// Returns an unsubscribe function.
export function subscribeStatus(cb) {
  subscribers.add(cb);
  cb({ ...status });
  return () => subscribers.delete(cb);
}

async function readBattery() {
  try {
    if (hasNavigator && navigator.getBattery) {
      const b = await navigator.getBattery();
      return Math.round(b.level * 100);
    }
  } catch {
    // not available
  }
  return null;
}

// One sync run. Never throws: failures just update the status and keep the old cache.
// posOverride: position given by the Android background tracker (optional).
export async function syncNow(posOverride) {
  if (syncing) return;
  syncing = true;
  try {
    // Use the position from the background tracker if we got one,
    // otherwise read the GPS as before.
    let pos = posOverride && typeof posOverride.lat === 'number' ? posOverride : null;
    if (!pos) {
      try {
        pos = await getFreshPosition();
      } catch {
        update({ error: 'gps' });
        return;
      }
    }

    const battery = await readBattery();

    const res = await syncApi({
      userId: await currentUserId(),
      lat: pos.lat,
      lng: pos.lng,
      battery,
      timestamp: new Date().toISOString(),
    });

    // Replace (not merge) the cached list.
    await replacePlaces(Array.isArray(res.places) ? res.places : []);
    const now = new Date().toISOString();
    await setMeta({ lastSyncedAt: now });

    update({
      online: true,
      lastSyncedAt: now,
      alertResolved: Boolean(res.alertResolved),
      error: null,
    });

    // We are definitely online now, so send any SOS that was waiting.
    flushSosQueue();

    // Download map tiles around the user in the background (no await).
    prefetchTiles(pos.lat, pos.lng);
  } catch (err) {
    if (err.isNetworkError) {
      update({ online: false });
    } else {
      // Server reachable but returned an error. Keep the old cache.
      update({ online: true, error: 'server' });
    }
  } finally {
    syncing = false;
  }
}

async function currentUserId() {
  const user = await getStoredUser();
  if (!user) throw new Error('No user registered');
  return user.userId;
}

function handleOnline() {
  update({ online: !isForcedOffline() });
  if (running && !isForcedOffline()) syncNow(); // sync right away when internet returns
}

function handleOffline() {
  update({ online: false });
}

// The Online/Offline badge must follow the browser even when no trip is running,
// so these listeners are attached once, when this module loads.
if (!listenersAttached && typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  listenersAttached = true;
}

// Load the last sync time saved on the phone, so the badge is right after a reload.
export async function restoreStatus() {
  const meta = await getMeta();
  update({
    lastSyncedAt: meta.lastSyncedAt || null,
    tripActive: Boolean(meta.tripActive) && running,
  });
}

// Start syncing: run once now, then every SYNC_INTERVAL_MS.
export async function startSync() {
  if (running) return;
  running = true;
  await setMeta({ tripActive: true });
  update({ tripActive: true });

  requestWakeLock();
  syncNow();
  timer = setInterval(() => syncNow(), SYNC_INTERVAL_MS);
  startBackgroundTracking((p) => syncNow(p)); // keeps syncing in the Android app when locked
}

export async function stopSync() {
  running = false;
  if (timer) clearInterval(timer);
  timer = null;

  stopBackgroundTracking();
  releaseWakeLock();
  await setMeta({ tripActive: false });
  update({ tripActive: false });
}

// Demo panel: "Simulate no internet". Blocks all API calls and shows Offline.
// Turning it off syncs again straight away if a trip is active.
export function setSimulatedOffline(value) {
  setForceOffline(value);
  if (value) {
    update({ online: false });
  } else {
    update({ online: hasNavigator ? navigator.onLine : true });
    if (running) syncNow();
    flushSosQueue();
  }
}