'use client'

import { useEffect, useState } from 'react'
import { formatGermanCurrency, formatGermanDate, getMonthName, todayISOString } from '@/lib/utils'

interface MonthlyData {
  month: number
  income: number
  invoice_count: number
  expenses: number
  expense_count: number
  net: number
}

interface StatsData {
  year: number
  monthly: MonthlyData[]
  total_income: number
  total_expenses: number
  net: number
  invoices: Array<{ id: number; invoice_number: string; customer_name: string; date: string; total: number; status: string }>
  expenses: Array<{ id: number; date: string; description: string; amount: number; category: string }>
}

const EXPENSE_CATEGORIES = [
  'Büromaterial', 'Software & Abonnements', 'Marketing', 'Reisekosten',
  'Telefon & Internet', 'Weiterbildung', 'Hardware', 'Betriebsausgaben', 'Sonstiges',
]

export default function StatsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'eur' | 'expenses'>('overview')

  // Add expense form
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    date: todayISOString(), description: '', amount: '', category: 'Sonstiges',
  })
  const [savingExpense, setSavingExpense] = useState(false)
  const [expenseError, setExpenseError] = useState('')

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i + 1)

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?year=${year}`)
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [year])

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseForm.description.trim() || !expenseForm.amount) {
      setExpenseError('Beschreibung und Betrag sind erforderlich.')
      return
    }
    setSavingExpense(true)
    setExpenseError('')
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setExpenseForm({ date: todayISOString(), description: '', amount: '', category: 'Sonstiges' })
      setShowAddExpense(false)
      loadStats()
    } catch (e: unknown) {
      setExpenseError(e instanceof Error ? e.message : 'Fehler beim Speichern')
    } finally {
      setSavingExpense(false)
    }
  }

  async function handleDeleteExpense(id: number) {
    if (!confirm('Ausgabe wirklich löschen?')) return
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      loadStats()
    } catch {
      alert('Fehler beim Löschen')
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Lade Statistiken...</div>
  }

  const monthly = stats?.monthly || []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Statistik & EÜR</h1>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => window.open(`/stats/eur-print?year=${year}`, '_blank')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            EÜR drucken
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Betriebseinnahmen {year}</p>
          <p className="text-2xl font-bold text-gray-900">{formatGermanCurrency(stats?.total_income || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Betriebsausgaben {year}</p>
          <p className="text-2xl font-bold text-red-600">{formatGermanCurrency(stats?.total_expenses || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Gewinn/Überschuss {year}</p>
          <p className={`text-2xl font-bold ${(stats?.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatGermanCurrency(stats?.net || 0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-gray-200">
        {([
          { key: 'overview', label: 'Monatsübersicht' },
          { key: 'eur', label: 'EÜR-Ansicht' },
          { key: 'expenses', label: 'Ausgaben' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                  <th className="px-5 py-3 text-left font-medium">Monat</th>
                  <th className="px-5 py-3 text-right font-medium">Einnahmen</th>
                  <th className="px-5 py-3 text-center font-medium">Rechnungen</th>
                  <th className="px-5 py-3 text-right font-medium">Ausgaben</th>
                  <th className="px-5 py-3 text-right font-medium">Gewinn</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.month} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{getMonthName(m.month)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">
                      {m.income > 0 ? formatGermanCurrency(m.income) : '—'}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-500">
                      {m.invoice_count > 0 ? m.invoice_count : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-red-600">
                      {m.expenses > 0 ? formatGermanCurrency(m.expenses) : '—'}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono font-semibold ${m.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {(m.income > 0 || m.expenses > 0) ? formatGermanCurrency(m.net) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td className="px-5 py-3 text-gray-800">Gesamt {year}</td>
                  <td className="px-5 py-3 text-right font-mono text-gray-800">
                    {formatGermanCurrency(stats?.total_income || 0)}
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600">
                    {monthly.reduce((s, m) => s + m.invoice_count, 0)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-red-600">
                    {formatGermanCurrency(stats?.total_expenses || 0)}
                  </td>
                  <td className={`px-5 py-3 text-right font-mono ${(stats?.net || 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatGermanCurrency(stats?.net || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* EÜR Tab */}
      {activeTab === 'eur' && (
        <div className="space-y-6">
          {/* Income */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Betriebseinnahmen</h2>
            </div>
            {(stats?.invoices || []).length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">
                Keine Einnahmen für {year}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                      <th className="px-5 py-3 text-left font-medium">Datum</th>
                      <th className="px-5 py-3 text-left font-medium">Rechnungsnr.</th>
                      <th className="px-5 py-3 text-left font-medium">Kunde</th>
                      <th className="px-5 py-3 text-right font-medium">Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.invoices || []).map((inv) => (
                      <tr key={inv.id} className="border-t border-gray-100">
                        <td className="px-5 py-2.5 text-gray-500">{formatGermanDate(inv.date)}</td>
                        <td className="px-5 py-2.5 font-mono text-gray-700 text-xs">{inv.invoice_number}</td>
                        <td className="px-5 py-2.5 text-gray-700">{inv.customer_name || '—'}</td>
                        <td className="px-5 py-2.5 text-right font-mono font-medium text-gray-800">
                          {formatGermanCurrency(inv.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                      <td colSpan={3} className="px-5 py-3 text-gray-800">Summe Betriebseinnahmen</td>
                      <td className="px-5 py-3 text-right font-mono text-gray-800">
                        {formatGermanCurrency(stats?.total_income || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Betriebsausgaben</h2>
            </div>
            {(stats?.expenses || []).length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">
                Keine Ausgaben für {year}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                      <th className="px-5 py-3 text-left font-medium">Datum</th>
                      <th className="px-5 py-3 text-left font-medium">Beschreibung</th>
                      <th className="px-5 py-3 text-left font-medium">Kategorie</th>
                      <th className="px-5 py-3 text-right font-medium">Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.expenses || []).map((exp) => (
                      <tr key={exp.id} className="border-t border-gray-100">
                        <td className="px-5 py-2.5 text-gray-500">{formatGermanDate(exp.date)}</td>
                        <td className="px-5 py-2.5 text-gray-700">{exp.description}</td>
                        <td className="px-5 py-2.5 text-gray-500">{exp.category}</td>
                        <td className="px-5 py-2.5 text-right font-mono font-medium text-red-600">
                          {formatGermanCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                      <td colSpan={3} className="px-5 py-3 text-gray-800">Summe Betriebsausgaben</td>
                      <td className="px-5 py-3 text-right font-mono text-red-600">
                        {formatGermanCurrency(stats?.total_expenses || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Net */}
          <div className={`rounded-xl border-2 p-5 ${(stats?.net || 0) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800 text-lg">
                Überschuss (Gewinn) {year}
              </span>
              <span className={`text-2xl font-bold ${(stats?.net || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatGermanCurrency(stats?.net || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Betriebseinnahmen {formatGermanCurrency(stats?.total_income || 0)} − Betriebsausgaben {formatGermanCurrency(stats?.total_expenses || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              {showAddExpense ? '✕ Schließen' : '+ Ausgabe hinzufügen'}
            </button>
          </div>

          {showAddExpense && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">Neue Ausgabe</h2>
              {expenseError && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{expenseError}</div>
              )}
              <form onSubmit={handleAddExpense}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Datum</label>
                    <input type="date" value={expenseForm.date}
                      onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Betrag (€)</label>
                    <input type="number" step="0.01" value={expenseForm.amount}
                      onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Beschreibung</label>
                    <input type="text" value={expenseForm.description}
                      onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="z.B. Adobe Creative Cloud Abo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 font-medium">Kategorie</label>
                    <select value={expenseForm.category}
                      onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowAddExpense(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                    Abbrechen
                  </button>
                  <button type="submit" disabled={savingExpense}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {savingExpense ? 'Speichern...' : 'Ausgabe speichern'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Ausgaben {year}</h2>
              {(stats?.expenses || []).length > 0 && (
                <span className="text-sm text-gray-500">
                  Gesamt: <strong className="text-red-600">{formatGermanCurrency(stats?.total_expenses || 0)}</strong>
                </span>
              )}
            </div>
            {(stats?.expenses || []).length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                Keine Ausgaben für {year} erfasst.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                      <th className="px-5 py-3 text-left font-medium">Datum</th>
                      <th className="px-5 py-3 text-left font-medium">Beschreibung</th>
                      <th className="px-5 py-3 text-left font-medium">Kategorie</th>
                      <th className="px-5 py-3 text-right font-medium">Betrag</th>
                      <th className="px-5 py-3 text-right font-medium">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.expenses || []).map((exp) => (
                      <tr key={exp.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-500">{formatGermanDate(exp.date)}</td>
                        <td className="px-5 py-3 text-gray-800">{exp.description}</td>
                        <td className="px-5 py-3">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-red-600">
                          {formatGermanCurrency(exp.amount)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            Löschen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
