import { Capacitor, registerPlugin } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');
const INTERVAL_MS = Number(import.meta.env?.VITE_SYNC_INTERVAL_MS) || 300000;

let watcherId = null;
let lastRun = 0;

// Runs only inside the Android app. In the browser it does nothing.
export async function startBackgroundTracking(onTick) {
  if (!Capacitor.isNativePlatform() || watcherId) return;
  watcherId = await BackgroundGeolocation.addWatcher(
    {
      backgroundTitle: 'RCS trip active',
      backgroundMessage: 'Keeping you safe. Tap to open.',
      requestPermissions: true,
      stale: false,
      distanceFilter: 0,
    },
    (location, error) => {
      if (error || !location) return;
      const now = Date.now();
      if (now - lastRun < INTERVAL_MS) return; // sync once per interval
      lastRun = now;
      onTick({ lat: location.latitude, lng: location.longitude });
    }
  );
}

export async function stopBackgroundTracking() {
  if (!watcherId) return;
  try { await BackgroundGeolocation.removeWatcher({ id: watcherId }); } catch {}
  watcherId = null;
}