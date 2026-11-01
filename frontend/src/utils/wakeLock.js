// Keeps the screen awake so the PWA can keep syncing (a PWA only syncs
// reliably while it is open). Browsers release the lock when the tab is
// hidden, so we ask for it again when the tab becomes visible.
let sentinel = null;
let wanted = false;

async function acquire() {
  if (!('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    // Denied (battery saver, not visible, ...). Not fatal.
    sentinel = null;
  }
}

function onVisibility() {
  if (wanted && document.visibilityState === 'visible' && !sentinel) {
    acquire();
  }
}

export async function requestWakeLock() {
  wanted = true;
  document.addEventListener('visibilitychange', onVisibility);
  await acquire();
}

export async function releaseWakeLock() {
  wanted = false;
  document.removeEventListener('visibilitychange', onVisibility);
  if (sentinel) {
    try {
      await sentinel.release();
    } catch {
      // ignore
    }
    sentinel = null;
  }
}
