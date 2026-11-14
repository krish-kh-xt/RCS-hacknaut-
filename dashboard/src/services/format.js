export function formatLatLng(lat, lng) {
  if (lat == null || lng == null) return 'Location unknown';
  return `Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`;
}

export function timeAgo(value) {
  if (!value) return '—';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export function clockTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function dateKey(value) {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const typeLabel = (t) => (t === 'silence' ? 'Silence Alert' : 'SOS Alert');
