import { useMemo, useState } from 'react';
import Logo from '../../components/Logo.jsx';
import Icon from '../../components/Icon.jsx';
import MapView from '../../components/MapView.jsx';
import useDashboardData from './useDashboardData.js';
import { timeAgo } from '../../utils/format.js';

const TYPE_COLOR = { SOS: '#ef4444', Silence: '#f59e0b', Alert: '#22c55e' };
const typeIcon = { SOS: 'alert', Silence: 'alert', Alert: 'check' };
const clock = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

function Sidebar({ page }) {
  return (
    <aside className="dash__side">
      <Logo compact />
      <nav aria-label="Dashboard">
        <a href="#/dashboard" className={page === 'home' ? 'is-active' : ''}>
          <Icon name="grid" size={18} /> Dashboard
        </a>
        <a href="#/dashboard/alerts" className={page === 'alerts' ? 'is-active' : ''}>
          <Icon name="bell" size={18} /> Alerts
        </a>
      </nav>
    </aside>
  );
}

function TopBar({ title, live, updatedAt, pending }) {
  return (
    <header className="dash__top">
      {title ? <h1>{title}</h1> : <span className={'live-pill' + (live ? '' : ' is-sample')}>
        <i /> {live ? 'Live Updates' : 'Sample data'} <small>Every 5 mins</small> <Icon name="refresh" size={13} />
      </span>}
      <span className="dash__right">
        <span className="dash__bell" title={`Updated ${timeAgo(updatedAt)}`}>
          <Icon name="bell" size={18} />
          {pending > 0 && <b>{pending}</b>}
        </span>
        <span className="dash__avatar" aria-label="Admin"><Icon name="users" size={16} /></span>
      </span>
    </header>
  );
}

function StatusPill({ s }) {
  return <span className={'pill pill--' + s.toLowerCase()}>{s}</span>;
}

function DashHome({ data }) {
  const { alerts, patrols } = data;
  const active = alerts.filter((a) => a.status !== 'Resolved');
  const online = patrols.filter((p) => p.online).length;
  const resolved = alerts.filter((a) => a.status === 'Resolved').length;

  const markers = [
    ...alerts
      .filter((a) => a.lat != null && a.lng != null)
      .map((a) => ({
        id: 'a' + a.id,
        lat: a.lat,
        lng: a.lng,
        color: TYPE_COLOR[a.type],
        glyph: a.type === 'Alert' ? '' : '!',
        title: `${a.type} Alert`,
        subtitle: a.location,
      })),
    ...patrols
      .filter((p) => p.online && p.lat != null)
      .map((p) => ({ id: 'p' + p.id, lat: p.lat, lng: p.lng, color: '#3b82f6', glyph: 'P', title: p.name, subtitle: 'Online' })),
  ];
  const center = markers.length ? [markers[0].lat, markers[0].lng] : [30.9, 75.85];

  return (
    <>
      <div className="stats">
        <div className="stat stat--red"><Icon name="bell" size={22} /><span>Active Alerts<b>{active.length}</b></span></div>
        <div className="stat stat--blue"><Icon name="users" size={22} /><span>Patrol Units<b>{online} Online</b></span></div>
        <div className="stat stat--green"><Icon name="check" size={22} /><span>Resolved Today<b>{resolved}</b></span></div>
      </div>
      <div className="dash__grid">
        <section className="panel panel--map">
          <MapView center={center} zoom={11} markers={markers} className="map-view--dash" />
          <div className="map-legend">
            <span><i style={{ background: TYPE_COLOR.SOS }} /> SOS Alert</span>
            <span><i style={{ background: TYPE_COLOR.Silence }} /> Silence Alert</span>
            <span><i style={{ background: '#3b82f6' }} /> Patrol Unit</span>
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>Recent Alerts</h2><a href="#/dashboard/alerts" className="link">View All</a></div>
          <ul className="recent">
            {alerts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <span className="recent__ico" style={{ color: TYPE_COLOR[a.type] }}><Icon name={typeIcon[a.type]} size={18} /></span>
                <span className="recent__txt"><strong>{a.type} Alert</strong><small>{a.location}</small></span>
                <span className="recent__time">{timeAgo(a.time)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function DashAlerts({ data }) {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');

  const rows = useMemo(
    () =>
      data.alerts.filter(
        (a) =>
          (!type || a.type === type) &&
          (!status || a.status === status) &&
          (!date || new Date(a.time).toISOString().slice(0, 10) === date)
      ),
    [data.alerts, type, status, date]
  );

  return (
    <>
      <div className="filters">
        <label>Alert Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option><option>SOS</option><option>Silence</option><option>Alert</option>
          </select>
        </label>
        <label>Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option><option>Pending</option><option>Assigned</option><option>Resolved</option>
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Alert Type</th><th>Location</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><span className="type-cell"><span className="type-dot" style={{ background: TYPE_COLOR[a.type] }}><Icon name={typeIcon[a.type]} size={13} stroke={2.6} /></span> <span>{a.type} Alert</span></span></td>
                <td><span className="loc-cell"><span className="loc-thumb" style={{ color: TYPE_COLOR[a.type] }}><Icon name="pin" size={14} /></span>{a.location}</span></td>
                <td>{clock(a.time)}</td>
                <td><StatusPill s={a.status} /></td>
                <td>
                  <a className="btn btn--small" href={a.lat != null ? `https://www.google.com/maps?q=${a.lat},${a.lng}` : undefined} target="_blank" rel="noreferrer">
                    View/Assign
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="5" className="table__empty">No alerts match these filters. Clear a filter to see more.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Dashboard({ route }) {
  const data = useDashboardData();
  const page = route.startsWith('/dashboard/alerts') ? 'alerts' : 'home';
  const pending = data.alerts.filter((a) => a.status === 'Pending').length;

  return (
    <div className="dash">
      <Sidebar page={page} />
      <div className="dash__main">
        <TopBar title={page === 'alerts' ? 'Alerts' : ''} live={data.live} updatedAt={data.updatedAt} pending={pending} />
        {page === 'alerts' ? <DashAlerts data={data} /> : <DashHome data={data} />}
      </div>
    </div>
  );
}
