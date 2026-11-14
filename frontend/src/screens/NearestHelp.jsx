import Logo from '../components/Logo.jsx';
import BottomNav from '../components/BottomNav.jsx';
import PlaceCard, { kindLabel } from '../components/PlaceCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const KINDS = ['hospital', 'police', 'highway', 'patrol'];

export default function NearestHelp({ help, status, onLogoTap }) {
  return (
    <main className="screen screen--help">
      <header className="topbar">
        <Logo onTap={onLogoTap} />
      </header>
      <StatusBadge status={status} />

      <h1 className="page-title">Nearest help</h1>

      {help?.cacheEmpty && (
        <p className="notice">Nothing saved yet. Connect to the internet once and nearby help will be stored on this phone.</p>
      )}
      {help && !help.locationAvailable && !help.cacheEmpty && (
        <p className="notice">Location is off, so distances may be out of date.</p>
      )}

      {KINDS.map((k) => {
        const list = help?.[k] || [];
        return (
          <section key={k} className="help-group">
            <h2>{kindLabel(k)}</h2>
            {list.length === 0 ? (
              <p className="hint">None saved nearby.</p>
            ) : (
              list.slice(0, 5).map((p, i) => <PlaceCard key={p.id ?? i} kind={k} place={p} />)
            )}
          </section>
        );
      })}

      <BottomNav route="/help" />
    </main>
  );
}
