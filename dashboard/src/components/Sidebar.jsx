import { HomeIcon, BellIcon, ShieldLogo } from './Icons.jsx';

export default function Sidebar({ page, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <ShieldLogo />
        <div>
          <div className="brand-name">RCS</div>
          <div className="brand-sub">Road Convenience Suite</div>
        </div>
      </div>
      <nav className="nav">
        <button className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => onNavigate('home')}>
          <HomeIcon /> Dashboard
        </button>
        <button className={`nav-item ${page === 'alerts' ? 'active' : ''}`} onClick={() => onNavigate('alerts')}>
          <BellIcon /> Alerts
        </button>
      </nav>
    </aside>
  );
}
