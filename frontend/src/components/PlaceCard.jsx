// Small inline icons so nothing is fetched (the app must work offline).
const ICONS = {
  hospital: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" fill="currentColor" /></svg>
  ),
  police: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z" fill="currentColor" /></svg>
  ),
  highway: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h2l-1 18H5zM14 3h2l3 18h-4zM11.2 3h1.6l.3 4h-2.2zm-.4 7h2.4l.4 4h-3.2zm-.5 7h3.4l.2 4h-3.8z" fill="currentColor" /></svg>
  ),
  patrol: (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11l1.6-4.4A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.6L19 11h1a1 1 0 0 1 1 1v5h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-5a1 1 0 0 1 1-1zm3-.5h8l-.9-3H8.9zM9 3h6v1.4H9z" fill="currentColor" /></svg>
  ),
}

function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '--'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

/**
 * One nearby help place.
 * Props:
 *   place    { type, name, phone, highwayRef, distanceKm }
 *   nearest  boolean - highlight the closest one in a section
 */
export default function PlaceCard({ place, nearest = false }) {
  const { type, name, phone, highwayRef, distanceKm } = place
  const hasPhone = Boolean(phone && String(phone).trim())

  return (
    <article className={`place-card type-${type} ${nearest ? 'is-nearest' : ''}`}>
      <div className="place-icon">{ICONS[type] || ICONS.hospital}</div>
      <div className="place-body">
        {nearest && <span className="place-tag">Nearest</span>}
        <h3 className="place-name">{name}</h3>
        <p className="place-meta">
          <span className="place-distance">{formatDistance(distanceKm)} away</span>
          {highwayRef && <span className="road-chip">{highwayRef}</span>}
        </p>
      </div>
      {hasPhone ? (
        <a className="call-btn" href={`tel:${String(phone).replace(/\s+/g, '')}`} aria-label={`Call ${name}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.6 3.6a1 1 0 0 1-.25 1z" fill="currentColor" /></svg>
          <span>Call</span>
        </a>
      ) : (
        <span className="call-btn is-disabled" aria-label="No phone number available">No number</span>
      )}
    </article>
  )
}
