const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    // The backend answers { error, detail? }. Put the useful part in the message.
    let why = res.statusText;
    try {
      const body = await res.json();
      why = body.detail || body.error || why;
    } catch {
      // not JSON: keep the status text
    }
    throw new Error(`${res.status}: ${why}`);
  }
  return res.json();
}

const asList = (data, key) => (Array.isArray(data) ? data : data?.[key] || data?.data || []);

// The backend sends alert positions as lastLat / lastLng (see docs/api.md) and patrol
// units as lat / lng. Other common spellings are accepted too.
function pickCoords(o) {
  const lat = o.lastLat ?? o.last_lat ?? o.lat ?? o.latitude ?? o.location?.lat ?? o.location?.latitude ?? o.coords?.lat;
  const lng = o.lastLng ?? o.last_lng ?? o.lng ?? o.lon ?? o.longitude ?? o.location?.lng ?? o.location?.longitude ?? o.coords?.lng;
  const toNum = (v) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  return { lat: toNum(lat), lng: toNum(lng) };
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
    emergencyContact:
      a.emergencyPhone ?? a.emergency_phone ?? a.emergencyContact ?? a.emergency_contact ?? a.user?.emergencyPhone ?? a.user?.emergencyContact ?? '—',
    lastSeen: a.lastSeen ?? a.last_seen ?? a.updatedAt ?? a.createdAt ?? a.created_at ?? null,
    time: a.createdAt ?? a.created_at ?? a.timestamp ?? a.lastSeen ?? a.last_seen ?? null,
    source: a.source ?? 'app',
    patrolUnitId: a.patrolUnitId ?? a.patrol_unit_id ?? null,
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
