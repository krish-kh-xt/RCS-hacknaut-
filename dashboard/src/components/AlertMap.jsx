import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [31.2, 76.5];

// Fits the map to the markers once, and flies to an alert when it is selected.
function Viewport({ alerts, units, selected }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current) return;
    const points = [...alerts.map((a) => [a.lastLat, a.lastLng]), ...units.map((u) => [u.lat, u.lng])];
    if (points.length) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
      fitted.current = true;
    }
  }, [alerts, units, map]);

  const selectedId = selected ? selected.id : null;
  useEffect(() => {
    if (selected) map.flyTo([selected.lastLat, selected.lastLng], Math.max(map.getZoom(), 12), { duration: 0.6 });
    // only when the selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return null;
}

export default function AlertMap({ alerts, units, selected, onSelect }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={9} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Viewport alerts={alerts} units={units} selected={selected} />

      {/* Blue: patrol units */}
      {units.map((u) => (
        <CircleMarker
          key={`unit-${u.id}`}
          center={[u.lat, u.lng]}
          radius={7}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#1F6FB2', fillOpacity: 1 }}
        >
          <Tooltip>{u.name}</Tooltip>
        </CircleMarker>
      ))}

      {/* Red: alerts at the last known location (drawn last so they sit on top) */}
      {alerts.map((a) => {
        const isSelected = selected && selected.id === a.id;
        return (
          <CircleMarker
            key={`alert-${a.id}`}
            center={[a.lastLat, a.lastLng]}
            radius={isSelected ? 15 : 11}
            pathOptions={{
              color: isSelected ? '#14213D' : '#ffffff',
              weight: isSelected ? 4 : 2,
              fillColor: '#C8102E',
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(a.id) }}
          >
            <Tooltip>{a.name}</Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
