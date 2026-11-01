import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getAllPlaces } from '../storage/db.js';
import { TILE_URL, MIN_ZOOM, MAX_ZOOM } from '../services/tileCache.js';

const COLORS = { hospital: '#d62828', police: '#1d4ed8', highway: '#f59e0b', patrol: '#059669' };
const LABELS = { hospital: 'Hospital', police: 'Police', highway: 'Highway help', patrol: 'Patrol unit' };

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function Recenter({ pos }) {
  const map = useMap();
  return (
    <button className="recenter-btn" onClick={() => pos && map.setView([pos.lat, pos.lng], 13)}>
      Recenter
    </button>
  );
}

export default function OfflineMap() {
  const [pos, setPos] = useState(null);
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    getAllPlaces().then((p) => setPlaces(p || []));
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const center = pos ? [pos.lat, pos.lng] : [31.2, 76.5]; // fallback: demo region

  return (
    <div className="map-screen">
      <MapContainer center={center} zoom={13} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM}
                    style={{ height: '100%', width: '100%' }}>
        <TileLayer url={TILE_URL} attribution="© OpenStreetMap contributors" />

        {pos && (
          <CircleMarker center={[pos.lat, pos.lng]} radius={9}
            pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}>
            <Popup>You are here</Popup>
          </CircleMarker>
        )}

        {places.map((p) => (
          <CircleMarker key={`${p.type}-${p.id}`} center={[p.lat, p.lng]} radius={8}
            pathOptions={{ color: '#fff', weight: 2, fillColor: COLORS[p.type], fillOpacity: 1 }}>
            <Popup>
              <b>{p.name}</b><br />
              {LABELS[p.type]}{p.highwayRef ? ` (${p.highwayRef})` : ''}<br />
              {pos && <>{distKm(pos.lat, pos.lng, p.lat, p.lng).toFixed(1)} km away<br /></>}
              {p.phone && <a href={`tel:${p.phone}`}>Call {p.phone}</a>}
            </Popup>
          </CircleMarker>
        ))}
        <Recenter pos={pos} />
      </MapContainer>

      <div className="map-legend">
        {Object.keys(COLORS).map((t) => (
          <span key={t}><i style={{ background: COLORS[t] }} />{LABELS[t]}</span>
        ))}
      </div>
    </div>
  );
}