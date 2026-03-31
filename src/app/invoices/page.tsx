'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatGermanCurrency, formatGermanDate } from '@/lib/utils'
import type { Invoice } from '@/lib/types'

const STATUS_OPTIONS = ['', 'Entwurf', 'Versendet', 'Bezahlt']

const statusColor = (status: string) => {
  if (status === 'Bezahlt') return 'bg-green-100 text-green-800'
  if (status === 'Versendet') return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-700'
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [statusFilter, setStatusFilter] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  async function loadInvoices() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (yearFilter) params.set('year', yearFilter)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/invoices?${params}`)
      const data = await res.json()
      setInvoices(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [yearFilter, statusFilter])

  async function handleDelete(id: number, invoiceNumber: string) {
    if (!confirm(`Rechnung ${invoiceNumber} wirklich löschen?`)) return
    setDeleting(id)
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      setInvoices(prev => prev.filter(i => i.id !== id))
    } catch (e) {
      alert('Fehler beim Löschen der Rechnung.')
    } finally {
      setDeleting(null)
    }
  }

  const totalAmount = invoices.reduce((s, inv) => s + inv.total, 0)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
        <Link
          href="/invoices/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Neue Rechnung
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Jahr:</label>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Jahre</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s || 'Alle Status'}</option>
            ))}
          </select>
        </div>
        {invoices.length > 0 && (
          <div className="ml-auto text-sm text-gray-500">
            {invoices.length} Rechnung(en) · Gesamt: <strong>{formatGermanCurrency(totalAmount)}</strong>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Lade Rechnungen...</div>
        ) : invoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            Keine Rechnungen gefunden.{' '}
            <Link href="/invoices/new" className="text-blue-600 hover:underline">
              Neue Rechnung erstellen
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                  <th className="px-5 py-3 text-left font-medium">Rechnungsnr.</th>
                  <th className="px-5 py-3 text-left font-medium">Kunde</th>
                  <th className="px-5 py-3 text-left font-medium">Datum</th>
                  <th className="px-5 py-3 text-left font-medium">Leistungszeitraum</th>
                  <th className="px-5 py-3 text-right font-medium">Betrag</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-gray-700 text-xs">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">
                      {inv.customer_name || inv.customer_snapshot?.name || '—'}
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
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/invoices/${inv.id}/print`, '_blank')}
                          className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                          title="PDF anzeigen"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id, inv.invoice_number)}
                          disabled={deleting === inv.id}
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
