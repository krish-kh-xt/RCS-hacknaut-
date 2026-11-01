import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import NearestHelp from './screens/NearestHelp.jsx'
import OfflineMap from './screens/OfflineMap.jsx' // NEW: offline map screen

/* =====================================================================
   PART 1 BINDINGS  (the only place that touches Part 1 files)
   Everything comes from ONE file: services/index.js (the offline engine).
   See frontend/README.md for what each function returns.
   ===================================================================== */
import {
  initEngine,
  getUser,
  registerUser,
  startTrip,
  endTrip,
  getNearestHelp,
  triggerSos,
  subscribeStatus,
} from './services/index.js'

// DemoPanel.jsx belongs to Role E. If the file does not exist yet the app still builds.
const demoModules = import.meta.glob('./screens/DemoPanel.jsx')
const demoLoader = demoModules['./screens/DemoPanel.jsx']
const DemoPanel = demoLoader ? lazy(demoLoader) : null

// Tiny hash router: '#/' (Home), '#/help', '#/map', '#/demo'.
function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback((path) => { window.location.hash = path }, [])
  return [route, navigate]
}

export default function App() {
  const [route, navigate] = useHashRoute()
  const [user, setUser] = useState(undefined) // undefined = still loading, null = not onboarded
  const [onboardBusy, setOnboardBusy] = useState(false)
  const [onboardError, setOnboardError] = useState(null)

  const [tripBusy, setTripBusy] = useState(false)
  const [tripError, setTripError] = useState(null)

  // Live status from the offline engine: online, tripActive, lastSyncedAt, alertResolved.
  const [status, setStatus] = useState({ online: navigator.onLine, tripActive: false, lastSyncedAt: null })
  const { online, tripActive, lastSyncedAt: lastSynced } = status
  const [sosStatus, setSosStatus] = useState('idle')

  // Start the engine once (retries queued SOS, resumes the trip after a reload),
  // then load the saved user.
  useEffect(() => {
    initEngine()
      .catch(() => {})
      .then(() => getUser())
      .then((u) => setUser(u || null))
      .catch(() => setUser(null))
  }, [])

  // Online/offline, trip state and last-synced time all come from the engine.
  useEffect(() => subscribeStatus(setStatus), [])

  async function handleOnboard(details) {
    setOnboardBusy(true); setOnboardError(null)
    try {
      const { userId } = await registerUser(details)
      setUser({ userId, ...details })
    } catch (err) {
      setOnboardError(
        err?.isNetworkError
          ? 'Could not reach the server. Check your internet and try again.'
          : err?.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setOnboardBusy(false)
    }
  }

  async function handleStartTrip() {
    setTripBusy(true); setTripError(null)
    try {
      await startTrip() // also starts the 5-minute sync and keeps the screen awake
    } catch (err) {
      setTripError(err?.message || 'Could not start the trip. Check your internet and try again.')
    } finally {
      setTripBusy(false)
    }
  }

  async function handleEndTrip() {
    setTripBusy(true); setTripError(null)
    try {
      await endTrip()
    } catch (err) {
      setTripError(err?.message || 'Could not end the trip. Check your internet and try again.')
    } finally {
      setTripBusy(false)
    }
  }

  async function handleSos() {
    setSosStatus('sending')
    try {
      const result = await triggerSos() // sends now, or saves it for when internet returns
      setSosStatus(result?.queued ? 'queued' : 'sent')
    } catch {
      setSosStatus('error')
    }
  }

  // Hidden demo panel: tap the logo 5 times.
  const taps = useRef({ n: 0, timer: null })
  function handleLogoTap() {
    const t = taps.current
    t.n += 1
    clearTimeout(t.timer)
    t.timer = setTimeout(() => { t.n = 0 }, 2000)
    if (t.n >= 5) { t.n = 0; if (DemoPanel) navigate('/demo') }
  }

  // ---- render ----
  if (user === undefined) {
    return <div className="boot" role="status" aria-label="Loading"><span className="spinner" /></div>
  }

  let screen
  if (!user) {
    screen = <Onboarding onSubmit={handleOnboard} loading={onboardBusy} error={onboardError} />
  } else if (route === '/help') {
    screen = (
      <NearestHelp
        loadNearest={getNearestHelp}
        online={online}
        lastSynced={lastSynced}
      />
    )
  } else if (route === '/map') {
    // NEW: offline map screen
    screen = <OfflineMap />
  } else if (route === '/demo' && DemoPanel) {
    screen = (
      <Suspense fallback={<div className="boot"><span className="spinner" /></div>}>
        <DemoPanel user={user} onClose={() => navigate('/')} />
      </Suspense>
    )
  } else {
    screen = (
      <Home
        user={user}
        tripActive={tripActive}
        online={online}
        lastSynced={lastSynced}
        tripBusy={tripBusy}
        tripError={tripError}
        sosStatus={sosStatus}
        onStartTrip={handleStartTrip}
        onEndTrip={handleEndTrip}
        onSos={handleSos}
        onOpenHelp={() => navigate('/help')}
      />
    )
  }

  const onHelp = route === '/help'
  const onMap = route === '/map'          // NEW
  const onHome = !onHelp && !onMap        // CHANGED: Home is current only when neither Help nor Map is open

  return (
    <div className="app-shell">
      <header className="app-header">
        <button type="button" className="logo" onClick={handleLogoTap} aria-label="RCS">
          <img src="/icons/icon-192.png" alt="" width="32" height="32" />
          <span>RCS</span>
        </button>
        {!online && <span className="header-offline">Offline mode</span>}
      </header>

      <main className={`app-main ${onMap ? 'app-main--map' : ''}`}>{screen}</main>

      {user && (
        <nav className="tabbar" aria-label="Main">
          <a href="#/" className={`tab ${onHome ? 'is-current' : ''}`} aria-current={onHome ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z" fill="currentColor" /></svg>
            Home
          </a>
          <a href="#/help" className={`tab ${onHelp ? 'is-current' : ''}`} aria-current={onHelp ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor" /></svg>
            Nearest help
          </a>
          {/* NEW: Map tab */}
          <a href="#/map" className={`tab ${onMap ? 'is-current' : ''}`} aria-current={onMap ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 9 6 3 4v14l6 2 6-2 6 2V6zM9 8.2l6-2v9.6l-6 2z" fill="currentColor" /></svg>
            Map
          </a>
        </nav>
      )}
    </div>
  )
}