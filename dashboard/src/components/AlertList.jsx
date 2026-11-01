import ResolveButton from './ResolveButton.jsx';

// "47 minutes ago" from an ISO timestamp.
function timeAgo(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

const STATUS_LABEL = { SMS_SENT: 'Waiting for reply', ESCALATED: 'Escalated to patrol', RESOLVED: 'Resolved' };
const STATUS_CLASS = { SMS_SENT: 'badge-wait', ESCALATED: 'badge-alert', RESOLVED: 'badge-ok' };
const SOURCE_LABEL = { SILENCE: 'No contact', SOS: 'SOS pressed' };

export default function AlertList({ alerts, units, selectedId, onSelect, onResolved, loaded }) {
  if (!loaded) return <p className="empty">Loading alerts...</p>;

  if (alerts.length === 0) {
    return (
      <div className="empty">
        <h2>No open alerts</h2>
        <p>When a traveller goes silent or presses SOS, they will appear here and on the map.</p>
      </div>
    );
  }

  return (
    <ul className="alert-list">
      {alerts.map((a) => {
        const open = a.id === selectedId;
        const unit = units.find((u) => u.id === a.patrolUnitId);
        return (
          <li key={a.id} className={`alert-card ${open ? 'alert-card-open' : ''}`}>
            <button
              type="button"
              className="alert-head"
              onClick={() => onSelect(open ? null : a.id)}
              aria-expanded={open}
            >
              <span className="alert-name">{a.name}</span>
              <span className="alert-seen">Last seen {timeAgo(a.lastSeen)}</span>
              <span className="badges">
                <span className={`badge ${STATUS_CLASS[a.status] || ''}`}>{STATUS_LABEL[a.status] || a.status}</span>
                <span className={`badge ${a.source === 'SOS' ? 'badge-alert' : 'badge-plain'}`}>
                  {SOURCE_LABEL[a.source] || a.source}
                </span>
              </span>
            </button>

            {open && (
              <div className="alert-body">
                <dl>
                  <dt>Phone</dt>
                  <dd><a href={`tel:${a.phone}`}>{a.phone}</a></dd>
                  <dt>Emergency contact</dt>
                  <dd>{a.emergencyPhone ? <a href={`tel:${a.emergencyPhone}`}>{a.emergencyPhone}</a> : 'Not given'}</dd>
                  <dt>Last location</dt>
                  <dd>{Number(a.lastLat).toFixed(4)}, {Number(a.lastLng).toFixed(4)}</dd>
                  <dt>Alert raised</dt>
                  <dd>{timeAgo(a.createdAt)}</dd>
                  <dt>Patrol unit</dt>
                  <dd>
                    {unit ? (
                      <>{unit.name}{unit.phone ? <> (<a href={`tel:${unit.phone}`}>{unit.phone}</a>)</> : null}</>
                    ) : (
                      'Not assigned yet'
                    )}
                  </dd>
                </dl>
                <ResolveButton alertId={a.id} onResolved={onResolved} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
