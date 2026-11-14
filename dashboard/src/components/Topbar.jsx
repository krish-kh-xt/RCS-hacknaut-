import { RefreshIcon, BellIcon, UserIcon } from './Icons.jsx';

export default function Topbar({ title, openCount, onRefresh, pollSeconds, error }) {
  return (
    <header className="topbar">
      {title ? (
        <h1 className="topbar-title">{title}</h1>
      ) : (
        <div className="live-pill">
          <span className={`dot ${error ? 'dot-off' : ''}`} />
          <span>{error ? error : `Live Updates · Every ${pollSeconds} sec`}</span>
          <button className="icon-btn" onClick={onRefresh} aria-label="Refresh now">
            <RefreshIcon />
          </button>
        </div>
      )}
      <div className="topbar-right">
        <button className="round-btn" aria-label="Notifications">
          <BellIcon />
          {openCount > 0 && <span className="badge-dot" />}
        </button>
        <button className="round-btn" aria-label="Profile">
          <UserIcon />
        </button>
      </div>
    </header>
  );
}
