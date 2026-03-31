'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatGermanDate, getMonthName } from '@/lib/utils'

interface MonthlyData {
  month: number
  income: number
  invoice_count: number
  expenses: number
  net: number
}

interface StatsData {
  year: number
  monthly: MonthlyData[]
  total_income: number
  total_expenses: number
  net: number
  invoices: Array<{ id: number; invoice_number: string; customer_name: string; date: string; total: number }>
  expenses: Array<{ id: number; date: string; description: string; amount: number; category: string }>
}

function EurPrintContent() {
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, settingsRes] = await Promise.all([
          fetch(`/api/stats?year=${year}`),
          fetch('/api/settings'),
        ])
        const statsData = await statsRes.json()
        const settingsData = await settingsRes.json()
        setStats(statsData)
        setCompanyName(settingsData.company_name || '')
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [year])

  useEffect(() => {
    if (!loading && stats) {
      const timer = setTimeout(() => window.print(), 600)
      return () => clearTimeout(timer)
    }
  }, [loading, stats])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n) + ' €'

  if (loading) {
    return <div style={{ padding: 40, fontFamily: 'Arial' }}>Lade EÜR...</div>
  }

  if (!stats) {
    return <div style={{ padding: 40, fontFamily: 'Arial' }}>Fehler beim Laden</div>
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; background: #f0f0f0; }
        .page { width: 210mm; min-height: 297mm; margin: 20px auto; background: white; padding: 20mm; box-shadow: 0 2px 20px rgba(0,0,0,0.15); }
        .print-btn { position: fixed; top: 15px; right: 15px; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; }
        h1 { font-size: 18pt; font-weight: bold; margin-bottom: 2mm; }
        h2 { font-size: 12pt; font-weight: bold; margin: 6mm 0 3mm 0; border-bottom: 1px solid #ccc; padding-bottom: 2mm; }
        h3 { font-size: 10pt; font-weight: bold; margin: 4mm 0 2mm 0; color: #444; }
        .subtitle { font-size: 9pt; color: #555; margin-bottom: 8mm; }
        table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 4mm; }
        th { background: #1a1a1a; color: white; padding: 2mm 3mm; text-align: left; font-size: 8pt; }
        th:last-child, th.right { text-align: right; }
        td { padding: 1.5mm 3mm; border-bottom: 1px solid #eee; vertical-align: top; }
        td.right, td:last-child { text-align: right; font-family: 'Courier New', monospace; }
        tr.subtotal td { font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333; background: #f5f5f5; }
        tr.total-row td { font-weight: bold; font-size: 11pt; background: #1a1a1a; color: white; }
        tr.total-row td.right { font-family: 'Courier New', monospace; }
        .positive { color: #166534; }
        .negative { color: #991b1b; }
        .summary-box { border: 2px solid #333; padding: 4mm; margin-top: 6mm; }
        .summary-row { display: flex; justify-content: space-between; padding: 1.5mm 0; font-size: 10pt; }
        .summary-row.bold { font-weight: bold; font-size: 12pt; border-top: 1px solid #ccc; margin-top: 2mm; padding-top: 3mm; }
        @media print {
          body { background: white; }
          .page { margin: 0; box-shadow: none; }
          .print-btn { display: none !important; }
        }
      `}</style>

      <button className="print-btn" onClick={() => window.print()}>
        Drucken / Als PDF speichern
      </button>

      <div className="page">
        <h1>Einnahmenüberschussrechnung</h1>
        <h1 style={{ fontSize: '16pt' }}>{year}</h1>
        {companyName && <div className="subtitle">{companyName}</div>}
        <div className="subtitle">
          Erstellt am: {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>

        {/* Monthly Summary Table */}
        <h2>Monatsübersicht</h2>
        <table>
          <thead>
            <tr>
              <th>Monat</th>
              <th className="right">Betriebseinnahmen</th>
              <th className="right">Betriebsausgaben</th>
              <th className="right">Überschuss</th>
            </tr>
          </thead>
          <tbody>
            {stats.monthly.map((m) => (
              <tr key={m.month}>
                <td>{getMonthName(m.month)} {year}</td>
                <td className="right">{m.income > 0 ? formatCurrency(m.income) : '—'}</td>
                <td className="right">{m.expenses > 0 ? formatCurrency(m.expenses) : '—'}</td>
                <td className={`right ${m.net >= 0 ? 'positive' : 'negative'}`}>
                  {(m.income > 0 || m.expenses > 0) ? formatCurrency(m.net) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="subtotal">
              <td>Jahresgesamt {year}</td>
              <td className="right">{formatCurrency(stats.total_income)}</td>
              <td className="right">{formatCurrency(stats.total_expenses)}</td>
              <td className={`right ${stats.net >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(stats.net)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Betriebseinnahmen Detail */}
        <h2>Betriebseinnahmen (Einzelaufstellung)</h2>
        {stats.invoices.length === 0 ? (
          <p style={{ fontSize: '9pt', color: '#666', marginBottom: '4mm' }}>Keine Einnahmen für {year} erfasst.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Rechnungsnummer</th>
                <th>Auftraggeber</th>
                <th className="right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {stats.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{formatGermanDate(inv.date)}</td>
                  <td style={{ fontFamily: 'Courier New, monospace' }}>{inv.invoice_number}</td>
                  <td>{inv.customer_name || '—'}</td>
                  <td className="right">{formatCurrency(inv.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="subtotal">
                <td colSpan={3}>Summe Betriebseinnahmen</td>
                <td className="right">{formatCurrency(stats.total_income)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Betriebsausgaben Detail */}
        <h2>Betriebsausgaben (Einzelaufstellung)</h2>
        {stats.expenses.length === 0 ? (
          <p style={{ fontSize: '9pt', color: '#666', marginBottom: '4mm' }}>Keine Ausgaben für {year} erfasst.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Beschreibung</th>
                <th>Kategorie</th>
                <th className="right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              {stats.expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{formatGermanDate(exp.date)}</td>
                  <td>{exp.description}</td>
                  <td>{exp.category}</td>
                  <td className="right">{formatCurrency(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="subtotal">
                <td colSpan={3}>Summe Betriebsausgaben</td>
                <td className="right">{formatCurrency(stats.total_expenses)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Final Summary */}
        <div className="summary-box">
          <div style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '3mm', borderBottom: '1px solid #ccc', paddingBottom: '2mm' }}>
            Zusammenfassung EÜR {year}
          </div>
          <div className="summary-row">
            <span>Betriebseinnahmen</span>
            <span style={{ fontFamily: 'Courier New, monospace' }}>{formatCurrency(stats.total_income)}</span>
          </div>
          <div className="summary-row">
            <span>Betriebsausgaben</span>
            <span style={{ fontFamily: 'Courier New, monospace' }}>− {formatCurrency(stats.total_expenses)}</span>
          </div>
          <div className={`summary-row bold ${stats.net >= 0 ? 'positive' : 'negative'}`}>
            <span>Gewinn / Überschuss {year}</span>
            <span style={{ fontFamily: 'Courier New, monospace' }}>{formatCurrency(stats.net)}</span>
          </div>
        </div>

        <div style={{ fontSize: '7.5pt', color: '#777', marginTop: '10mm', borderTop: '0.5px solid #ccc', paddingTop: '3mm' }}>
          Diese Einnahmenüberschussrechnung wurde automatisch generiert. Angaben ohne Gewähr. Bitte lassen Sie die EÜR von einem Steuerberater prüfen.
        </div>
      </div>
    </>
  )
}

export default function EurPrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'Arial' }}>Lade EÜR...</div>}>
      <EurPrintContent />
    </Suspense>
  )
}
