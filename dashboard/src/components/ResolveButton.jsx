import { useState } from 'react';
import { resolveAlert } from '../services/api.js';

export default function ResolveButton({ id, onDone, label = 'Mark resolved', className = 'btn-outline' }) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      await resolveAlert(id);
      await onDone?.();
    } catch (e) {
      alert(`Could not resolve alert: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={className} onClick={handle} disabled={busy}>
      {busy ? 'Resolving…' : label}
    </button>
  );
}
