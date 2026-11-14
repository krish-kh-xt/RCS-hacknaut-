import { timeAgo } from '../utils/format.js';

export default function StatusBadge({ status }) {
  const online = status?.online;
  const label = online
    ? status?.lastSyncedAt
      ? `Online \u2013 Synced ${timeAgo(status.lastSyncedAt)}`
      : 'Online \u2013 Syncing...'
    : 'Offline \u2013 Using saved data';
  return (
    <div className={'status-badge ' + (online ? 'is-online' : 'is-offline')} role="status">
      <span className="status-badge__dot" />
      {label}
    </div>
  );
}
