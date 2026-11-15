import { useMemo, useState } from 'react';
import { ChevronDown, CalendarIcon, SortIcon } from '../components/Icons.jsx';
import ResolveButton from '../components/ResolveButton.jsx';
import { clockTime, dateKey, formatLatLng, mapsUrl, triggerLabel, typeLabel } from '../services/format.js';

function Thumb({ type }) {
  return (
    <div className="thumb">
      <span className={`pin-mini ${type === 'silence' ? 'yellow' : 'red'}`}>!</span>
    </div>
  );
}

export default function Alerts({ data }) {
  const { openAlerts, resolvedAlerts, refresh } = data;
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'time', dir: 'desc' });

  const rows = useMemo(() => {
    let list = [...openAlerts, ...resolvedAlerts];
    if (type) list = list.filter((a) => a.type === type);
    if (status) list = list.filter((a) => a.status === status);
    if (date) list = list.filter((a) => dateKey(a.time) === date);
    list.sort((a, b) => {
      const av = sort.key === 'time' ? new Date(a.time || 0).getTime() : String(a[sort.key] ?? '');
      const bv = sort.key === 'time' ? new Date(b.time || 0).getTime() : String(b[sort.key] ?? '');
      const c = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === 'asc' ? c : -c;
    });
    return list;
  }, [openAlerts, resolvedAlerts, type, status, date, sort]);

  const toggle = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const Th = ({ k, children }) => (
    <th onClick={() => toggle(k)} className="sortable">
      {children} <SortIcon />
    </th>
  );

  return (
    <div className="table-card">
      <div className="filters">
        <label className="select">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Alert Type</option>
            <option value="sos">SOS Alert</option>
            <option value="silence">Silence Alert</option>
          </select>
          <ChevronDown />
        </label>
        <label className="select date">
          <CalendarIcon />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        </label>
        <label className="select">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
          <ChevronDown />
        </label>
      </div>

      <table className="alerts-table">
        <thead>
          <tr>
            <Th k="type">Alert Type</Th>
            <th>Location</th>
            <Th k="time">Time</Th>
            <Th k="status">Status</Th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="muted empty">No alerts match.</td>
            </tr>
          )}
          {rows.map((a) => (
            <tr key={`${a.status}-${a.id}`}>
              <td>
                <span className="type-cell">
                  <span className={`ri-icon ${a.type === 'silence' ? 'yellow' : 'red'}`}>!</span>
                  {typeLabel(a.type)}
                </span>
              </td>
              <td>
                <div className="loc-cell">
                  <Thumb type={a.type} />
                  <span className="muted small">
                    <strong>{a.name}</strong> · {triggerLabel(a.type)}
                    <br />
                    {a.address || formatLatLng(a.lat, a.lng)}
                    {mapsUrl(a.lat, a.lng) && (
                      <> · <a href={mapsUrl(a.lat, a.lng)} target="_blank" rel="noreferrer">Map</a></>
                    )}
                  </span>
                </div>
              </td>
              <td>{clockTime(a.time)}</td>
              <td>
                <span className={`tag ${a.status === 'resolved' ? 'tag-green' : 'tag-red'}`}>
                  {a.status === 'resolved' ? 'Resolved' : 'Pending'}
                </span>
              </td>
              <td>
                {a.status === 'resolved' ? (
                  <button className="btn-outline" disabled>View</button>
                ) : (
                  <ResolveButton id={a.id} onDone={refresh} label="View/Assign" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
