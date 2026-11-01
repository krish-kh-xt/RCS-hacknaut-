import { useEffect, useState } from 'react'

// Turns an ISO timestamp into "just now", "3 min ago", "2 h ago".
function timeAgo(iso, now) {
  if (!iso) return null
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  return `${Math.floor(mins / 60)} h ago`
}

/**
 * Online / Offline pill.
 * Props:
 *   online     boolean  - true = Online, false = Offline
 *   lastSynced string   - ISO timestamp of the last successful /sync (or null)
 */
export default function StatusBadge({ online, lastSynced }) {
  const [now, setNow] = useState(() => Date.now())

  // Re-render every 30 s so "3 min ago" stays fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  const ago = timeAgo(lastSynced, now)
  const label = online ? 'Online' : 'Offline'
  const detail = online
    ? ago ? `Synced ${ago}` : 'Waiting for first sync'
    : ago ? `Using help saved ${ago}` : 'No saved help yet'

  return (
    <div className={`status-badge ${online ? 'is-online' : 'is-offline'}`} role="status" aria-live="polite">
      <span className="status-dot" aria-hidden="true" />
      <span className="status-label">{label}</span>
      <span className="status-detail">{detail}</span>
    </div>
  )
}
