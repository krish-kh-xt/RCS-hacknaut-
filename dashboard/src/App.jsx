import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Home from './pages/Home.jsx';
import Alerts from './pages/Alerts.jsx';
import useDashboardData from './services/useDashboardData.js';

export default function App() {
  const [page, setPage] = useState('home');
  const data = useDashboardData();

  return (
    <div className="shell">
      <Sidebar page={page} onNavigate={setPage} />
      <div className="main">
        <Topbar
          title={page === 'alerts' ? 'Alerts' : null}
          openCount={data.openAlerts.length}
          onRefresh={data.refresh}
          pollSeconds={data.pollSeconds}
          error={data.error}
        />
        <div className="content">
          {page === 'home' ? (
            <Home data={data} onViewAll={() => setPage('alerts')} />
          ) : (
            <Alerts data={data} />
          )}
        </div>
      </div>
    </div>
  );
}
