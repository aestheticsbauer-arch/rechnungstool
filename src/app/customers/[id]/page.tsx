'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { formatGermanCurrency, formatGermanDate } from '@/lib/utils'
import type { Customer, Invoice } from '@/lib/types'

const statusStyle = (status: string): React.CSSProperties => {
  if (status === 'Bezahlt') return { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
  if (status === 'Versendet') return { background: 'rgba(201,169,110,0.15)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
  return { background: 'rgba(138,133,128,0.15)', color: '#8a8580', border: '1px solid rgba(138,133,128,0.3)', borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
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

export default function EditCustomerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])

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

  useEffect(() => {
    async function load() {
      try {
        const [custRes, invRes] = await Promise.all([
          fetch(`/api/customers/${id}`),
          fetch(`/api/invoices?customer_id=${id}`),
        ])
        const custData = await custRes.json()
        const invData = await invRes.json()

        if (!custRes.ok) {
          setError(custData.error || 'Kunde nicht gefunden')
          return
        }

        const c: Customer = custData
        setForm({
          name: c.name,
          contact_name: c.contact_name || '',
          address: c.address || '',
          postal_code: c.postal_code || '',
          city: c.city || '',
          country: c.country || 'Deutschland',
          email: c.email || '',
          tax_id: c.tax_id || '',
          default_service: c.default_service || '',
          default_amount: c.default_amount ? String(c.default_amount) : '',
        })
        setInvoices(Array.isArray(invData) ? invData : [])
      } catch {
        setError('Fehler beim Laden des Kunden')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Kundenname ist erforderlich.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          default_amount: parseFloat(form.default_amount) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      router.push('/customers')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const totalInvoiced = invoices.reduce((s, inv) => s + inv.total, 0)

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#8a8580', background: '#111111', minHeight: '100vh' }}>
        Lade Kundendaten...
      </div>
    )
  }

  if (error && !form.name) {
    return (
      <div style={{ padding: '40px', fontFamily: '"DM Sans", system-ui, sans-serif', background: '#111111', minHeight: '100vh' }}>
        <div style={{ color: '#e07060', fontSize: 13 }}>{error}</div>
        <button onClick={() => router.back()} style={{ marginTop: 16, background: 'transparent', border: 'none', color: '#c9a96e', fontSize: 13, cursor: 'pointer', padding: 0 }}>← Zurück</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: 760, margin: '0 auto', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/customers')} style={{ background: 'transparent', border: 'none', color: '#8a8580', fontSize: 13, cursor: 'pointer', padding: 0 }}>← Zurück</button>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: '#c9a96e', margin: 0 }}>
          {form.name || 'Kunde bearbeiten'}
        </h1>
      </div>

      {error && (
        <div style={{ marginBottom: 16, background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e07060', borderRadius: 3, padding: '10px 16px', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/invoices/new?customer_id=${id}`}
          style={{ display: 'inline-block', padding: '8px 18px', background: '#c9a96e', color: '#111111', fontSize: 13, fontWeight: 600, borderRadius: 3, textDecoration: 'none' }}
        >
          + Neue Rechnung für diesen Kunden
        </Link>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, marginBottom: 24 }}>
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Firmendaten</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Firmenname / Name *</label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ansprechpartner</label>
                <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-Mail</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Straße + Hausnummer</label>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PLZ</label>
                <input type="text" value={form.postal_code} onChange={e => update('postal_code', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ort</label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Land</label>
                <input type="text" value={form.country} onChange={e => update('country', e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>USt-IdNr. (Kunde)</label>
                <input type="text" value={form.tax_id} onChange={e => update('tax_id', e.target.value)}
                  style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Standard-Leistung</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Standard-Leistungsbeschreibung</label>
                <input type="text" value={form.default_service} onChange={e => update('default_service', e.target.value)}
                  placeholder="z.B. Social Media Management – Instagram & Facebook" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Standard-Betrag (€)</label>
                <input type="number" value={form.default_amount} onChange={e => update('default_amount', e.target.value)}
                  step="0.01" min="0" style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => router.push('/customers')}
              style={{ padding: '8px 18px', fontSize: 13, background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', borderRadius: 3, cursor: 'pointer' }}>
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: '8px 18px', fontSize: 13, background: '#c9a96e', color: '#111111', borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Speichern...' : 'Änderungen speichern'}
            </button>
          </div>
        </div>
      </form>

      {/* Customer Invoices */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: '#c9a96e', margin: 0 }}>
            Rechnungen ({invoices.length})
          </h2>
          {invoices.length > 0 && (
            <span style={{ fontSize: 13, color: '#8a8580' }}>
              Gesamt: <strong style={{ color: '#c9a96e' }}>{formatGermanCurrency(totalInvoiced)}</strong>
            </span>
          )}
        </div>
        {invoices.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8a8580', fontSize: 13 }}>
            Noch keine Rechnungen für diesen Kunden.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(201,169,110,0.05)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rechnungsnr.</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Datum</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Leistungszeitraum</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Betrag</th>
                  <th style={{ padding: '10px 20px', textAlign: 'center', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <Link href={`/invoices/${inv.id}`} style={{ fontFamily: 'monospace', color: '#c9a96e', textDecoration: 'none', fontSize: 12 }}>
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 20px', color: '#8a8580' }}>{formatGermanDate(inv.date)}</td>
                    <td style={{ padding: '12px 20px', color: '#8a8580' }}>{inv.service_period || '—'}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600, color: '#f5f2ee', fontFamily: 'monospace' }}>
                      {formatGermanCurrency(inv.total)}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <span style={statusStyle(inv.status)}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
