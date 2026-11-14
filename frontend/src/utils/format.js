// Small display helpers used by the UI only.
export function timeAgo(ts) {
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  if (!t || Number.isNaN(t)) return '';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function km(n) {
  return typeof n === 'number' && Number.isFinite(n) ? `${n.toFixed(1)} km` : '--';
}

export function latOf(p) {
  return p?.lat ?? p?.latitude ?? null;
}
export function lngOf(p) {
  return p?.lng ?? p?.lon ?? p?.longitude ?? null;
}
