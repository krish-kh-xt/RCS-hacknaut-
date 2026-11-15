import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatLatLng, mapsUrl, triggerLabel } from '../services/format.js';

const DEFAULT_CENTER = [30.9, 75.85]; // Ludhiana
// Optional: a dark tile URL that needs a key, e.g. MapTiler or CARTO with a key.
// Leave unset to use free OpenStreetMap tiles darkened with CSS.
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL;

function pin(kind, selected) {
  const html =
    kind === 'unit'
      ? '<span class="pin pin-unit"><i>🚓</i></span>'
      : `<span class="pin ${kind === 'silence' ? 'pin-silence' : 'pin-sos'} ${selected ? 'pin-selected' : ''}"><b>!</b></span>`;
  return L.divIcon({ html, className: 'pin-wrap', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -16] });
}

function FitToData({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length]);
  return null;
}

// When an alert is picked in the list, move the map to it.
function FlyToSelected({ alert }) {
  const map = useMap();
  useEffect(() => {
    if (alert && alert.lat != null && alert.lng != null) {
      map.flyTo([alert.lat, alert.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alert?.id]);
  return null;
}

export default function AlertMap({ alerts, units, selectedId, onSelect }) {
  const alertPts = alerts.filter((a) => a.lat != null && a.lng != null);
  const unitPts = units.filter((u) => u.lat != null && u.lng != null);
  const all = [...alertPts, ...unitPts].map((p) => [p.lat, p.lng]);

  return (
    <div className="map-card">
      <MapContainer center={DEFAULT_CENTER} zoom={11} className={`map ${TILE_URL ? '' : 'dark-map'}`} zoomControl minZoom={3}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url={TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
          minZoom={3}
          maxZoom={18}
          noWrap
        />
        <FitToData points={all} />
        <FlyToSelected alert={alertPts.find((a) => a.id === selectedId)} />
        {unitPts.map((u) => (
          <Marker key={`u-${u.id}`} position={[u.lat, u.lng]} icon={pin('unit')}>
            <Popup>{u.name}</Popup>
          </Marker>
        ))}
        {alertPts.map((a) => (
          <Marker
            key={`a-${a.id}`}
            position={[a.lat, a.lng]}
            icon={pin(a.type, a.id === selectedId)}
            eventHandlers={{ click: () => onSelect?.(a.id) }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{a.type === 'silence' ? 'Silence Alert' : 'SOS Alert'}</strong>
                <span>{a.name}{a.phone && a.phone !== '—' ? ` · ${a.phone}` : ''}</span>
                <span>{triggerLabel(a.type)}</span>
                <span>{formatLatLng(a.lat, a.lng)}</span>
                {mapsUrl(a.lat, a.lng) && (
                  <a href={mapsUrl(a.lat, a.lng)} target="_blank" rel="noreferrer">Open in Google Maps</a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="legend">
        <span><i className="lg lg-sos" /> SOS Alert</span>
        <span><i className="lg lg-silence" /> Silence Alert</span>
        <span><i className="lg lg-unit" /> Patrol Unit</span>
      </div>
    </div>
  );
}
