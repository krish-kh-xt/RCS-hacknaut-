import { useCallback, useEffect, useState } from 'react';
import AlertMap from '../components/AlertMap.jsx';
import AlertList from '../components/AlertList.jsx';
import { getAlerts, getPatrolUnits } from '../services/api.js';

const POLL_MS = 10000; // refresh every 10 seconds

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [online, setOnline] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [a, u] = await Promise.all([getAlerts(), getPatrolUnits()]);
      setAlerts(a);
      setUnits(u);
      setOnline(true);
    } catch {
      setOnline(false); // keep showing the last data
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const selected = alerts.find((a) => a.id === selectedId) || null;

  return (
    <div className="page">
      <header className="topbar">
        <h1>RCS Patrol control room</h1>
        <div className="legend" aria-label="Map legend">
          <span><i className="dot dot-alert" /> Traveller needing a check</span>
          <span><i className="dot dot-unit" /> Patrol unit</span>
        </div>
        <div className={`status ${online ? 'status-ok' : 'status-down'}`} role="status">
          {online ? `Live: ${alerts.length} open ${alerts.length === 1 ? 'alert' : 'alerts'}` : 'Reconnecting'}
        </div>
      </header>

      {!online && (
        <div className="banner" role="alert">
          Cannot reach the server. Showing the last data and retrying every 10 seconds.
        </div>
      )}

      <main className="main">
        <section className="map-wrap" aria-label="Map of alerts and patrol units">
          <AlertMap alerts={alerts} units={units} selected={selected} onSelect={setSelectedId} />
        </section>
        <aside className="panel" aria-label="Open alerts">
          <AlertList
            alerts={alerts}
            units={units}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onResolved={refresh}
            loaded={loaded}
          />
        </aside>
      </main>
    </div>
  );
}
