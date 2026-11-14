import { useState } from 'react'
import {
  setSimulatedOffline,
  isSimulatedOffline,
  demoSilence,
  demoReply,
  demoReset,
} from '../services/index.js'

/**
 * Hidden demo panel (open it by tapping the RCS logo 5 times).
 * Props: user { userId, name }, onClose () => void
 *
 * The three demo buttons call the backend /demo/* routes, which only exist
 * when the backend runs with DEMO_MODE=true.
 */
export default function DemoPanel({ user, onClose }) {
  const [offline, setOffline] = useState(() => isSimulatedOffline())
  const [busy, setBusy] = useState(null) // which button is running
  const [message, setMessage] = useState(null) // { ok, text }

  function toggleOffline() {
    const next = !offline
    setSimulatedOffline(next)
    setOffline(next)
    setMessage({ ok: true, text: next ? 'Simulated offline: no API calls will be made.' : 'Back online. Syncing now.' })
  }

  async function run(key, fn, okText) {
    setBusy(key); setMessage(null)
    try {
      await fn()
      setMessage({ ok: true, text: okText })
    } catch (err) {
      const text = err?.isNetworkError
        ? 'Could not reach the server (or Simulate no internet is on).'
        : err?.status === 404
          ? 'Demo route not found. Start the backend with DEMO_MODE=true.'
          : err?.message || 'Something went wrong.'
      setMessage({ ok: false, text })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="screen demo-panel">
      <div className="screen-head">
        <h1>Demo panel</h1>
      </div>
      <p className="muted">Signed in as {user?.name || 'unknown'} (id {user?.userId ?? '?'}). For the demo only.</p>

      <div className="card form">
        <button type="button" className="btn btn-block btn-primary" onClick={toggleOffline}>
          {offline ? 'Turn internet back on' : 'Simulate no internet'}
        </button>

        <button
          type="button" className="btn btn-block btn-primary" disabled={busy !== null}
          onClick={() => run('silence', () => demoSilence(user.userId),
            'Silence simulated. The alert SMS fires on the next worker run (about 1 minute).')}
        >
          {busy === 'silence' ? 'Working...' : 'Simulate 1 hour silence'}
        </button>

        <button
          type="button" className="btn btn-block btn-primary" disabled={busy !== null}
          onClick={() => run('reply', () => demoReply(user.userId), 'Reply OK sent. The alarm is cancelled.')}
        >
          {busy === 'reply' ? 'Working...' : 'Reply OK'}
        </button>

        <button
          type="button" className="btn btn-block btn-ghost" disabled={busy !== null}
          onClick={() => run('reset', () => demoReset(), 'Demo reset: alerts and heartbeats cleared.')}
        >
          {busy === 'reset' ? 'Working...' : 'Reset demo data'}
        </button>

        {message && (
          <div className={`banner ${message.ok ? '' : 'banner-error'}`} role={message.ok ? 'status' : 'alert'}>
            {message.text}
          </div>
        )}
      </div>

      <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>Close</button>
    </section>
  )
}
