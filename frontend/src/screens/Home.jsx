import Logo from '../components/Logo.jsx';
import HomeBackdrop from '../components/HomeBackdrop.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SosButton from '../components/SosButton.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Icon from '../components/Icon.jsx';
import { KindIcon, kindLabel } from '../components/PlaceCard.jsx';

const KINDS = ['hospital', 'police', 'highway', 'patrol'];
const dist = (p) => (typeof p?.distanceKm === 'number' ? `${p.distanceKm.toFixed(1)}km` : '--');

export default function Home({ status, help, sosState, onSos, onStartTrip, onEndTrip, onLogoTap }) {
  const hasCache = help && !help.cacheEmpty;
  const trip = !!status?.tripActive;

  return (
    <main className="screen screen--home">
      <HomeBackdrop />
      {/* Real hill photo: put your image at public/images/home-hills.jpg. If it is missing, the drawn scene above shows instead. */}
      <img className="home-photo" src="/images/home-hills.jpg" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      <div className="home-photo-shade" />

      <header className="topbar">
        <Logo onTap={onLogoTap} />
      </header>

      <StatusBadge status={status} />

      {trip ? (
        <>
          <h1 className="hero-title hero-title--trip">
            <span>Trip Active</span>
          </h1>
          <SosButton onTrigger={onSos} state={sosState} />
          <button type="button" className="end-trip" onClick={onEndTrip}>
            End Trip
          </button>
        </>
      ) : (
        <>
          <h1 className="hero-title">
            Stay Safe,
            <br />
            <em>Traveller!</em>
          </h1>
          <div className="trip-spacer" />
          <button type="button" className="start-trip" onClick={onStartTrip}>
            Start Trip
          </button>
        </>
      )}

      <section className="card nearest" aria-labelledby="nearest-title">
        <div className="card__head">
          <h2 id="nearest-title">
            <Icon name="pin" size={20} className="accent" fill="currentColor" stroke={0} /> Nearest Help
          </h2>
          <a href="#/help" className="link">
            View All <Icon name="arrow" size={14} />
          </a>
        </div>

        <div className="nearest__grid">
          {KINDS.map((k) => (
            <a key={k} href="#/help" className="nearest__tile">
              <KindIcon kind={k} size={26} bare />
              <strong>{kindLabel(k)}</strong>
              <small>{dist(help?.[k]?.[0])}</small>
            </a>
          ))}
        </div>
      </section>

      <section className={'offline-banner' + (hasCache ? '' : ' is-empty')}>
        <Icon name="wifi" size={28} />
        <span>
          <strong>{hasCache ? 'Works Offline' : 'Saving help near you'}</strong>
          <small>{hasCache ? 'Your saved data is available' : 'Connect once to save nearby help on this phone'}</small>
        </span>
      </section>

      <BottomNav route="/" />
    </main>
  );
}
