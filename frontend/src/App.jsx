import { useCallback, useEffect, useRef, useState } from 'react';
import {
  initEngine,
  registerUser,
  getUser,
  startTrip,
  endTrip,
  getNearestHelp,
  triggerSos,
  subscribeStatus,
} from './services/index.js';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import NearestHelp from './screens/NearestHelp.jsx';
import MapScreen from './screens/MapScreen.jsx';
import Dashboard from './screens/dashboard/Dashboard.jsx';

// DemoPanel.jsx is written by another team member. It is picked up automatically if it exists.
const demoModules = import.meta.glob('./screens/DemoPanel.jsx', { eager: true });
const DemoPanel = Object.values(demoModules)[0]?.default;

function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '') || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export default function App() {
  const route = useHashRoute();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState({ online: navigator.onLine, tripActive: false, lastSyncedAt: null, alertResolved: false, error: null });
  const [help, setHelp] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const [sosState, setSosState] = useState('idle'); // idle | sent | queued
  const taps = useRef({ n: 0, t: 0 });

  const isDashboard = route.startsWith('/dashboard');

  // Start the offline engine once.
  useEffect(() => {
    let off = () => {};
    (async () => {
      try {
        await initEngine();
        setUser(await getUser());
        off = subscribeStatus(setStatus);
      } finally {
        setReady(true);
      }
    })();
    return () => off();
  }, []);

  const refreshHelp = useCallback(async () => {
    try {
      setHelp(await getNearestHelp());
    } catch {
      /* keep the previous list on screen */
    }
  }, []);

  // Reload nearest help on start, after each sync, and when the connection changes.
  useEffect(() => {
    if (ready && user) refreshHelp();
  }, [ready, user, status.lastSyncedAt, status.online, route, refreshHelp]);

  // Keep "Synced 2 min ago" fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const flash = (msg, tone = 'info') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 4500);
  };

  const onRegister = async (data) => {
    await registerUser(data);
    setUser(await getUser());
  };

  const onSos = async () => {
    try {
      const r = await triggerSos();
      if (r?.sent) {
        setSosState('sent');
        flash('SOS sent. Help is on the way.', 'ok');
      } else if (r?.queued) {
        setSosState('queued');
        flash('No internet. SOS saved and will be sent automatically.', 'warn');
      } else {
        flash('Could not send SOS. Try again.', 'error');
        return;
      }
      setTimeout(() => setSosState('idle'), 10000); // button goes back to red after 10 seconds
    } catch {
      flash('Could not send SOS. Try again.', 'error');
    }
  };

  const onStartTrip = async () => {
    try {
      await startTrip();
      flash('Trip started. RCS is keeping your help list updated.', 'ok');
    } catch {
      flash('Could not start the trip. Try again.', 'error');
    }
  };

  const onEndTrip = async () => {
    try {
      await endTrip();
      setSosState('idle');
      flash('Trip ended.');
    } catch {
      flash('Could not end the trip. Try again.', 'error');
    }
  };

  // Tap the logo 5 times quickly to open the demo panel.
  const onLogoTap = () => {
    const now = Date.now();
    taps.current = now - taps.current.t > 1500 ? { n: 1, t: now } : { n: taps.current.n + 1, t: now };
    if (taps.current.n >= 5 && DemoPanel) {
      taps.current = { n: 0, t: 0 };
      setShowDemo(true);
    }
  };

  if (isDashboard) return <Dashboard route={route} />;

  if (!ready) return <div className="splash" aria-busy="true">RCS</div>;

  let screen;
  if (!user) {
    screen = <Onboarding onRegister={onRegister} onLogoTap={onLogoTap} />;
  } else if (route === '/help') {
    screen = <NearestHelp help={help} status={status} onLogoTap={onLogoTap} />;
  } else if (route === '/map') {
    screen = <MapScreen help={help} onLogoTap={onLogoTap} />;
  } else {
    screen = (
      <Home status={status} help={help} sosState={sosState} onSos={onSos} onStartTrip={onStartTrip} onEndTrip={onEndTrip} onLogoTap={onLogoTap} />
    );
  }

  return (
    <div className="app-shell">
      {screen}
      {toast && (
        <div className={'toast toast--' + toast.tone} role="status">
          {toast.msg}
        </div>
      )}
      {showDemo && DemoPanel && <DemoPanel user={user} onClose={() => setShowDemo(false)} />}
    </div>
  );
}
