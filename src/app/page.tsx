'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatGermanCurrency, formatGermanDate, getMonthName, GERMAN_MONTHS } from '@/lib/utils'
import type { Invoice } from '@/lib/types'

interface MonthlyStats {
  month: number
  income: number
  invoice_count: number
}

export default function Dashboard() {
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [currentYear] = useState(new Date().getFullYear())
  const [currentMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    async function load() {
      try {
        const [invoicesRes, statsRes] = await Promise.all([
          fetch('/api/invoices'),
          fetch(`/api/stats?year=${currentYear}`),
        ])
        const invoices = await invoicesRes.json()
        const stats = await statsRes.json()

        setRecentInvoices(Array.isArray(invoices) ? invoices.slice(0, 5) : [])
        setMonthlyStats(stats.monthly || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentYear])

  const currentMonthStats = monthlyStats.find(m => m.month === currentMonth)
  const yearIncome = monthlyStats.reduce((s, m) => s + m.income, 0)
  const maxIncome = Math.max(...monthlyStats.map(m => m.income), 1)

  const statusColor = (status: string) => {
    if (status === 'Bezahlt') return 'bg-green-100 text-green-800'
    if (status === 'Versendet') return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-500">Lade Daten...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Übersicht</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Einnahmen {GERMAN_MONTHS[currentMonth - 1]}</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatGermanCurrency(currentMonthStats?.income || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{currentMonthStats?.invoice_count || 0} Rechnungen</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Jahreseinnahmen {currentYear}</p>
          <p className="text-2xl font-bold text-gray-900">{formatGermanCurrency(yearIncome)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {monthlyStats.reduce((s, m) => s + m.invoice_count, 0)} Rechnungen gesamt
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Schnellaktionen</p>
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href="/invoices/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Neue Rechnung
            </Link>
            <Link
              href="/customers/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              + Neuer Kunde
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Letzte Rechnungen</h2>
          <Link href="/invoices" className="text-sm text-blue-600 hover:underline">
            Alle anzeigen →
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Noch keine Rechnungen vorhanden.{' '}
            <Link href="/invoices/new" className="text-blue-600 hover:underline">
              Erste Rechnung erstellen
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Rechnungsnr.</th>
                  <th className="px-5 py-3 text-left font-medium">Kunde</th>
                  <th className="px-5 py-3 text-left font-medium">Datum</th>
                  <th className="px-5 py-3 text-right font-medium">Betrag</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv, i) => (
                  <tr
                    key={inv.id}
                    className={`border-t border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                  >
                    <td className="px-5 py-3 font-mono text-gray-700">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-gray-700">
                      {inv.customer_name || inv.customer_snapshot?.name || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatGermanDate(inv.date)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800">
                      {formatGermanCurrency(inv.total)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Income Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Monatseinnahmen {currentYear}</h2>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-2 h-40">
            {monthlyStats.map((m) => {
              const heightPct = maxIncome > 0 ? (m.income / maxIncome) * 100 : 0
              const isCurrentMonth = m.month === currentMonth
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all duration-300"
                    style={{
                      height: `${Math.max(heightPct, m.income > 0 ? 4 : 0)}%`,
                      backgroundColor: isCurrentMonth ? '#2563eb' : '#93c5fd',
                    }}
                    title={`${getMonthName(m.month)}: ${formatGermanCurrency(m.income)}`}
                  />
                  <span className="text-xs text-gray-400">{getMonthName(m.month).slice(0, 3)}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Aktueller Monat
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-300 inline-block" /> Andere Monate
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
