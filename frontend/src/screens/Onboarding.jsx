import { useState } from 'react';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';

// First-run screen: asks for name, phone and an emergency contact.
export default function Onboarding({ onRegister, onLogoTap }) {
  const [form, setForm] = useState({ name: '', phone: '', emergencyPhone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = (p) => p.replace(/\D/g, '').length >= 10;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Enter your name.');
    if (!valid(form.phone)) return setError('Enter a 10-digit phone number.');
    if (!valid(form.emergencyPhone)) return setError('Enter a 10-digit emergency contact number.');
    setError('');
    setBusy(true);
    try {
      await onRegister({
        name: form.name.trim(),
        phone: form.phone.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
      });
    } catch (err) {
      setError(err?.message || 'Could not register. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <main className="screen screen--onboarding">
      <header className="topbar">
        <Logo onTap={onLogoTap} />
      </header>

      <section className="hero hero--left">
        <h1>Welcome aboard</h1>
        <p>Add your details once. If you need help on a remote road, RCS alerts your emergency contact and the nearest patrol.</p>
      </section>

      <form className="card form" onSubmit={submit} noValidate>
        <label>
          Full name
          <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your name" />
        </label>
        <label>
          Your phone number
          <input value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="98765 43210" />
        </label>
        <label>
          Emergency contact number
          <input value={form.emergencyPhone} onChange={set('emergencyPhone')} inputMode="tel" placeholder="Family member or friend" />
        </label>
        {error && <p className="form__error" role="alert">{error}</p>}
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Saving...' : 'Start using RCS'}
          {!busy && <Icon name="arrow" size={18} />}
        </button>
      </form>
    </main>
  );
}
