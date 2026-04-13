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
  eur_total_income: number
  eur_net: number
  total_expenses: number
  net: number
  invoices: Array<{ id: number; invoice_number: string; customer_name: string; date: string; total: number; status: string }>
  expenses: Array<{ id: number; date: string; description: string; amount: number; category: string }>
}

const EXPENSE_CATEGORIES = [
  'Büromaterial', 'Software & Abonnements', 'Marketing', 'Reisekosten',
  'Telefon & Internet', 'Weiterbildung', 'Hardware', 'Betriebsausgaben', 'Sonstiges',
]

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
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#8a8580',
  marginBottom: 4,
  fontWeight: 500,
}

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
    return (
      <div style={{ padding: '40px', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#8a8580', background: '#111111', minHeight: '100vh' }}>
        Lade Statistiken...
      </div>
    )
  }

  const monthly = stats?.monthly || []

  const thStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontWeight: 600,
    fontSize: 11,
    color: '#8a8580',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 28, fontWeight: 700, color: '#c9a96e', margin: 0 }}>
          Statistik & EÜR
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            style={{ ...inputStyle, width: 'auto' }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => window.open(`/stats/eur-print?year=${year}`, '_blank')}
            style={{ padding: '8px 18px', background: '#c9a96e', color: '#111111', fontSize: 13, fontWeight: 600, borderRadius: 3, border: 'none', cursor: 'pointer' }}
          >
            EÜR drucken
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, padding: 20 }}>
          <p style={{ fontSize: 12, color: '#8a8580', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Betriebseinnahmen {year}</p>
          <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: '#c9a96e', margin: 0 }}>{formatGermanCurrency(stats?.total_income || 0)}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, padding: 20 }}>
          <p style={{ fontSize: 12, color: '#8a8580', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Betriebsausgaben {year}</p>
          <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: '#c0392b', margin: 0 }}>{formatGermanCurrency(stats?.total_expenses || 0)}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, padding: 20 }}>
          <p style={{ fontSize: 12, color: '#8a8580', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gewinn/Überschuss {year}</p>
          <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: (stats?.net || 0) >= 0 ? '#4ade80' : '#c0392b', margin: 0 }}>
            {formatGermanCurrency(stats?.net || 0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,169,110,0.15)', marginBottom: 24 }}>
        {([
          { key: 'overview', label: 'Monatsübersicht' },
          { key: 'eur', label: 'EÜR-Ansicht' },
          { key: 'expenses', label: 'Ausgaben' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #c9a96e' : '2px solid transparent',
              color: activeTab === tab.key ? '#c9a96e' : '#8a8580',
              cursor: 'pointer',
              marginBottom: -1,
              fontFamily: '"DM Sans", system-ui, sans-serif',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(201,169,110,0.05)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Monat</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Einnahmen</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Rechnungen</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Ausgaben</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Gewinn</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.month} style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                    <td style={{ padding: '12px 20px', color: '#f5f2ee', fontWeight: 500 }}>{getMonthName(m.month)}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#f5f2ee' }}>
                      {m.income > 0 ? formatGermanCurrency(m.income) : <span style={{ color: '#8a8580' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', color: '#8a8580' }}>
                      {m.invoice_count > 0 ? m.invoice_count : '—'}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#c0392b' }}>
                      {m.expenses > 0 ? formatGermanCurrency(m.expenses) : <span style={{ color: '#8a8580' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: m.net >= 0 ? '#4ade80' : '#c0392b' }}>
                      {(m.income > 0 || m.expenses > 0) ? formatGermanCurrency(m.net) : <span style={{ color: '#8a8580' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.05)' }}>
                  <td style={{ padding: '12px 20px', color: '#c9a96e', fontWeight: 700 }}>Gesamt {year}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#f5f2ee' }}>
                    {formatGermanCurrency(stats?.total_income || 0)}
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'center', color: '#8a8580', fontWeight: 700 }}>
                    {monthly.reduce((s, m) => s + m.invoice_count, 0)}
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#c0392b' }}>
                    {formatGermanCurrency(stats?.total_expenses || 0)}
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: (stats?.net || 0) >= 0 ? '#4ade80' : '#c0392b' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Income */}
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: '#c9a96e', margin: 0 }}>Betriebseinnahmen</h2>
            </div>
            {(stats?.invoices || []).length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8a8580', fontSize: 13 }}>
                Keine Einnahmen für {year}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201,169,110,0.05)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Datum</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Rechnungsnr.</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Kunde</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.invoices || []).map((inv) => (
                      <tr key={inv.id} style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                        <td style={{ padding: '10px 20px', color: '#8a8580' }}>{formatGermanDate(inv.date)}</td>
                        <td style={{ padding: '10px 20px', fontFamily: 'monospace', color: '#c9a96e', fontSize: 12 }}>{inv.invoice_number}</td>
                        <td style={{ padding: '10px 20px', color: '#f5f2ee' }}>{inv.customer_name || '—'}</td>
                        <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#f5f2ee' }}>
                          {formatGermanCurrency(inv.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.05)' }}>
                      <td colSpan={3} style={{ padding: '12px 20px', color: '#c9a96e', fontWeight: 700 }}>Summe Betriebseinnahmen</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#c9a96e' }}>
                        {formatGermanCurrency(stats?.total_income || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Expenses */}
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: '#c9a96e', margin: 0 }}>Betriebsausgaben</h2>
            </div>
            {(stats?.expenses || []).length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8a8580', fontSize: 13 }}>
                Keine Ausgaben für {year}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201,169,110,0.05)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Datum</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Beschreibung</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Kategorie</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.expenses || []).map((exp) => (
                      <tr key={exp.id} style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                        <td style={{ padding: '10px 20px', color: '#8a8580' }}>{formatGermanDate(exp.date)}</td>
                        <td style={{ padding: '10px 20px', color: '#f5f2ee' }}>{exp.description}</td>
                        <td style={{ padding: '10px 20px', color: '#8a8580' }}>{exp.category}</td>
                        <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#c0392b' }}>
                          {formatGermanCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.05)' }}>
                      <td colSpan={3} style={{ padding: '12px 20px', color: '#c9a96e', fontWeight: 700 }}>Summe Betriebsausgaben</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#c0392b' }}>
                        {formatGermanCurrency(stats?.total_expenses || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Net */}
          <div style={{
            background: '#1a1a1a',
            border: `2px solid ${(stats?.net || 0) >= 0 ? 'rgba(74,222,128,0.3)' : 'rgba(192,57,43,0.3)'}`,
            borderRadius: 3,
            padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 16, fontWeight: 600, color: '#f5f2ee' }}>
                Überschuss (Gewinn) {year}
              </span>
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: (stats?.net || 0) >= 0 ? '#4ade80' : '#c0392b' }}>
                {formatGermanCurrency(stats?.net || 0)}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#8a8580', marginTop: 6 }}>
              Betriebseinnahmen {formatGermanCurrency(stats?.total_income || 0)} − Betriebsausgaben {formatGermanCurrency(stats?.total_expenses || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              onClick={() => setShowAddExpense(!showAddExpense)}
              style={{ padding: '8px 18px', background: '#c9a96e', color: '#111111', fontSize: 13, fontWeight: 600, borderRadius: 3, border: 'none', cursor: 'pointer' }}
            >
              {showAddExpense ? '✕ Schließen' : '+ Ausgabe hinzufügen'}
            </button>
          </div>

          {showAddExpense && (
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, padding: 24, marginBottom: 20 }}>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: '#c9a96e', margin: '0 0 16px 0' }}>Neue Ausgabe</h2>
              {expenseError && (
                <div style={{ marginBottom: 12, background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e07060', borderRadius: 3, padding: '8px 12px', fontSize: 13 }}>{expenseError}</div>
              )}
              <form onSubmit={handleAddExpense}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Datum</label>
                    <input type="date" value={expenseForm.date}
                      onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Betrag (€)</label>
                    <input type="number" step="0.01" value={expenseForm.amount}
                      onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="0.00" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Beschreibung</label>
                    <input type="text" value={expenseForm.description}
                      onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="z.B. Adobe Creative Cloud Abo" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Kategorie</label>
                    <select value={expenseForm.category}
                      onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}
                      style={inputStyle}>
                      {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowAddExpense(false)}
                    style={{ padding: '8px 18px', fontSize: 13, background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', color: '#c9a96e', borderRadius: 3, cursor: 'pointer' }}>
                    Abbrechen
                  </button>
                  <button type="submit" disabled={savingExpense}
                    style={{ padding: '8px 18px', fontSize: 13, background: '#c9a96e', color: '#111111', borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 600, opacity: savingExpense ? 0.5 : 1 }}>
                    {savingExpense ? 'Speichern...' : 'Ausgabe speichern'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 15, fontWeight: 600, color: '#c9a96e', margin: 0 }}>Ausgaben {year}</h2>
              {(stats?.expenses || []).length > 0 && (
                <span style={{ fontSize: 13, color: '#8a8580' }}>
                  Gesamt: <strong style={{ color: '#c0392b' }}>{formatGermanCurrency(stats?.total_expenses || 0)}</strong>
                </span>
              )}
            </div>
            {(stats?.expenses || []).length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a8580', fontSize: 13 }}>
                Keine Ausgaben für {year} erfasst.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201,169,110,0.05)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Datum</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Beschreibung</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Kategorie</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Betrag</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.expenses || []).map((exp) => (
                      <tr key={exp.id} style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                        <td style={{ padding: '12px 20px', color: '#8a8580' }}>{formatGermanDate(exp.date)}</td>
                        <td style={{ padding: '12px 20px', color: '#f5f2ee' }}>{exp.description}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', background: 'rgba(138,133,128,0.15)', color: '#8a8580', borderRadius: 3, fontSize: 11 }}>
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#c0392b' }}>
                          {formatGermanCurrency(exp.amount)}
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            style={{ fontSize: 12, color: '#c0392b', background: 'transparent', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer' }}
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
