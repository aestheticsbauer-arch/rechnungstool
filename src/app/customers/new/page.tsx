'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Zurück</button>
        <h1 className="text-2xl font-bold text-gray-900">Neuer Kunde</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={e => handleSubmit(e, 'list')}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">

          {/* Company Info */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Firmendaten</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">Firmenname / Name *</label>
                <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                  placeholder="Musterfirma GmbH"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Ansprechpartner</label>
                <input type="text" value={form.contact_name} onChange={e => update('contact_name', e.target.value)}
                  placeholder="Max Mustermann"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">E-Mail</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  placeholder="kontakt@firma.de"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">Straße + Hausnummer</label>
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                  placeholder="Musterstraße 42"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">PLZ</label>
                <input type="text" value={form.postal_code} onChange={e => update('postal_code', e.target.value)}
                  placeholder="12345"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Ort</label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                  placeholder="Berlin"
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
                  placeholder="DE123456789"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Default Service */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Standard-Leistung (für schnelle Rechnungserstellung)</h2>
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
                  placeholder="0.00" step="0.01" min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 flex gap-3 justify-end flex-wrap">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
              Abbrechen
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50">
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button type="button" disabled={saving}
              onClick={e => handleSubmit(e as unknown as React.FormEvent, 'invoice')}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Speichern...' : 'Speichern & Rechnung erstellen'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
