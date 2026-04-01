'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { todayISOString, currentMonthName } from '@/lib/utils'
import type { Customer, Settings } from '@/lib/types'

interface InvoiceItem {
  description: string
  amount: string
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
  marginBottom: 16,
  margin: '0 0 16px 0',
}

function NewInvoiceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get('customer_id')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [customerId, setCustomerId] = useState(preselectedCustomerId || '')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [date, setDate] = useState(todayISOString())
  const [servicePeriod, setServicePeriod] = useState(currentMonthName())
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', amount: '' }])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('Entwurf')

  // Inline new customer state
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '', contact_name: '', address: '', postal_code: '', city: '',
    country: 'Deutschland', email: '', tax_id: '', default_service: '', default_amount: '',
  })
  const [savingCustomer, setSavingCustomer] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [custRes, settingsRes, nextNumRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/settings'),
          fetch('/api/invoices/next-number'),
        ])
        const custData = await custRes.json()
        const settingsData = await settingsRes.json()
        const nextNumData = await nextNumRes.json()

        setCustomers(Array.isArray(custData) ? custData : [])
        setSettings(settingsData)
        setInvoiceNumber(nextNumData.next_number || '')
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // When customer is preselected on load, auto-fill
  useEffect(() => {
    if (preselectedCustomerId && customers.length > 0) {
      handleCustomerChange(preselectedCustomerId)
    }
  }, [customers, preselectedCustomerId])

  function handleCustomerChange(id: string) {
    setCustomerId(id)
    if (!id) return
    const customer = customers.find(c => c.id === parseInt(id))
    if (customer) {
      if (customer.default_service) {
        setItems([{ description: customer.default_service, amount: customer.default_amount ? String(customer.default_amount) : '' }])
      }
    }
  }

  function updateItem(index: number, field: 'description' | 'amount', value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', amount: '' }])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const isKleinunternehmer = settings?.is_kleinunternehmer === 'true'
  const taxRate = isKleinunternehmer ? 0 : 19
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  async function handleSaveCustomer() {
    if (!newCustomer.name.trim()) {
      alert('Kundenname ist erforderlich.')
      return
    }
    setSavingCustomer(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCustomer,
          default_amount: parseFloat(newCustomer.default_amount) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setCustomers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setCustomerId(String(data.id))
      if (data.default_service) {
        setItems([{ description: data.default_service, amount: data.default_amount ? String(data.default_amount) : '' }])
      }
      setShowNewCustomer(false)
      setNewCustomer({ name: '', contact_name: '', address: '', postal_code: '', city: '', country: 'Deutschland', email: '', tax_id: '', default_service: '', default_amount: '' })
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Fehler beim Speichern des Kunden')
    } finally {
      setSavingCustomer(false)
    }
  }

  async function handleSubmit(redirect: 'list' | 'print') {
    if (!invoiceNumber.trim()) {
      setError('Rechnungsnummer ist erforderlich.')
      return
    }
    if (!date) {
      setError('Datum ist erforderlich.')
      return
    }
    if (items.length === 0 || items.every(i => !i.description.trim())) {
      setError('Mindestens eine Leistungsposition ist erforderlich.')
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
    } : {}

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
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
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')

      if (redirect === 'print') {
        window.open(`/invoices/${data.id}/print`, '_blank')
        router.push('/invoices')
      } else {
        router.push('/invoices')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern der Rechnung')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#8a8580', background: '#111111', minHeight: '100vh' }}>
        Lade Formulardaten...
      </div>
    )
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €'

  return (
    <div style={{ padding: '32px', maxWidth: 720, margin: '0 auto', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', color: '#8a8580', fontSize: 13, cursor: 'pointer', padding: 0 }}
        >
          ← Zurück
        </button>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 26, fontWeight: 700, color: '#c9a96e', margin: 0 }}>
          Neue Rechnung
        </h1>
      </div>

      {error && (
        <div style={{ marginBottom: 16, background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e07060', borderRadius: 3, padding: '10px 16px', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3 }}>

        {/* Customer Section */}
        <div style={sectionStyle}>
          <h2 style={sectionHeadingStyle}>Kunde</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              value={customerId}
              onChange={e => handleCustomerChange(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="">— Kunde auswählen —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCustomer(!showNewCustomer)}
              style={{ padding: '8px 14px', fontSize: 13, background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {showNewCustomer ? '✕ Schließen' : '+ Neuer Kunde'}
            </button>
          </div>

          {/* Inline new customer form */}
          {showNewCustomer && (
            <div style={{ marginTop: 16, padding: 16, background: '#111111', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3 }}>
              <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 13, fontWeight: 600, color: '#c9a96e', marginBottom: 12, margin: '0 0 12px 0' }}>Neuen Kunden anlegen</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Firmenname *</label>
                  <input type="text" value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                    style={inputStyle} placeholder="Musterfirma GmbH" />
                </div>
                <div>
                  <label style={labelStyle}>Ansprechpartner</label>
                  <input type="text" value={newCustomer.contact_name} onChange={e => setNewCustomer(p => ({ ...p, contact_name: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>E-Mail</label>
                  <input type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Straße + Hausnummer</label>
                  <input type="text" value={newCustomer.address} onChange={e => setNewCustomer(p => ({ ...p, address: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>PLZ</label>
                  <input type="text" value={newCustomer.postal_code} onChange={e => setNewCustomer(p => ({ ...p, postal_code: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ort</label>
                  <input type="text" value={newCustomer.city} onChange={e => setNewCustomer(p => ({ ...p, city: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Standard-Leistung</label>
                  <input type="text" value={newCustomer.default_service} onChange={e => setNewCustomer(p => ({ ...p, default_service: e.target.value }))}
                    style={inputStyle} placeholder="z.B. Social Media Management" />
                </div>
                <div>
                  <label style={labelStyle}>Standard-Betrag (€)</label>
                  <input type="number" value={newCustomer.default_amount} onChange={e => setNewCustomer(p => ({ ...p, default_amount: e.target.value }))}
                    style={inputStyle} step="0.01" />
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={handleSaveCustomer} disabled={savingCustomer}
                  style={{ padding: '7px 16px', background: '#c9a96e', color: '#111111', fontSize: 13, fontWeight: 600, borderRadius: 3, border: 'none', cursor: 'pointer', opacity: savingCustomer ? 0.5 : 1 }}>
                  {savingCustomer ? 'Speichern...' : 'Kunde speichern'}
                </button>
                <button onClick={() => setShowNewCustomer(false)}
                  style={{ padding: '7px 16px', background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', fontSize: 13, borderRadius: 3, cursor: 'pointer' }}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div style={sectionStyle}>
          <h2 style={sectionHeadingStyle}>Rechnungsdetails</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Rechnungsnummer *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Datum *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Leistungszeitraum</label>
              <input
                type="text"
                value={servicePeriod}
                onChange={e => setServicePeriod(e.target.value)}
                placeholder="z.B. März 2025"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="Entwurf">Entwurf</option>
                <option value="Versendet">Versendet</option>
                <option value="Bezahlt">Bezahlt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={sectionStyle}>
          <h2 style={sectionHeadingStyle}>Leistungspositionen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <input
                  type="text"
                  value={item.description}
                  onChange={e => updateItem(index, 'description', e.target.value)}
                  placeholder="Beschreibung der Leistung"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="number"
                  value={item.amount}
                  onChange={e => updateItem(index, 'amount', e.target.value)}
                  placeholder="Betrag"
                  step="0.01"
                  style={{ ...inputStyle, width: 120, textAlign: 'right', fontFamily: 'monospace' }}
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    style={{ padding: '8px 10px', background: 'transparent', border: '1px solid rgba(192,57,43,0.3)', color: '#c0392b', borderRadius: 3, cursor: 'pointer', fontSize: 13 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            style={{ marginTop: 12, background: 'transparent', border: 'none', color: '#c9a96e', fontSize: 13, cursor: 'pointer', padding: 0 }}
          >
            + Position hinzufügen
          </button>
        </div>

        {/* Tax & Totals */}
        <div style={sectionStyle}>
          <h2 style={sectionHeadingStyle}>Steuer & Gesamtbetrag</h2>

          {isKleinunternehmer ? (
            <div style={{ fontSize: 13, color: '#8a8580', background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, padding: '10px 14px', marginBottom: 16 }}>
              Kleinunternehmer gemäß § 19 UStG – keine Umsatzsteuer
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#8a8580', marginBottom: 16 }}>
              Umsatzsteuer: 19%
            </div>
          )}

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
              <span>Gesamtbetrag</span>
              <span style={{ fontFamily: 'monospace', color: '#c9a96e' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={sectionStyle}>
          <h2 style={sectionHeadingStyle}>Notizen (optional)</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Interne Notizen oder Anmerkungen auf der Rechnung..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Actions */}
        <div style={{ padding: '20px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.back()}
            style={{ padding: '8px 18px', fontSize: 13, background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', borderRadius: 3, cursor: 'pointer' }}
          >
            Abbrechen
          </button>
          <button
            onClick={() => handleSubmit('list')}
            disabled={saving}
            style={{ padding: '8px 18px', fontSize: 13, background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', borderRadius: 3, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            onClick={() => handleSubmit('print')}
            disabled={saving}
            style={{ padding: '8px 18px', fontSize: 13, background: '#c9a96e', color: '#111111', borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Speichern...' : 'Vorschau & PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#8a8580', background: '#111111', minHeight: '100vh' }}>
        Lade Formular...
      </div>
    }>
      <NewInvoiceContent />
    </Suspense>
  )
}
