import { AlertIcon, UsersIcon, CheckIcon } from './Icons.jsx';

export default function StatCards({ active, online, resolvedToday }) {
  return (
    <div className="stats">
      <div className="stat stat-red">
        <span className="stat-icon red"><AlertIcon /></span>
        <div>
          <div className="stat-label">Active Alerts</div>
          <div className="stat-value">{active}</div>
        </div>
      </div>
      <div className="stat stat-blue">
        <span className="stat-icon blue"><UsersIcon /></span>
        <div>
          <div className="stat-label">Patrol Units</div>
          <div className="stat-value">{online} Online</div>
        </div>
      </div>
      <div className="stat stat-green">
        <span className="stat-icon green"><CheckIcon /></span>
        <div>
          <div className="stat-label">Resolved Today</div>
          <div className="stat-value">{resolvedToday}</div>
        </div>
      </div>
    </div>
  );
}
