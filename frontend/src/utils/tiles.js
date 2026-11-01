export const lng2x = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z);
export const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

// All tile coordinates covering a square of radiusKm around a point
export function tilesAround(lat, lng, radiusKm, zooms) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  const out = [];
  for (const z of zooms) {
    const x0 = lng2x(lng - dLng, z), x1 = lng2x(lng + dLng, z);
    const y0 = lat2y(lat + dLat, z), y1 = lat2y(lat - dLat, z); // y grows southward
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++) out.push({ z, x, y });
  }
  return out;
}