// IndexedDB storage for the traveller app (uses the `idb` helper).
// Three stores, as agreed in the team guide:
//   user     - key/value: 'profile' (userId, name, phones) and 'meta' (trip + sync info)
//   places   - the cached help list (replaced fully on every successful sync)
//   sosQueue - SOS requests waiting for internet
import { openDB } from 'idb';

const DB_NAME = 'rcs-db';
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user'); // out-of-line keys
        }
        if (!db.objectStoreNames.contains('places')) {
          // Place ids can repeat across types (a hospital 3 and a patrol unit 3),
          // so the key is "<type>-<id>".
          db.createObjectStore('places', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('sosQueue')) {
          db.createObjectStore('sosQueue', { keyPath: 'qid', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

/* ---------- user profile ---------- */

export async function saveUser(profile) {
  const db = await getDb();
  await db.put('user', profile, 'profile');
}

export async function getStoredUser() {
  const db = await getDb();
  return (await db.get('user', 'profile')) || null;
}

/* ---------- meta (trip active, last sync time, last known position, ...) ---------- */

export async function getMeta() {
  const db = await getDb();
  return (await db.get('user', 'meta')) || {};
}

export async function setMeta(patch) {
  const db = await getDb();
  const tx = db.transaction('user', 'readwrite');
  const current = (await tx.store.get('meta')) || {};
  await tx.store.put({ ...current, ...patch }, 'meta');
  await tx.done;
}

/* ---------- places cache ---------- */

// Replace the whole cached list in one transaction so a half-written list
// can never be read.
export async function replacePlaces(places) {
  const db = await getDb();
  const tx = db.transaction('places', 'readwrite');
  await tx.store.clear();
  for (const p of places) {
    await tx.store.put({ ...p, key: `${p.type}-${p.id}` });
  }
  await tx.done;
}

export async function getAllPlaces() {
  const db = await getDb();
  return db.getAll('places');
}

/* ---------- SOS queue ---------- */

export async function enqueueSos(entry) {
  const db = await getDb();
  return db.add('sosQueue', entry);
}

export async function getQueuedSos() {
  const db = await getDb();
  return db.getAll('sosQueue');
}

export async function removeQueuedSos(qid) {
  const db = await getDb();
  await db.delete('sosQueue', qid);
}
