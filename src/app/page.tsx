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

const inputStyle = {
  backgroundColor: '#1e1e1e',
  border: '1px solid rgba(201,169,110,0.3)',
  color: '#f5f2ee',
  borderRadius: '3px',
  padding: '8px 12px',
  fontSize: '13px',
  fontFamily: '"DM Sans", system-ui, sans-serif',
  outline: 'none',
}

const statusBadge = (status: string) => {
  if (status === 'Bezahlt') return {
    backgroundColor: 'rgba(201,169,110,0.15)',
    color: '#c9a96e',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '500',
    fontFamily: '"DM Sans", system-ui, sans-serif',
  }
  if (status === 'Versendet') return {
    backgroundColor: 'rgba(201,169,110,0.08)',
    color: '#8a8580',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '500',
    fontFamily: '"DM Sans", system-ui, sans-serif',
  }
  return {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#8a8580',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '500',
    fontFamily: '"DM Sans", system-ui, sans-serif',
  }
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

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#8a8580', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
        Lade Daten...
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '26px',
        fontWeight: '700',
        color: '#c9a96e',
        marginBottom: '28px',
      }}>Übersicht</h1>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: '4px', padding: '20px' }}>
          <p style={{ fontSize: '12px', color: '#8a8580', marginBottom: '6px', fontFamily: '"DM Sans", system-ui, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Einnahmen {GERMAN_MONTHS[currentMonth - 1]}
          </p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#f5f2ee', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {formatGermanCurrency(currentMonthStats?.income || 0)}
          </p>
          <p style={{ fontSize: '11px', color: '#8a8580', marginTop: '4px', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {currentMonthStats?.invoice_count || 0} Rechnungen
          </p>
        </div>
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: '4px', padding: '20px' }}>
          <p style={{ fontSize: '12px', color: '#8a8580', marginBottom: '6px', fontFamily: '"DM Sans", system-ui, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Jahreseinnahmen {currentYear}
          </p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#f5f2ee', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {formatGermanCurrency(yearIncome)}
          </p>
          <p style={{ fontSize: '11px', color: '#8a8580', marginTop: '4px', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {monthlyStats.reduce((s, m) => s + m.invoice_count, 0)} Rechnungen gesamt
          </p>
        </div>
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: '4px', padding: '20px' }}>
          <p style={{ fontSize: '12px', color: '#8a8580', marginBottom: '10px', fontFamily: '"DM Sans", system-ui, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Schnellaktionen
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              href="/invoices/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                backgroundColor: '#c9a96e',
                color: '#111111',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '3px',
                textDecoration: 'none',
                fontFamily: '"DM Sans", system-ui, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              + Neue Rechnung
            </Link>
            <Link
              href="/customers/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#c9a96e',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '3px',
                textDecoration: 'none',
                border: '1px solid #c9a96e',
                fontFamily: '"DM Sans", system-ui, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              + Neuer Kunde
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: '4px', marginBottom: '24px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '16px', fontWeight: '600', color: '#f5f2ee', margin: 0 }}>
            Letzte Rechnungen
          </h2>
          <Link href="/invoices" style={{ fontSize: '12px', color: '#c9a96e', textDecoration: 'none', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            Alle anzeigen →
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a8580', fontSize: '13px', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            Noch keine Rechnungen vorhanden.{' '}
            <Link href="/invoices/new" style={{ color: '#c9a96e', textDecoration: 'none' }}>
              Erste Rechnung erstellen
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#141414' }}>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '10px', color: '#8a8580', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Sans", system-ui, sans-serif' }}>Rechnungsnr.</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '10px', color: '#8a8580', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Sans", system-ui, sans-serif' }}>Kunde</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '10px', color: '#8a8580', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Sans", system-ui, sans-serif' }}>Datum</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '10px', color: '#8a8580', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Sans", system-ui, sans-serif' }}>Betrag</th>
                  <th style={{ padding: '10px 20px', textAlign: 'center', fontSize: '10px', color: '#8a8580', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Sans", system-ui, sans-serif' }}>Status</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '10px', color: '#8a8580', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"DM Sans", system-ui, sans-serif' }}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{ borderBottom: '1px solid rgba(201,169,110,0.08)' }}
                  >
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#8a8580', fontSize: '11px' }}>{inv.invoice_number}</td>
                    <td style={{ padding: '12px 20px', color: '#f5f2ee', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                      {inv.customer_name || inv.customer_snapshot?.name || '—'}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#8a8580', fontFamily: '"DM Sans", system-ui, sans-serif' }}>{formatGermanDate(inv.date)}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '500', color: '#f5f2ee', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                      {formatGermanCurrency(inv.total)}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <span style={statusBadge(inv.status)}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <Link
                        href={`/invoices/${inv.id}`}
                        style={{ color: '#c9a96e', textDecoration: 'none', fontSize: '12px', fontFamily: '"DM Sans", system-ui, sans-serif' }}
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
      <div style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: '4px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
          <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '16px', fontWeight: '600', color: '#f5f2ee', margin: 0 }}>
            Monatseinnahmen {currentYear}
          </h2>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px' }}>
            {monthlyStats.map((m) => {
              const heightPct = maxIncome > 0 ? (m.income / maxIncome) * 100 : 0
              const isCurrentMonth = m.month === currentMonth
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '2px 2px 0 0',
                      transition: 'all 0.3s ease',
                      height: `${Math.max(heightPct, m.income > 0 ? 4 : 0)}%`,
                      backgroundColor: isCurrentMonth ? '#c9a96e' : 'rgba(201,169,110,0.3)',
                    }}
                    title={`${getMonthName(m.month)}: ${formatGermanCurrency(m.income)}`}
                  />
                  <span style={{ fontSize: '10px', color: '#8a8580', fontFamily: '"DM Sans", system-ui, sans-serif' }}>{getMonthName(m.month).slice(0, 3)}</span>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '11px', color: '#8a8580', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#c9a96e', display: 'inline-block' }} /> Aktueller Monat
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(201,169,110,0.3)', display: 'inline-block' }} /> Andere Monate
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
