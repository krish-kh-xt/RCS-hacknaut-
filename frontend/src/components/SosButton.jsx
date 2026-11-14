import { useRef, useState, useEffect } from 'react';
import Icon from './Icon.jsx';

const HOLD_MS = 2000; // hold for 2 seconds to send

// state: 'idle' | 'sent' | 'queued'. Sent and queued turn the button green.
export default function SosButton({ onTrigger, state = 'idle' }) {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);
  const start = useRef(0);
  const fired = useRef(false);
  const done = state !== 'idle';

  const stop = () => {
    cancelAnimationFrame(raf.current);
    start.current = 0;
    setProgress(0);
  };

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      if (!fired.current) {
        fired.current = true;
        if (navigator.vibrate) navigator.vibrate(200);
        onTrigger?.();
      }
      stop();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  const down = (e) => {
    if (done) return;
    e.preventDefault();
    fired.current = false;
    start.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const R = 128;
  const C = 2 * Math.PI * R;
  const hint = state === 'sent' ? 'Help is on the way' : state === 'queued' ? 'Saved. Sends when you are online' : 'Hold for 2 sec';

  return (
    <div className={'sos' + (done ? ' is-done' : '')}>
      <div className="sos__glow" />
      <button
        type="button"
        className={'sos__btn' + (progress > 0 ? ' is-holding' : '')}
        onPointerDown={down}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={done ? 'SOS sent' : 'SOS. Press and hold for 2 seconds to send an emergency alert'}
      >
        <svg className="sos__ring" viewBox="0 0 280 280" aria-hidden="true">
          <circle cx="140" cy="140" r={R} className="sos__ring-fill" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
        </svg>
        {done ? (
          <Icon name="check" size={46} stroke={3.2} className="sos__icon" />
        ) : (
          <svg className="sos__icon" viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">
            <path d="M14 34v-9a10 10 0 0 1 20 0v9z" fill="#fff" />
            <rect x="10" y="34" width="28" height="5" rx="2" fill="#fff" />
            <path d="M24 5v5M8.5 12l3.5 3.5M39.5 12 36 15.5M3.5 26h5M39.5 26h5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        <span className="sos__label">{state === 'sent' ? 'SENT' : state === 'queued' ? 'SAVED' : 'SOS'}</span>
      </button>
      <p className="sos__hint">{hint}</p>
    </div>
  );
}
