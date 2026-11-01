import { useCallback, useEffect, useState } from 'react'
import PlaceCard from '../components/PlaceCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

// Section order matches the guide: hospital, police, highway, patrol.
const SECTIONS = [
  { type: 'hospital', title: 'Hospital' },
  { type: 'police', title: 'Police station' },
  { type: 'highway', title: 'Highway help (NH/SH)' },
  { type: 'patrol', title: 'Patrolling unit' },
]
const SHOW_PER_SECTION = 3 // nearest first, then the next two

/**
 * Offline nearest help.
 * All data access comes in through props, so this screen has no knowledge
 * of IndexedDB or GPS APIs (App.jsx wires them).
 * Props:
 *   loadNearest  ({ limitPerType }) => Promise<{
 *                  cacheEmpty, locationAvailable,
 *                  hospital[], police[], highway[], patrol[] }>
 *                each list is already sorted nearest first with distanceKm
 *                (the offline engine reads GPS + IndexedDB and runs Haversine)
 *   online, lastSynced   for the status badge
 */
export default function NearestHelp({ loadNearest, online, lastSynced }) {
  const [state, setState] = useState({ phase: 'loading', groups: null, error: null, noLocation: false })

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'loading', error: null }))
    try {
      const result = await loadNearest({ limitPerType: SHOW_PER_SECTION })
      if (result.cacheEmpty) {
        setState({ phase: 'empty', groups: null, error: null, noLocation: false })
        return
      }
      const groups = {}
      for (const { type } of SECTIONS) groups[type] = result[type] || []
      setState({ phase: 'ready', groups, error: null, noLocation: !result.locationAvailable })
    } catch (err) {
      setState({ phase: 'error', groups: null, error: err?.message || 'Could not load saved help.', noLocation: false })
    }
  }, [loadNearest])

  useEffect(() => { refresh() }, [refresh])

  return (
    <section className="screen help">
      <div className="screen-head">
        <h1>Nearest help</h1>
        <StatusBadge online={online} lastSynced={lastSynced} />
      </div>

      {state.phase === 'loading' && (
        <div className="stack" aria-busy="true">
          <p className="muted">Finding your location...</p>
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
        </div>
      )}

      {state.phase === 'empty' && (
        <div className="card empty">
          <h2 className="card-title">Nothing saved yet</h2>
          <p>Open the app with internet before your trip.</p>
          <p className="muted">Start a trip on the Home screen while online and nearby help will be saved here.</p>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="card empty">
          <h2 className="card-title">Could not load help</h2>
          <p>{state.error}</p>
          <p className="muted">Please try again. If it keeps failing, restart the app.</p>
          <button type="button" className="btn btn-primary" onClick={refresh}>Try again</button>
        </div>
      )}

      {state.phase === 'ready' && (
        <>
          {state.noLocation && (
            <div className="banner banner-error" role="alert">
              Could not read your location, so distances are not shown. Allow location access and tap "Refresh my location".
            </div>
          )}
          {SECTIONS.map(({ type, title }) => {
            const list = state.groups[type]
            return (
              <div className="help-section" key={type}>
                <h2 className="section-title">{title}</h2>
                {list.length === 0 ? (
                  <p className="muted none-saved">None saved near this route.</p>
                ) : (
                  <div className="stack">
                    {list.map((p, i) => (
                      <PlaceCard key={`${p.type}-${p.id}`} place={p} nearest={i === 0} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <button type="button" className="btn btn-ghost btn-block" onClick={refresh}>Refresh my location</button>
        </>
      )}
    </section>
  )
}
