'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { formatGermanCurrency, formatGermanDate } from '@/lib/utils'
import type { Customer, Invoice } from '@/lib/types'

const statusColor = (status: string) => {
  if (status === 'Bezahlt') return 'bg-green-100 text-green-800'
  if (status === 'Versendet') return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-700'
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
    return <div className="p-8 text-gray-500">Lade Kundendaten...</div>
  }

  if (error && !form.name) {
    return (
      <div className="p-8">
        <div className="text-red-600">{error}</div>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline text-sm">← Zurück</button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/customers')} className="text-gray-400 hover:text-gray-600 text-sm">← Zurück</button>
        <h1 className="text-2xl font-bold text-gray-900">{form.name || 'Kunde bearbeiten'}</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6 flex gap-3">
        <Link
          href={`/invoices/new?customer_id=${id}`}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          + Neue Rechnung für diesen Kunden
        </Link>
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 mb-8">
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Firmendaten</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">Firmenname / Name *</label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Ansprechpartner</label>
                <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">E-Mail</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">Straße + Hausnummer</label>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">PLZ</label>
                <input type="text" value={form.postal_code} onChange={e => update('postal_code', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Ort</label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Land</label>
                <input type="text" value={form.country} onChange={e => update('country', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">USt-IdNr. (Kunde)</label>
                <input type="text" value={form.tax_id} onChange={e => update('tax_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Standard-Leistung</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">Standard-Leistungsbeschreibung</label>
                <input type="text" value={form.default_service} onChange={e => update('default_service', e.target.value)}
                  placeholder="z.B. Social Media Management – Instagram & Facebook"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Standard-Betrag (€)</label>
                <input type="number" value={form.default_amount} onChange={e => update('default_amount', e.target.value)}
                  step="0.01" min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="p-6 flex gap-3 justify-end">
            <button type="button" onClick={() => router.push('/customers')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Speichern...' : 'Änderungen speichern'}
            </button>
          </div>
        </div>
      </form>

      {/* Customer Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            Rechnungen ({invoices.length})
          </h2>
          {invoices.length > 0 && (
            <span className="text-sm text-gray-500">
              Gesamt: <strong>{formatGermanCurrency(totalInvoiced)}</strong>
            </span>
          )}
        </div>
        {invoices.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Noch keine Rechnungen für diesen Kunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                  <th className="px-5 py-3 text-left font-medium">Rechnungsnr.</th>
                  <th className="px-5 py-3 text-left font-medium">Datum</th>
                  <th className="px-5 py-3 text-left font-medium">Leistungszeitraum</th>
                  <th className="px-5 py-3 text-right font-medium">Betrag</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-blue-600 hover:underline text-xs">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatGermanDate(inv.date)}</td>
                    <td className="px-5 py-3 text-gray-500">{inv.service_period || '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">
                      {formatGermanCurrency(inv.total)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                        {inv.status}
                      </span>
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
