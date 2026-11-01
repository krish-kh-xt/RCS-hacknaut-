// GPS helpers. GPS works with no internet, so this is safe to use offline.
// Geolocation needs HTTPS (localhost is the only exception).
import { getMeta, setMeta } from '../storage/db.js';

// Ask the device for a fresh position. Resolves { lat, lng } or throws.
export function getFreshPosition({ timeoutMs = 15000, highAccuracy = true } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // Remember it as the "last known" position (best effort, never blocks).
        setMeta({ lastPosition: { ...point, at: new Date().toISOString() } }).catch(() => {});
        resolve(point);
      },
      (err) => reject(new Error(err.message || 'Could not get location')),
      { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 30000 }
    );
  });
}

// Fresh position if possible, otherwise the last known one saved earlier.
// Returns { lat, lng, fresh } or null if there is nothing at all.
export async function getBestPosition(options) {
  try {
    const p = await getFreshPosition(options);
    return { ...p, fresh: true };
  } catch {
    const meta = await getMeta();
    if (meta.lastPosition) {
      return { lat: meta.lastPosition.lat, lng: meta.lastPosition.lng, fresh: false };
    }
    return null;
  }
}
