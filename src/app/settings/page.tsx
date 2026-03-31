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
    return <div className="p-8 text-gray-500">Lade Einstellungen...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Einstellungen</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          Einstellungen gespeichert.
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="space-y-6">

          {/* Company Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Meine Firmendaten</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">Firmenname / Ihr Name</label>
                <input type="text" value={form.company_name} onChange={e => update('company_name', e.target.value)}
                  placeholder="Max Mustermann Social Media"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">Straße + Hausnummer</label>
                <input type="text" value={form.company_address} onChange={e => update('company_address', e.target.value)}
                  placeholder="Musterstraße 1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">PLZ</label>
                <input type="text" value={form.company_postal_code} onChange={e => update('company_postal_code', e.target.value)}
                  placeholder="10115"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Ort</label>
                <input type="text" value={form.company_city} onChange={e => update('company_city', e.target.value)}
                  placeholder="Berlin"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Land</label>
                <input type="text" value={form.company_country} onChange={e => update('company_country', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">E-Mail</label>
                <input type="email" value={form.company_email} onChange={e => update('company_email', e.target.value)}
                  placeholder="info@meinefirma.de"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Telefon</label>
                <input type="tel" value={form.company_phone} onChange={e => update('company_phone', e.target.value)}
                  placeholder="+49 30 12345678"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Bank */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Bankverbindung</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1 font-medium">IBAN</label>
                <input type="text" value={form.company_iban} onChange={e => update('company_iban', e.target.value)}
                  placeholder="DE12 3456 7890 1234 5678 90"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">BIC</label>
                <input type="text" value={form.company_bic} onChange={e => update('company_bic', e.target.value)}
                  placeholder="DEUTDEDB"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Bank</label>
                <input type="text" value={form.company_bank} onChange={e => update('company_bank', e.target.value)}
                  placeholder="Deutsche Bank"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Tax */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Steuer</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Steuernummer</label>
                <input type="text" value={form.tax_number} onChange={e => update('tax_number', e.target.value)}
                  placeholder="12/345/67890"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">USt-IdNr.</label>
                <input type="text" value={form.tax_id} onChange={e => update('tax_id', e.target.value)}
                  placeholder="DE123456789"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_kleinunternehmer === 'true'}
                    onChange={e => update('is_kleinunternehmer', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Kleinunternehmer gemäß § 19 UStG (keine MwSt auf Rechnungen)
                  </span>
                </label>
                {form.is_kleinunternehmer === 'true' && (
                  <p className="mt-2 text-xs text-gray-500 ml-7">
                    Auf Rechnungen wird keine Umsatzsteuer ausgewiesen. Der Hinweis „Gemäß § 19 UStG wird keine Umsatzsteuer berechnet." wird automatisch auf der Rechnung eingefügt.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Rechnungseinstellungen</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Rechnungspräfix</label>
                <input type="text" value={form.invoice_prefix} onChange={e => update('invoice_prefix', e.target.value)}
                  placeholder="RE"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Rechnungssuffix (Nachname)</label>
                <input type="text" value={form.invoice_suffix} onChange={e => update('invoice_suffix', e.target.value)}
                  placeholder="Bauer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="mt-1 text-xs text-gray-400">
                  Ergebnis: RE-2026-03-Bauer
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Zahlungsziel (Tage)</label>
                <input type="number" value={form.payment_terms_days} onChange={e => update('payment_terms_days', e.target.value)}
                  min="0" max="90"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="mt-1 text-xs text-gray-400">
                  Zahlungsfrist in Tagen ab Rechnungsdatum
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Speichern...' : 'Einstellungen speichern'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
