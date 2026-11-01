import SosButton from '../components/SosButton.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

/**
 * Main screen: trip status, sync badge, SOS.
 * Props:
 *   user          { name }
 *   tripActive    boolean
 *   online        boolean
 *   lastSynced    ISO string | null
 *   tripBusy      boolean            - start/end request in progress
 *   tripError     string | null
 *   sosStatus     'idle' | 'sending' | 'sent' | 'queued' | 'error'
 *   onStartTrip   () => void
 *   onEndTrip     () => void
 *   onSos         () => void
 *   onOpenHelp    () => void
 */
export default function Home({
  user, tripActive, online, lastSynced, tripBusy = false, tripError = null,
  sosStatus = 'idle', onStartTrip, onEndTrip, onSos, onOpenHelp,
}) {
  const firstName = (user?.name || '').split(' ')[0]

  return (
    <section className="screen home">
      <p className="greeting">{firstName ? `Hi, ${firstName}` : 'Hi there'}</p>

      <div className={`card trip-card ${tripActive ? 'is-active' : ''}`}>
        <div className="trip-head">
          <span className="trip-state">
            <span className="trip-dot" aria-hidden="true" />
            {tripActive ? 'Trip active' : 'No trip running'}
          </span>
          <StatusBadge online={online} lastSynced={lastSynced} />
        </div>

        <p className="trip-copy">
          {tripActive
            ? 'We are checking in every 5 minutes. If we hear nothing for 1 hour, we will SMS you.'
            : 'Start a trip before you leave network range. We will save nearby help on this phone.'}
        </p>

        {tripError && <div className="banner banner-error" role="alert">{tripError}</div>}

        {tripActive ? (
          <button type="button" className="btn btn-ghost btn-block" onClick={onEndTrip} disabled={tripBusy}>
            {tripBusy ? 'Ending...' : 'End trip'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={onStartTrip} disabled={tripBusy || !online}>
            {tripBusy ? 'Starting...' : 'Start trip'}
          </button>
        )}
        {!tripActive && !online && (
          <p className="field-hint">Connect to the internet to start your trip so help can be saved.</p>
        )}
        {tripActive && <p className="field-hint">Keep this screen on. The app syncs only while it is open.</p>}
      </div>

      <button type="button" className="card link-card" onClick={onOpenHelp}>
        <span className="link-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor" /></svg>
        </span>
        <span className="link-text">
          <strong>Nearest help</strong>
          <small>Hospital, police, highway help, patrol. Works offline.</small>
        </span>
        <span className="link-chevron" aria-hidden="true">&rsaquo;</span>
      </button>

      <div className="card sos-card">
        <h2 className="card-title">Emergency</h2>
        <SosButton onConfirm={onSos} status={sosStatus} />
      </div>
    </section>
  )
}
