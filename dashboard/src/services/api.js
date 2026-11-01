// All calls to the RCS backend (API contract, section 7).
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // empty or non-JSON body
  }
  if (!res.ok) throw new Error((body && body.error) || `Request failed (${res.status})`);
  return body;
}

// GET /alerts?status=open  -> open alerts (status is not RESOLVED)
export const getAlerts = () => request('/alerts?status=open');

// GET /patrol-units  -> [{ id, name, phone, lat, lng }]
export const getPatrolUnits = () => request('/patrol-units');

// POST /alerts/:id/resolve  -> { ok: true }
export const resolveAlert = (id) => request(`/alerts/${id}/resolve`, { method: 'POST' });
