'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatGermanCurrency } from '@/lib/utils'
import type { Customer } from '@/lib/types'

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Kunde "${name}" wirklich löschen? Zugehörige Rechnungen bleiben erhalten.`)) return
    setDeleting(id)
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      setCustomers(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Fehler beim Löschen des Kunden.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
        <Link
          href="/customers/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Neuer Kunde
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Kunden suchen (Name, Ort, E-Mail)..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Lade Kunden...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            {search ? 'Keine Kunden gefunden.' : (
              <>
                Noch keine Kunden vorhanden.{' '}
                <Link href="/customers/new" className="text-blue-600 hover:underline">
                  Ersten Kunden anlegen
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Kontakt</th>
                  <th className="px-5 py-3 text-left font-medium">Ort</th>
                  <th className="px-5 py-3 text-left font-medium">E-Mail</th>
                  <th className="px-5 py-3 text-left font-medium">Standard-Leistung</th>
                  <th className="px-5 py-3 text-right font-medium">Std.-Betrag</th>
                  <th className="px-5 py-3 text-right font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-5 py-3 text-gray-500">{customer.contact_name || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {[customer.postal_code, customer.city].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {customer.email ? (
                        <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                          {customer.email}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                      {customer.default_service || '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700 font-mono text-xs">
                      {customer.default_amount > 0 ? formatGermanCurrency(customer.default_amount) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/invoices/new?customer_id=${customer.id}`)}
                          className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded transition-colors whitespace-nowrap"
                        >
                          Neue Rechnung
                        </button>
                        <button
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          disabled={deleting === customer.id}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          Löschen
                        </button>
                      </div>
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
