'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { formatGermanDate, todayISOString } from '@/lib/utils'
import type { Invoice, Customer, Settings } from '@/lib/types'

interface InvoiceItem {
  description: string
  amount: string
}

const statusStyle = (status: string): React.CSSProperties => {
  if (status === 'Bezahlt') return { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 3, padding: '2px 10px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
  if (status === 'Versendet') return { background: 'rgba(201,169,110,0.15)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 3, padding: '2px 10px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
  return { background: 'rgba(138,133,128,0.15)', color: '#8a8580', border: '1px solid rgba(138,133,128,0.3)', borderRadius: 3, padding: '2px 10px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
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

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  // Edit form state
  const [customerId, setCustomerId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [date, setDate] = useState('')
  const [servicePeriod, setServicePeriod] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', amount: '' }])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('Entwurf')

  useEffect(() => {
    async function load() {
      try {
        const [invRes, custRes, settingsRes] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch('/api/customers'),
          fetch('/api/settings'),
        ])
        const invData = await invRes.json()
        const custData = await custRes.json()
        const settingsData = await settingsRes.json()

        if (!invRes.ok) {
          setError(invData.error || 'Rechnung nicht gefunden')
          return
        }

        setInvoice(invData)
        setCustomers(Array.isArray(custData) ? custData : [])
        setSettings(settingsData)

        // Pre-fill form
        setCustomerId(invData.customer_id ? String(invData.customer_id) : '')
        setInvoiceNumber(invData.invoice_number)
        setDate(invData.date)
        setServicePeriod(invData.service_period || '')
        setItems(invData.items?.map((i: { description: string; amount: number }) => ({
          description: i.description,
          amount: String(i.amount),
        })) || [{ description: '', amount: '' }])
        setNotes(invData.notes || '')
        setStatus(invData.status)
      } catch (e) {
        setError('Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function updateItem(index: number, field: 'description' | 'amount', value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const isKleinunternehmer = settings?.is_kleinunternehmer === 'true'
  const taxRate = isKleinunternehmer ? 0 : 19
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €'

  async function handleSave() {
    if (!invoiceNumber.trim()) {
      setError('Rechnungsnummer ist erforderlich.')
      return
    }

    const selectedCustomer = customers.find(c => c.id === parseInt(customerId))
    const customerSnapshot = selectedCustomer ? {
      name: selectedCustomer.name,
      contact_name: selectedCustomer.contact_name,
      address: selectedCustomer.address,
      postal_code: selectedCustomer.postal_code,
      city: selectedCustomer.city,
      country: selectedCustomer.country,
      email: selectedCustomer.email,
      tax_id: selectedCustomer.tax_id,
    } : invoice?.customer_snapshot || {}

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          customer_id: customerId ? parseInt(customerId) : null,
          customer_snapshot: customerSnapshot,
          date,
          service_period: servicePeriod,
          items: items.map(i => ({ description: i.description, amount: parseFloat(i.amount) || 0 })),
          tax_rate: taxRate,
          status,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setInvoice(data)
      setEditing(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoice,
          customer_snapshot: invoice?.customer_snapshot || {},
          items: invoice?.items || [],
          tax_rate: invoice?.tax_rate || 0,
          status: newStatus,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInvoice(data)
      setStatus(newStatus)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Fehler beim Status-Update')
    }
  }

  async function handleDelete() {
    if (!confirm(`Rechnung ${invoice?.invoice_number} wirklich löschen?`)) return
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      router.push('/invoices')
    } catch (e) {
      alert('Fehler beim Löschen')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#8a8580', background: '#111111', minHeight: '100vh' }}>
        Lade Rechnung...
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div style={{ padding: '40px', fontFamily: '"DM Sans", system-ui, sans-serif', background: '#111111', minHeight: '100vh' }}>
        <div style={{ color: '#e07060', fontSize: 13 }}>{error}</div>
        <button onClick={() => router.back()} style={{ marginTop: 16, background: 'transparent', border: 'none', color: '#c9a96e', fontSize: 13, cursor: 'pointer', padding: 0 }}>← Zurück</button>
      </div>
    )
  }

  if (!invoice) return null

  const sectionStyle: React.CSSProperties = {
    padding: '24px',
    borderBottom: '1px solid rgba(201,169,110,0.1)',
  }

  const sectionHeadingStyle: React.CSSProperties = {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontSize: 15,
    fontWeight: 600,
    color: '#c9a96e',
    marginBottom: 16,
    margin: '0 0 16px 0',
  }

  return (
    <div style={{ padding: '32px', maxWidth: 720, margin: '0 auto', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/invoices')} style={{ background: 'transparent', border: 'none', color: '#8a8580', fontSize: 13, cursor: 'pointer', padding: 0 }}>← Zurück</button>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 24, fontWeight: 700, color: '#c9a96e', margin: 0 }}>
          Rechnung {invoice.invoice_number}
        </h1>
        <span style={statusStyle(invoice.status)}>{invoice.status}</span>
      </div>

      {error && (
        <div style={{ marginBottom: 16, background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e07060', borderRadius: 3, padding: '10px 16px', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => window.open(`/invoices/${id}/print`, '_blank')}
          style={{ padding: '8px 16px', background: '#c9a96e', color: '#111111', fontSize: 13, fontWeight: 600, borderRadius: 3, border: 'none', cursor: 'pointer' }}
        >
          Als PDF speichern / Drucken
        </button>
        <button
          onClick={() => setEditing(!editing)}
          style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', fontSize: 13, borderRadius: 3, cursor: 'pointer' }}
        >
          {editing ? 'Abbrechen' : 'Bearbeiten'}
        </button>

        {invoice.status === 'Entwurf' && (
          <button
            onClick={() => handleStatusUpdate('Versendet')}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', fontSize: 13, borderRadius: 3, cursor: 'pointer' }}
          >
            Als versendet markieren
          </button>
        )}
        {invoice.status === 'Versendet' && (
          <button
            onClick={() => handleStatusUpdate('Bezahlt')}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: 13, borderRadius: 3, cursor: 'pointer' }}
          >
            Als bezahlt markieren
          </button>
        )}

        <button
          onClick={handleDelete}
          style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(192,57,43,0.3)', color: '#c0392b', fontSize: 13, borderRadius: 3, cursor: 'pointer', marginLeft: 'auto' }}
        >
          Löschen
        </button>
      </div>

      {!editing ? (
        /* View mode */
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3 }}>
          <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: '#8a8580', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rechnungsnummer</p>
              <p style={{ fontFamily: 'monospace', color: '#f5f2ee', fontSize: 13 }}>{invoice.invoice_number}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#8a8580', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datum</p>
              <p style={{ color: '#f5f2ee', fontSize: 13 }}>{formatGermanDate(invoice.date)}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#8a8580', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leistungszeitraum</p>
              <p style={{ color: '#f5f2ee', fontSize: 13 }}>{invoice.service_period || '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#8a8580', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kunde</p>
              <p style={{ color: '#f5f2ee', fontSize: 13, fontWeight: 600 }}>
                {invoice.customer_name || invoice.customer_snapshot?.name || '—'}
              </p>
            </div>
          </div>
          <div style={sectionStyle}>
            <p style={{ fontSize: 11, color: '#8a8580', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Positionen</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invoice.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#f5f2ee' }}>{item.description}</span>
                  <span style={{ fontFamily: 'monospace', color: '#c9a96e' }}>{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(201,169,110,0.1)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8a8580' }}>
                <span>Nettobetrag</span>
                <span style={{ fontFamily: 'monospace' }}>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8a8580' }}>
                  <span>MwSt. ({invoice.tax_rate}%)</span>
                  <span style={{ fontFamily: 'monospace' }}>{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#f5f2ee' }}>
                <span>Gesamtbetrag</span>
                <span style={{ fontFamily: 'monospace', color: '#c9a96e' }}>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
          {invoice.notes && (
            <div style={sectionStyle}>
              <p style={{ fontSize: 11, color: '#8a8580', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notizen</p>
              <p style={{ fontSize: 13, color: '#f5f2ee', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
            </div>
          )}
        </div>
      ) : (
        /* Edit mode */
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3 }}>
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Rechnungsdetails</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Rechnungsnummer *</label>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={labelStyle}>Datum</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Leistungszeitraum</label>
                <input type="text" value={servicePeriod} onChange={e => setServicePeriod(e.target.value)}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  style={inputStyle}>
                  <option value="Entwurf">Entwurf</option>
                  <option value="Versendet">Versendet</option>
                  <option value="Bezahlt">Bezahlt</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Kunde</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                  style={inputStyle}>
                  <option value="">— Kein Kunde —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>Positionen</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: 8 }}>
                  <input type="text" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)}
                    placeholder="Beschreibung"
                    style={{ ...inputStyle, flex: 1 }} />
                  <input type="number" value={item.amount} onChange={e => updateItem(index, 'amount', e.target.value)}
                    step="0.01" style={{ ...inputStyle, width: 120, textAlign: 'right', fontFamily: 'monospace' }} />
                  {items.length > 1 && (
                    <button onClick={() => setItems(p => p.filter((_, i) => i !== index))}
                      style={{ padding: '8px 10px', background: 'transparent', border: '1px solid rgba(192,57,43,0.3)', color: '#c0392b', borderRadius: 3, cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setItems(p => [...p, { description: '', amount: '' }])}
              style={{ marginTop: 12, background: 'transparent', border: 'none', color: '#c9a96e', fontSize: 13, cursor: 'pointer', padding: 0 }}>
              + Position hinzufügen
            </button>
          </div>
          <div style={sectionStyle}>
            <div style={{ background: '#111111', borderRadius: 3, border: '1px solid rgba(201,169,110,0.1)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8a8580' }}>
                <span>Nettobetrag</span>
                <span style={{ fontFamily: 'monospace' }}>{formatCurrency(subtotal)}</span>
              </div>
              {!isKleinunternehmer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8a8580' }}>
                  <span>MwSt. (19%)</span>
                  <span style={{ fontFamily: 'monospace' }}>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#f5f2ee', paddingTop: 8, borderTop: '1px solid rgba(201,169,110,0.15)' }}>
                <span>Gesamt</span>
                <span style={{ fontFamily: 'monospace', color: '#c9a96e' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          <div style={sectionStyle}>
            <label style={labelStyle}>Notizen</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)}
              style={{ padding: '8px 18px', fontSize: 13, background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', borderRadius: 3, cursor: 'pointer' }}>
              Abbrechen
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 18px', fontSize: 13, background: '#c9a96e', color: '#111111', borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Speichern...' : 'Änderungen speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
