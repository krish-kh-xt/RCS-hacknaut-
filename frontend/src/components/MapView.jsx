import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const TILE_URL = import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Coloured round pins drawn with CSS, so no marker image files are needed (works offline).
export function pinIcon(color, glyph = '') {
  return L.divIcon({
    className: 'map-pin-wrap',
    html: `<span class="map-pin" style="--pin:${color}">${glyph}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom());
  }, [center?.[0], center?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// markers: [{ id, lat, lng, color, glyph, title, subtitle }]
export default function MapView({ center, zoom = 12, markers = [], className = '', recenterKey, controls = true }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      attributionControl={false}
      className={'map-view ' + className}
      key={recenterKey}
    >
      <TileLayer url={TILE_URL} maxZoom={18} />
      <Recenter center={center} />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon(m.color, m.glyph)}>
          {(m.title || m.subtitle) && (
            <Popup>
              <strong>{m.title}</strong>
              {m.subtitle && <div>{m.subtitle}</div>}
            </Popup>
          )}
        </Marker>
      ))}
      {controls && <ZoomButtons />}
    </MapContainer>
  );
}

function ZoomButtons() {
  const map = useMap();
  return (
    <div className="map-zoom leaflet-top leaflet-left">
      <div className="leaflet-control">
        <button type="button" onClick={() => map.zoomIn()} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => map.zoomOut()} aria-label="Zoom out">&minus;</button>
      </div>
    </div>
  );
}
