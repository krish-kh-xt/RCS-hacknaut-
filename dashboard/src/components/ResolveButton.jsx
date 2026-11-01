import { useState } from 'react';
import { resolveAlert } from '../services/api.js';

// Calls POST /alerts/:id/resolve, then asks the page to refresh.
export default function ResolveButton({ alertId, onResolved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleClick(e) {
    e.stopPropagation();
    setBusy(true);
    setError('');
    try {
      await resolveAlert(alertId);
      await onResolved();
    } catch (err) {
      setError(err.message || 'Could not mark as resolved');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn-resolve" onClick={handleClick} disabled={busy}>
        {busy ? 'Marking resolved...' : 'Mark resolved'}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
