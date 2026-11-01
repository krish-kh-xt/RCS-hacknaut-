import { useEffect, useRef, useState } from 'react'

const ARM_WINDOW_MS = 4000

/**
 * Big SOS button with a two-tap safety: first tap arms it, second tap
 * (within 4 seconds) sends. This avoids accidental alerts in a pocket.
 *
 * Props:
 *   onConfirm  () => void   - called on the second tap
 *   status     'idle' | 'sending' | 'sent' | 'queued' | 'error'
 *   disabled   boolean
 */
export default function SosButton({ onConfirm, status = 'idle', disabled = false }) {
  const [armed, setArmed] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const busy = status === 'sending'

  function handleClick() {
    if (disabled || busy) return
    if (!armed) {
      setArmed(true)
      timer.current = setTimeout(() => setArmed(false), ARM_WINDOW_MS)
      return
    }
    clearTimeout(timer.current)
    setArmed(false)
    onConfirm?.()
  }

  const message = {
    idle: armed ? 'Tap again within 4 seconds to send SOS' : 'Tap twice to send an SOS to the nearest patrol unit',
    sending: 'Sending your location...',
    sent: 'SOS sent. Patrol has your location.',
    queued: 'No internet. SOS saved and will send automatically when you are back online.',
    error: 'Could not read your location. Try again.',
  }[status]

  return (
    <div className="sos-wrap">
      <button
        type="button"
        className={`sos-button ${armed ? 'is-armed' : ''} ${busy ? 'is-busy' : ''} ${status === 'sent' ? 'is-sent' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={armed ? 'Confirm SOS' : 'SOS emergency button'}
      >
        {armed && <span className="sos-countdown" aria-hidden="true" />}
        <span className="sos-text">{armed ? 'CONFIRM' : busy ? '...' : 'SOS'}</span>
      </button>
      <p className={`sos-message ${status === 'error' ? 'is-error' : ''}`} role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}
