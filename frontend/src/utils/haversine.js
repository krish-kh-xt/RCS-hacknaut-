// Haversine formula: straight-line distance between two GPS points, in km.
// Works fully offline, which is why it is used for "nearest help".
const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

export function distanceKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}
