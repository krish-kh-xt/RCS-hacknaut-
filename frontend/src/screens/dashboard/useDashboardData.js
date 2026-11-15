import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';
const EVERY = Number(import.meta.env.VITE_SYNC_INTERVAL_MS) || 300000;

// Sample data shown when the backend cannot be reached, so the dashboard still renders.
const now = Date.now();
const min = (m) => now - m * 60000;
export const SAMPLE_ALERTS = [
  { id: 1, type: 'SOS', lat: 30.91, lng: 75.86, location: 'Near Dehlon, Ludhiana', time: min(2), status: 'Pending' },
  { id: 2, type: 'Silence', lat: 30.95, lng: 75.92, location: 'Near NH 44', time: min(14), status: 'Pending' },
  { id: 3, type: 'SOS', lat: 30.86, lng: 75.8, location: 'Near Jagraon Road', time: min(25), status: 'Pending' },
  { id: 4, type: 'Silence', lat: 30.99, lng: 75.78, location: 'Near Sidhwan Bet', time: min(62), status: 'Pending' },
  { id: 5, type: 'Alert', lat: 30.82, lng: 75.97, location: 'Near Pakhowal Road', time: min(95), status: 'Resolved' },
];
export const SAMPLE_PATROLS = [
  { id: 1, name: 'Patrol 1', lat: 30.9, lng: 75.88, online: true },
  { id: 2, name: 'Patrol 2', lat: 30.93, lng: 75.82, online: true },
  { id: 3, name: 'Patrol 3', lat: 30.88, lng: 75.94, online: true },
  { id: 4, name: 'Patrol 4', lat: 30.97, lng: 75.9, online: true },
  { id: 5, name: 'Patrol 5', lat: 30.84, lng: 75.85, online: true },
  { id: 6, name: 'Patrol 6', lat: 30.8, lng: 75.9, online: false },
];

function normType(t = '') {
  const s = String(t).toLowerCase();
  if (s.includes('sos')) return 'SOS';
  if (s.includes('silen')) return 'Silence';
  return 'Alert';
}
function normStatus(s = '') {
  const x = String(s).toLowerCase();
  if (x.includes('resolv') || x === 'closed') return 'Resolved';
  if (x.includes('assign') || x.includes('progress')) return 'Assigned';
  return 'Pending';
}

function normAlerts(list) {
  return (Array.isArray(list) ? list : []).map((a, i) => {
    // Backend alerts use lastLat / lastLng and `source` (SOS or SILENCE), see docs/api.md.
    const num = (v) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
    const lat = num(a.lastLat ?? a.last_lat ?? a.lat ?? a.latitude ?? a.location?.lat);
    const lng = num(a.lastLng ?? a.last_lng ?? a.lng ?? a.lon ?? a.longitude ?? a.location?.lng);
    const place = typeof a.location === 'string' ? a.location : a.locationName ?? a.address ?? null;
    return {
      id: a.id ?? a._id ?? i,
      type: normType(a.type ?? a.alertType ?? a.kind ?? a.source),
      lat,
      lng,
      location: place ?? (lat != null && lng != null ? `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}` : 'Location unknown'),
      time: a.createdAt ?? a.time ?? a.timestamp ?? Date.now(),
      status: normStatus(a.status),
    };
  });
}
function normPatrols(list) {
  return (Array.isArray(list) ? list : []).map((p, i) => ({
    id: p.id ?? p._id ?? i,
    name: p.name ?? `Patrol ${i + 1}`,
    lat: p.lat ?? p.latitude ?? null,
    lng: p.lng ?? p.lon ?? p.longitude ?? null,
    online: p.online ?? p.isOnline ?? p.status === 'online',
  }));
}

export default function useDashboardData() {
  const [data, setData] = useState({ alerts: SAMPLE_ALERTS, patrols: SAMPLE_PATROLS, live: false, updatedAt: Date.now() });

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const [a, p] = await Promise.all([
          fetch(`${API}/alerts`).then((r) => (r.ok ? r.json() : Promise.reject())),
          fetch(`${API}/patrol-units`).then((r) => (r.ok ? r.json() : Promise.reject())),
        ]);
        if (!stop)
          setData({
            alerts: normAlerts(a.alerts ?? a),
            patrols: normPatrols(p.patrolUnits ?? p.units ?? p),
            live: true,
            updatedAt: Date.now(),
          });
      } catch {
        if (!stop) setData((d) => ({ ...d, live: false }));
      }
    };
    load();
    const id = setInterval(load, EVERY);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  return data;
}
