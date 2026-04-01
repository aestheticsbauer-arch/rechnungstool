'use client'

import { useEffect, useState } from 'react'
import type { Settings } from '@/lib/types'

const defaultSettings: Settings = {
  company_name: '',
  company_address: '',
  company_postal_code: '',
  company_city: '',
  company_country: 'Deutschland',
  company_email: '',
  company_phone: '',
  company_iban: '',
  company_bic: '',
  company_bank: '',
  tax_number: '',
  tax_id: '',
  is_kleinunternehmer: 'true',
  payment_terms_days: '14',
  invoice_prefix: 'RE',
  invoice_suffix: 'Bauer',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#1e1e1e',
  border: '1px solid rgba(201,169,110,0.3)',
  color: '#f5f2ee',
  borderRadius: 3,
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  fontFamily: '"DM Sans", system-ui, sans-serif',
  boxSizing: 'border-box',
}

const monoInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: 'monospace',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#8a8580',
  marginBottom: 4,
  fontWeight: 500,
}

const cardStyle: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid rgba(201,169,110,0.15)',
  borderRadius: 3,
  padding: '24px',
}

const cardHeadingStyle: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: 15,
  fontWeight: 600,
  color: '#c9a96e',
  margin: '0 0 20px 0',
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setForm({ ...defaultSettings, ...data }))
      .catch(() => setError('Fehler beim Laden der Einstellungen'))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: keyof Settings, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#8a8580', background: '#111111', minHeight: '100vh' }}>
        Lade Einstellungen...
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 28, fontWeight: 700, color: '#c9a96e', margin: '0 0 24px 0' }}>
        Einstellungen
      </h1>

      {error && (
        <div style={{ marginBottom: 16, background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e07060', borderRadius: 3, padding: '10px 16px', fontSize: 13 }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ marginBottom: 16, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', borderRadius: 3, padding: '10px 16px', fontSize: 13 }}>
          Einstellungen gespeichert.
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Company Data */}
          <div style={cardStyle}>
            <h2 style={cardHeadingStyle}>Meine Firmendaten</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Firmenname / Ihr Name</label>
                <input type="text" value={form.company_name} onChange={e => update('company_name', e.target.value)}
                  placeholder="Max Mustermann Social Media" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Straße + Hausnummer</label>
                <input type="text" value={form.company_address} onChange={e => update('company_address', e.target.value)}
                  placeholder="Musterstraße 1" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PLZ</label>
                <input type="text" value={form.company_postal_code} onChange={e => update('company_postal_code', e.target.value)}
                  placeholder="10115" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ort</label>
                <input type="text" value={form.company_city} onChange={e => update('company_city', e.target.value)}
                  placeholder="Berlin" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Land</label>
                <input type="text" value={form.company_country} onChange={e => update('company_country', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-Mail</label>
                <input type="email" value={form.company_email} onChange={e => update('company_email', e.target.value)}
                  placeholder="info@meinefirma.de" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefon</label>
                <input type="tel" value={form.company_phone} onChange={e => update('company_phone', e.target.value)}
                  placeholder="+49 30 12345678" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Bank */}
          <div style={cardStyle}>
            <h2 style={cardHeadingStyle}>Bankverbindung</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>IBAN</label>
                <input type="text" value={form.company_iban} onChange={e => update('company_iban', e.target.value)}
                  placeholder="DE12 3456 7890 1234 5678 90" style={monoInputStyle} />
              </div>
              <div>
                <label style={labelStyle}>BIC</label>
                <input type="text" value={form.company_bic} onChange={e => update('company_bic', e.target.value)}
                  placeholder="DEUTDEDB" style={monoInputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Bank</label>
                <input type="text" value={form.company_bank} onChange={e => update('company_bank', e.target.value)}
                  placeholder="Deutsche Bank" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Tax */}
          <div style={cardStyle}>
            <h2 style={cardHeadingStyle}>Steuer</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Steuernummer</label>
                <input type="text" value={form.tax_number} onChange={e => update('tax_number', e.target.value)}
                  placeholder="12/345/67890" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>USt-IdNr.</label>
                <input type="text" value={form.tax_id} onChange={e => update('tax_id', e.target.value)}
                  placeholder="DE123456789" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_kleinunternehmer === 'true'}
                    onChange={e => update('is_kleinunternehmer', e.target.checked ? 'true' : 'false')}
                    style={{ width: 16, height: 16, accentColor: '#c9a96e', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, color: '#f5f2ee', fontWeight: 500 }}>
                    Kleinunternehmer gemäß § 19 UStG (keine MwSt auf Rechnungen)
                  </span>
                </label>
                {form.is_kleinunternehmer === 'true' && (
                  <p style={{ marginTop: 8, fontSize: 12, color: '#8a8580', marginLeft: 26 }}>
                    Auf Rechnungen wird keine Umsatzsteuer ausgewiesen. Der Hinweis „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet." wird automatisch auf der Rechnung eingefügt.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div style={cardStyle}>
            <h2 style={cardHeadingStyle}>Rechnungseinstellungen</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Rechnungspräfix</label>
                <input type="text" value={form.invoice_prefix} onChange={e => update('invoice_prefix', e.target.value)}
                  placeholder="RE" style={monoInputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Rechnungssuffix (Nachname)</label>
                <input type="text" value={form.invoice_suffix} onChange={e => update('invoice_suffix', e.target.value)}
                  placeholder="Bauer" style={monoInputStyle} />
                <p style={{ marginTop: 4, fontSize: 11, color: '#8a8580' }}>
                  Ergebnis: RE-2026-03-Bauer
                </p>
              </div>
              <div>
                <label style={labelStyle}>Zahlungsziel (Tage)</label>
                <input type="number" value={form.payment_terms_days} onChange={e => update('payment_terms_days', e.target.value)}
                  min="0" max="90" style={inputStyle} />
                <p style={{ marginTop: 4, fontSize: 11, color: '#8a8580' }}>
                  Zahlungsfrist in Tagen ab Rechnungsdatum
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '10px 28px', background: '#c9a96e', color: '#111111', fontSize: 13, fontWeight: 600, borderRadius: 3, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1, letterSpacing: '0.02em' }}
            >
              {saving ? 'Speichern...' : 'Einstellungen speichern'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
