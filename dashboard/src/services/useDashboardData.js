import { useCallback, useEffect, useState } from 'react';
import { getOpenAlerts, getResolvedAlerts, getPatrolUnits } from './api.js';

const POLL_SECONDS = 10;

export default function useDashboardData() {
  const [openAlerts, setOpenAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [units, setUnits] = useState([]);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const [open, resolved, u] = await Promise.allSettled([
      getOpenAlerts(),
      getResolvedAlerts(),
      getPatrolUnits(),
    ]);
    if (open.status === 'fulfilled') setOpenAlerts(open.value);
    if (resolved.status === 'fulfilled') setResolvedAlerts(resolved.value);
    if (u.status === 'fulfilled') setUnits(u.value);
    setError(open.status === 'rejected' ? 'Cannot reach backend' : null);
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_SECONDS * 1000);
    return () => clearInterval(t);
  }, [refresh]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const resolvedToday = resolvedAlerts.filter(
    (a) => a.time && new Date(a.time) >= startOfToday
  ).length;

  return {
    openAlerts,
    resolvedAlerts,
    units,
    resolvedToday,
    error,
    refresh,
    pollSeconds: POLL_SECONDS,
  };
}
