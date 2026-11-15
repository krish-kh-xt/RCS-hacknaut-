import { useState } from 'react';
import StatCards from '../components/StatCards.jsx';
import AlertMap from '../components/AlertMap.jsx';
import AlertList from '../components/AlertList.jsx';
import ResolveButton from '../components/ResolveButton.jsx';
import { clockTime, formatLatLng, mapsUrl, triggerLabel } from '../services/format.js';

export default function Home({ data, onViewAll }) {
  const { openAlerts, resolvedAlerts, units, resolvedToday, refresh } = data;
  const [selectedId, setSelectedId] = useState(null);
  const selected = openAlerts.find((a) => a.id === selectedId);
  const online = units.filter((u) => u.online).length;

  return (
    <>
      <StatCards active={openAlerts.length} online={online} resolvedToday={resolvedToday} />
      <div className="home-grid">
        <div className="home-left">
          <AlertMap alerts={openAlerts} units={units} selectedId={selectedId} onSelect={setSelectedId} />
          {selected && (
            <div className="detail">
              <div>
                <strong>{selected.name}</strong>
                <span className="muted"> · {selected.phone}</span>
              </div>
              <div className="muted">
                {triggerLabel(selected.type)} · Last seen {clockTime(selected.lastSeen)}
              </div>
              <div className="muted">
                Location: {selected.address || formatLatLng(selected.lat, selected.lng)}
                {mapsUrl(selected.lat, selected.lng) && (
                  <> · <a href={mapsUrl(selected.lat, selected.lng)} target="_blank" rel="noreferrer">Open in Google Maps</a></>
                )}
              </div>
              <div className="muted">Emergency contact: {selected.emergencyContact}</div>
              <ResolveButton id={selected.id} onDone={refresh} className="btn-solid" />
            </div>
          )}
        </div>
        <AlertList
          open={openAlerts}
          resolved={resolvedAlerts}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onViewAll={onViewAll}
        />
      </div>
    </>
  );
}
