import { tilesAround } from '../utils/tiles';

export const TILE_URL =
  import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 14;
const RADIUS_KM = 15;
const REDOWNLOAD_AFTER_KM = 5;

const fill = (t) => TILE_URL.replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y);

function distKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Call after every successful /sync. Downloads only when the user has moved far enough.
export async function prefetchTiles(lat, lng, onProgress) {
  try {
    const last = JSON.parse(localStorage.getItem('tileCenter') || 'null');
    if (last && distKm(last, { lat, lng }) < REDOWNLOAD_AFTER_KM) return;

    const tiles = tilesAround(lat, lng, RADIUS_KM, [10, 11, 12, 13, 14]);
    let done = 0, i = 0;
    const worker = async () => {
      while (i < tiles.length) {
        const t = tiles[i++];
        try { await fetch(fill(t)); } catch { /* ignore, retry next sync */ }
        onProgress?.(++done, tiles.length);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    localStorage.setItem('tileCenter', JSON.stringify({ lat, lng }));
  } catch (e) { console.warn('tile prefetch failed', e); }
}