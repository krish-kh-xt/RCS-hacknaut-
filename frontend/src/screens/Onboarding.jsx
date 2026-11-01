import { useState } from 'react'

// Keep only digits, drop a leading 91 or 0 if the user typed it.
function cleanDigits(value) {
  let d = value.replace(/\D/g, '')
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2)
  if (d.length > 10 && d.startsWith('0')) d = d.slice(1)
  return d.slice(0, 10)
}
const isValidMobile = (d) => /^[6-9]\d{9}$/.test(d)

/**
 * First-run screen: name, phone, emergency contact.
 * Props:
 *   onSubmit  ({ name, phone, emergencyPhone }) => Promise|void
 *             phone numbers are passed in international format, e.g. +919876543210
 *   loading   boolean
 *   error     string | null   (server or network error to show)
 */
export default function Onboarding({ onSubmit, loading = false, error = null }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [emergency, setEmergency] = useState('')
  const [touched, setTouched] = useState(false)

  const errors = {
    name: name.trim().length < 2 ? 'Enter your name' : '',
    phone: !isValidMobile(phone) ? 'Enter a 10-digit mobile number' : '',
    emergency: !isValidMobile(emergency)
      ? 'Enter a 10-digit mobile number'
      : emergency === phone ? 'Use a different number from your own' : '',
  }
  const hasErrors = Object.values(errors).some(Boolean)

  function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)
    if (hasErrors || loading) return
    onSubmit?.({
      name: name.trim(),
      phone: `+91${phone}`,
      emergencyPhone: `+91${emergency}`,
    })
  }

  return (
    <section className="screen onboarding">
      <div className="hero">
        <div className="hero-mark" aria-hidden="true">
          <img src="/icons/icon-192.png" alt="" width="72" height="72" />
        </div>
        <h1>Help that works without internet</h1>
        <p className="lead">
          RCS saves nearby hospitals, police and highway help on your phone, and checks on you by SMS if we stop hearing from you.
        </p>
      </div>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h2 className="card-title">Set up in 30 seconds</h2>

        <div className="field">
          <label htmlFor="ob-name">Your name</label>
          <input
            id="ob-name" type="text" autoComplete="name" placeholder="e.g. Aman"
            value={name} onChange={(e) => setName(e.target.value)}
            aria-invalid={touched && !!errors.name}
          />
          {touched && errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="field">
          <label htmlFor="ob-phone">Your mobile number</label>
          <div className="phone-input">
            <span className="phone-prefix">+91</span>
            <input
              id="ob-phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210"
              value={phone} onChange={(e) => setPhone(cleanDigits(e.target.value))}
              aria-invalid={touched && !!errors.phone}
            />
          </div>
          <p className="field-hint">We send the "Are you safe?" SMS to this number.</p>
          {touched && errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>

        <div className="field">
          <label htmlFor="ob-emergency">Emergency contact</label>
          <div className="phone-input">
            <span className="phone-prefix">+91</span>
            <input
              id="ob-emergency" type="tel" inputMode="numeric" placeholder="98123 45678"
              value={emergency} onChange={(e) => setEmergency(cleanDigits(e.target.value))}
              aria-invalid={touched && !!errors.emergency}
            />
          </div>
          <p className="field-hint">Shown to patrol only if you do not reply.</p>
          {touched && errors.emergency && <p className="field-error">{errors.emergency}</p>}
        </div>

        {error && <div className="banner banner-error" role="alert">{error}</div>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Saving...' : 'Get started'}
        </button>
        <p className="fine-print">Do this once, with internet on. Your details stay on your phone and our server.</p>
      </form>
    </section>
  )
}
