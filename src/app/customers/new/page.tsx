'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#8a8580',
  marginBottom: 4,
  fontWeight: 500,
}

const sectionStyle: React.CSSProperties = {
  padding: '24px',
  borderBottom: '1px solid rgba(201,169,110,0.1)',
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: 15,
  fontWeight: 600,
  color: '#c9a96e',
  margin: '0 0 16px 0',
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    contact_name: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'Deutschland',
    email: '',
    tax_id: '',
    default_service: '',
    default_amount: '',
  })

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  async function handleSubmit(e: React.FormEvent, redirectTo: 'list' | 'invoice') {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Kundenname ist erforderlich.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          default_amount: parseFloat(form.default_amount) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      if (redirectTo === 'invoice') {
        router.push(`/invoices/new?customer_id=${data.id}`)
      } else {
        router.push('/customers')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: 680, margin: '0 auto', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: '#8a8580', fontSize: 13, cursor: 'pointer', padding: 0 }}>← Zurück</button>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 26, fontWeight: 700, color: '#c9a96e', margin: 0 }}>
          Neuer Kunde
        </h1>
      </div>

      {error && (
        <div style={{ marginBottom: 16, background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e07060', borderRadius: 3, padding: '10px 16px', fontSize: 13 }}>
          {error}
        </div>
      )}

      <form onSubmit={e => handleSubmit(e, 'list')}>
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3 }}>

          {/* Company Info */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Firmendaten</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Firmenname / Name *</label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                  placeholder="Musterfirma GmbH" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ansprechpartner</label>
                <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)}
                  placeholder="Max Mustermann" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-Mail</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  placeholder="kontakt@firma.de" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Straße + Hausnummer</label>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                  placeholder="Musterstraße 42" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PLZ</label>
                <input type="text" value={form.postal_code} onChange={e => update('postal_code', e.target.value)}
                  placeholder="12345" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ort</label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                  placeholder="Berlin" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Land</label>
                <input type="text" value={form.country} onChange={e => update('country', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>USt-IdNr. (Kunde)</label>
                <input type="text" value={form.tax_id} onChange={e => update('tax_id', e.target.value)}
                  placeholder="DE123456789" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Default Service */}
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Standard-Leistung (für schnelle Rechnungserstellung)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Standard-Leistungsbeschreibung</label>
                <input type="text" value={form.default_service} onChange={e => update('default_service', e.target.value)}
                  placeholder="z.B. Social Media Management – Instagram & Facebook" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Standard-Betrag (€)</label>
                <input type="number" value={form.default_amount} onChange={e => update('default_amount', e.target.value)}
                  placeholder="0.00" step="0.01" min="0" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '20px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => router.back()}
              style={{ padding: '8px 18px', fontSize: 13, background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', borderRadius: 3, cursor: 'pointer' }}>
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 18px', fontSize: 13, background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', borderRadius: 3, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button type="button" disabled={saving}
              onClick={e => handleSubmit(e as unknown as React.FormEvent, 'invoice')}
              style={{ padding: '8px 18px', fontSize: 13, background: '#c9a96e', color: '#111111', borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Speichern...' : 'Speichern & Rechnung erstellen'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
