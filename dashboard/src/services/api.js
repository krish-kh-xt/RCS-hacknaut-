const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

const asList = (data, key) => (Array.isArray(data) ? data : data?.[key] || data?.data || []);

function pickCoords(o) {
  const lat = o.lat ?? o.latitude ?? o.location?.lat ?? o.location?.latitude ?? o.coords?.lat;
  const lng = o.lng ?? o.lon ?? o.longitude ?? o.location?.lng ?? o.location?.longitude ?? o.coords?.lng;
  return { lat: lat != null ? Number(lat) : null, lng: lng != null ? Number(lng) : null };
}

export function normalizeAlert(a) {
  const { lat, lng } = pickCoords(a);
  const rawType = String(a.type ?? a.alertType ?? a.source ?? 'sos').toLowerCase();
  const rawStatus = String(a.status ?? 'open').toLowerCase();
  return {
    id: a.id ?? a._id,
    type: rawType.includes('silen') ? 'silence' : 'sos',
    status: rawStatus === 'resolved' ? 'resolved' : 'pending',
    name: a.name ?? a.userName ?? a.user?.name ?? 'Unknown traveller',
    phone: a.phone ?? a.user?.phone ?? '—',
    emergencyContact: a.emergencyContact ?? a.emergency_contact ?? a.user?.emergencyContact ?? '—',
    lastSeen: a.lastSeen ?? a.last_seen ?? a.updatedAt ?? a.createdAt ?? a.created_at ?? null,
    time: a.createdAt ?? a.created_at ?? a.timestamp ?? a.lastSeen ?? a.last_seen ?? null,
    source: a.source ?? 'app',
    address: a.address ?? a.locationName ?? a.landmark ?? null,
    lat,
    lng,
  };
}

export function normalizeUnit(u) {
  const { lat, lng } = pickCoords(u);
  return {
    id: u.id ?? u._id,
    name: u.name ?? u.unitName ?? 'Patrol unit',
    online: u.online ?? u.isOnline ?? (u.status ? String(u.status).toLowerCase() !== 'offline' : true),
    lat,
    lng,
  };
}

export async function getOpenAlerts() {
  return asList(await request('/alerts?status=open'), 'alerts').map(normalizeAlert);
}

export async function getResolvedAlerts() {
  return asList(await request('/alerts?status=resolved'), 'alerts').map(normalizeAlert);
}

export async function getPatrolUnits() {
  return asList(await request('/patrol-units'), 'units').map(normalizeUnit);
}

export function resolveAlert(id) {
  return request(`/alerts/${id}/resolve`, { method: 'POST' });
}
