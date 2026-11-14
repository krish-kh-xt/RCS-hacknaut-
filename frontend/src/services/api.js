// Thin fetch wrapper. Reads the base URL from VITE_API_URL.
// Field names and endpoints follow section 7 of the team guide (fixed contract).

const BASE_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const TIMEOUT_MS = 15000;

// Used by the demo panel's "Simulate no internet" button.
let forceOffline = false;
export function setForceOffline(value) {
  forceOffline = Boolean(value);
}
export function isForcedOffline() {
  return forceOffline;
}

// Network-level failure (no internet, timeout, DNS, forced offline).
// Callers use `isNetworkError` to decide: queue and retry, or show an error.
export class NetworkError extends Error {
  constructor(message = 'Network unavailable') {
    super(message);
    this.name = 'NetworkError';
    this.isNetworkError = true;
  }
}

// The server answered, but with an error status.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = false;
  }
}

async function request(method, path, body) {
  if (forceOffline) throw new NetworkError('Simulated offline');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store', // never reuse a cached API response
    });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

/* ---------- endpoints used by the traveller app ---------- */

export const createUser = ({ name, phone, emergencyPhone }) =>
  request('POST', '/users', { name, phone, emergencyPhone });

export const startTripApi = (userId) => request('POST', '/trip/start', { userId });

export const endTripApi = (userId) => request('POST', '/trip/end', { userId });

export const syncApi = ({ userId, lat, lng, battery, timestamp }) =>
  request('POST', '/sync', { userId, lat, lng, battery, timestamp });

export const sosApi = ({ userId, lat, lng }) => request('POST', '/sos', { userId, lat, lng });

/* ---------- demo endpoints (backend must run with DEMO_MODE=true) ---------- */

export const demoSilenceApi = (userId) => request('POST', `/demo/silence/${userId}`);
export const demoReplyApi = (userId) => request('POST', `/demo/reply/${userId}`);
export const demoResetApi = () => request('POST', '/demo/reset');
