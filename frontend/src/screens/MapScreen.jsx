import { useMemo, useState } from 'react';
import Logo from '../components/Logo.jsx';
import BottomNav from '../components/BottomNav.jsx';
import MapView from '../components/MapView.jsx';
import Icon from '../components/Icon.jsx';
import { kindLabel } from '../components/PlaceCard.jsx';
import { latOf, lngOf, km } from '../utils/format.js';

const FALLBACK = [30.9, 75.85]; // Ludhiana, used only until a GPS fix or saved help exists
const COLORS = { hospital: '#ef4444', police: '#3b82f6', highway: '#22c55e', patrol: '#a855f7' };
const CAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16V12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4M5 16h14M7.5 13h.01M16.5 13h.01"/></svg>';
const GLYPH = { hospital: '+', police: 'P', highway: 'H', patrol: CAR };
const CHIPS = [
  { id: 'fuel', label: 'Fuel', icon: 'fuel', color: '#f59e0b' },
  { id: 'hospital', label: 'Hospital', icon: 'cross', color: '#ef4444' },
  { id: 'police', label: 'Police', icon: 'shield', color: '#3b82f6' },
  { id: 'highway', label: 'Highway', icon: 'road', color: '#22c55e' },
  { id: 'patrol', label: 'Patrol', icon: 'car', color: '#a855f7' },
];

export default function MapScreen({ help, onLogoTap }) {
  const [q, setQ] = useState('');
  const [chip, setChip] = useState('all'); // 'all' means no filter; tap a chip again to clear it
  const [follow, setFollow] = useState(0);

  const pos = help?.position;
  const me = pos ? [latOf(pos) ?? pos.latitude, lngOf(pos) ?? pos.longitude] : null;
  const center = me && me[0] != null ? me : FALLBACK;

  const markers = useMemo(() => {
    const out = [];
    for (const k of ['hospital', 'police', 'highway', 'patrol']) {
      if (chip !== 'all' && chip !== k) continue;
      (help?.[k] || []).forEach((p, i) => {
        const lat = latOf(p);
        const lng = lngOf(p);
        if (lat == null || lng == null) return;
        const name = p.name || kindLabel(k);
        if (q && !`${name} ${kindLabel(k)}`.toLowerCase().includes(q.toLowerCase())) return;
        out.push({
          id: `${k}-${p.id ?? i}`,
          lat,
          lng,
          color: COLORS[k],
          glyph: GLYPH[k],
          title: name,
          subtitle: `${kindLabel(k)} - ${km(p.distanceKm)}`,
        });
      });
    }
    if (me && me[0] != null) {
      out.push({ id: 'me', lat: me[0], lng: me[1], color: '#facc15', glyph: '', title: 'You are here' });
    }
    return out;
  }, [help, chip, q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="screen screen--map">
      <header className="topbar topbar--tight">
        <Logo onTap={onLogoTap} />
      </header>

      <label className="searchbar">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for fuel, hospital, safe spot..."
          aria-label="Search saved places"
        />
      </label>

      <div className="chips" role="tablist" aria-label="Filter places">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={chip === c.id}
            className={'chip' + (chip === c.id ? ' is-active' : '')}
            style={{ '--c': c.color }}
            onClick={() => setChip(chip === c.id ? 'all' : c.id)}
          >
            <Icon name={c.icon} size={14} /> {c.label}
          </button>
        ))}
      </div>

      <div className="map-frame">
        <MapView center={center} zoom={12} markers={markers} recenterKey={follow} />
        <div className="map-fabs">
          <button type="button" aria-label="Centre on my location" onClick={() => setFollow((n) => n + 1)}>
            <Icon name="locate" size={20} />
          </button>
        </div>
        {chip === 'fuel' && <p className="map-note">Fuel stations are not part of the saved data yet.</p>}
      </div>

      <BottomNav route="/map" />
    </main>
  );
}
