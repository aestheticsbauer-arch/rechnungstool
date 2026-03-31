'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { formatGermanDate, todayISOString } from '@/lib/utils'
import type { Invoice, Customer, Settings } from '@/lib/types'

interface InvoiceItem {
  description: string
  amount: string
}

const statusColor = (status: string) => {
  if (status === 'Bezahlt') return 'bg-green-100 text-green-800'
  if (status === 'Versendet') return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-700'
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
    return <div className="p-8 text-gray-500">Lade Rechnung...</div>
  }

  if (error && !invoice) {
    return (
      <div className="p-8">
        <div className="text-red-600">{error}</div>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline text-sm">← Zurück</button>
      </div>
    )
  }

  if (!invoice) return null

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/invoices')} className="text-gray-400 hover:text-gray-600 text-sm">← Zurück</button>
        <h1 className="text-2xl font-bold text-gray-900">Rechnung {invoice.invoice_number}</h1>
        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(invoice.status)}`}>
          {invoice.status}
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => window.open(`/invoices/${id}/print`, '_blank')}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          Als PDF speichern / Drucken
        </button>
        <button
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 text-gray-600"
        >
          {editing ? 'Abbrechen' : 'Bearbeiten'}
        </button>

        {/* Status Buttons */}
        {invoice.status === 'Entwurf' && (
          <button
            onClick={() => handleStatusUpdate('Versendet')}
            className="px-4 py-2 border border-blue-500 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50"
          >
            Als versendet markieren
          </button>
        )}
        {invoice.status === 'Versendet' && (
          <button
            onClick={() => handleStatusUpdate('Bezahlt')}
            className="px-4 py-2 border border-green-500 text-green-600 text-sm font-medium rounded-lg hover:bg-green-50"
          >
            Als bezahlt markieren
          </button>
        )}

        <button
          onClick={handleDelete}
          className="px-4 py-2 border border-red-300 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 ml-auto"
        >
          Löschen
        </button>
      </div>

      {!editing ? (
        /* View mode */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Rechnungsnummer</p>
              <p className="font-mono text-gray-800">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Datum</p>
              <p className="text-gray-800">{formatGermanDate(invoice.date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Leistungszeitraum</p>
              <p className="text-gray-800">{invoice.service_period || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Kunde</p>
              <p className="text-gray-800 font-medium">
                {invoice.customer_name || invoice.customer_snapshot?.name || '—'}
              </p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-xs text-gray-500 mb-3">Positionen</p>
            <div className="space-y-2">
              {invoice.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.description}</span>
                  <span className="font-mono text-gray-800">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Nettobetrag</span>
                <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>MwSt. ({invoice.tax_rate}%)</span>
                  <span className="font-mono">{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Gesamtbetrag</span>
                <span className="font-mono">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
          {invoice.notes && (
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-1">Notizen</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      ) : (
        /* Edit mode */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Rechnungsdetails</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Rechnungsnummer *</label>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Datum</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Leistungszeitraum</label>
                <input type="text" value={servicePeriod} onChange={e => setServicePeriod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Entwurf">Entwurf</option>
                  <option value="Versendet">Versendet</option>
                  <option value="Bezahlt">Bezahlt</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">Kunde</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Kein Kunde —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Positionen</h2>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input type="text" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)}
                    placeholder="Beschreibung"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="number" value={item.amount} onChange={e => updateItem(index, 'amount', e.target.value)}
                    step="0.01" className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {items.length > 1 && (
                    <button onClick={() => setItems(p => p.filter((_, i) => i !== index))}
                      className="px-2 text-red-400 hover:text-red-600">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setItems(p => [...p, { description: '', amount: '' }])}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800">
              + Position hinzufügen
            </button>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Nettobetrag</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {!isKleinunternehmer && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>MwSt. (19%)</span>
                  <span className="font-mono">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Gesamt</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <label className="block text-sm text-gray-600 mb-1 font-medium">Notizen</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="p-6 flex gap-3 justify-end">
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
              Abbrechen
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Speichern...' : 'Änderungen speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
