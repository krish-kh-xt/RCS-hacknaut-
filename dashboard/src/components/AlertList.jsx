import { timeAgo, formatLatLng } from '../services/format.js';

const DOT = { sos: 'red', silence: 'yellow', resolved: 'green' };

export default function AlertList({ open, resolved, selectedId, onSelect, onViewAll }) {
  const rows = [
    ...open.map((a) => ({ ...a, kind: a.type })),
    ...resolved.map((a) => ({ ...a, kind: 'resolved' })),
  ]
    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
    .slice(0, 6);

  return (
    <div className="recent">
      <div className="recent-head">
        <h3>Recent Alerts</h3>
        <button className="link" onClick={onViewAll}>View All →</button>
      </div>
      {rows.length === 0 && <p className="muted pad">No alerts yet.</p>}
      <ul>
        {rows.map((a) => {
          const title = a.kind === 'resolved' ? 'Alert Resolved' : a.kind === 'silence' ? 'Silence Alert' : 'SOS Alert';
          return (
            <li
              key={`${a.kind}-${a.id}`}
              className={`recent-item ${a.id === selectedId ? 'selected' : ''}`}
              onClick={() => onSelect?.(a.id)}
            >
              <span className={`ri-icon ${DOT[a.kind]}`}>{a.kind === 'resolved' ? '✓' : '!'}</span>
              <div className="ri-body">
                <div className="ri-top">
                  <span className={`ri-title ${DOT[a.kind]}`}>{title}</span>
                  <span className="ri-time">{timeAgo(a.time)}</span>
                </div>
                <div className="ri-loc"><strong>{a.name}</strong></div>
                <div className="ri-loc">{a.address || formatLatLng(a.lat, a.lng)}</div>
                {a.kind !== 'resolved' && (
                  <span className={`tag ${a.kind === 'silence' ? 'tag-yellow' : 'tag-red'}`}>
                    {a.status === 'pending' ? (a.kind === 'silence' ? 'SILENCED' : 'PENDING') : a.status}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
