'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { todayISOString, currentMonthName } from '@/lib/utils'
import type { Customer, Settings } from '@/lib/types'

interface InvoiceItem {
  description: string
  amount: string
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
    return <div className="p-8 text-gray-500">Lade Formulardaten...</div>
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Zurück</button>
        <h1 className="text-2xl font-bold text-gray-900">Neue Rechnung</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">

        {/* Customer Section */}
        <div className="p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Kunde</h2>
          <div className="flex gap-3">
            <select
              value={customerId}
              onChange={e => handleCustomerChange(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Kunde auswählen —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCustomer(!showNewCustomer)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap"
            >
              {showNewCustomer ? '✕ Schließen' : '+ Neuer Kunde'}
            </button>
          </div>

          {/* Inline new customer form */}
          {showNewCustomer && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-3 text-sm">Neuen Kunden anlegen</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Firmenname *</label>
                  <input type="text" value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Musterfirma GmbH" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ansprechpartner</label>
                  <input type="text" value={newCustomer.contact_name} onChange={e => setNewCustomer(p => ({ ...p, contact_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">E-Mail</label>
                  <input type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Straße + Hausnummer</label>
                  <input type="text" value={newCustomer.address} onChange={e => setNewCustomer(p => ({ ...p, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">PLZ</label>
                  <input type="text" value={newCustomer.postal_code} onChange={e => setNewCustomer(p => ({ ...p, postal_code: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ort</label>
                  <input type="text" value={newCustomer.city} onChange={e => setNewCustomer(p => ({ ...p, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Standard-Leistung</label>
                  <input type="text" value={newCustomer.default_service} onChange={e => setNewCustomer(p => ({ ...p, default_service: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="z.B. Social Media Management" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Standard-Betrag (€)</label>
                  <input type="number" value={newCustomer.default_amount} onChange={e => setNewCustomer(p => ({ ...p, default_amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" step="0.01" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={handleSaveCustomer} disabled={savingCustomer}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {savingCustomer ? 'Speichern...' : 'Kunde speichern'}
                </button>
                <button onClick={() => setShowNewCustomer(false)}
                  className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 text-gray-600">
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Rechnungsdetails</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">Rechnungsnummer *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">Datum *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">Leistungszeitraum</label>
              <input
                type="text"
                value={servicePeriod}
                onChange={e => setServicePeriod(e.target.value)}
                placeholder="z.B. März 2025"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Entwurf">Entwurf</option>
                <option value="Versendet">Versendet</option>
                <option value="Bezahlt">Bezahlt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Leistungspositionen</h2>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={item.description}
                  onChange={e => updateItem(index, 'description', e.target.value)}
                  placeholder="Beschreibung der Leistung"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={item.amount}
                  onChange={e => updateItem(index, 'amount', e.target.value)}
                  placeholder="Betrag"
                  step="0.01"
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="px-2.5 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            + Position hinzufügen
          </button>
        </div>

        {/* Tax & Totals */}
        <div className="p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Steuer & Gesamtbetrag</h2>

          {isKleinunternehmer ? (
            <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4">
              Kleinunternehmer gemäß § 19 UStG – keine Umsatzsteuer
            </div>
          ) : (
            <div className="text-sm text-gray-600 mb-4">
              Umsatzsteuer: 19%
            </div>
          )}

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
              <span>Gesamtbetrag</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Notizen (optional)</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Interne Notizen oder Anmerkungen auf der Rechnung..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3 justify-end">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            Abbrechen
          </button>
          <button
            onClick={() => handleSubmit('list')}
            disabled={saving}
            className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            onClick={() => handleSubmit('print')}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
    <Suspense fallback={<div className="p-8 text-gray-500">Lade Formular...</div>}>
      <NewInvoiceContent />
    </Suspense>
  )
}
