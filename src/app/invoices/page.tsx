'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatGermanCurrency, formatGermanDate } from '@/lib/utils'
import type { Invoice } from '@/lib/types'

const STATUS_OPTIONS = ['', 'Entwurf', 'Versendet', 'Bezahlt']

const statusStyle = (status: string): React.CSSProperties => {
  if (status === 'Bezahlt') return { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
  if (status === 'Versendet') return { background: 'rgba(201,169,110,0.15)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
  return { background: 'rgba(138,133,128,0.15)', color: '#8a8580', border: '1px solid rgba(138,133,128,0.3)', borderRadius: 3, padding: '2px 8px', fontSize: 11, fontWeight: 600, display: 'inline-block' }
}

const inputStyle: React.CSSProperties = {
  background: '#1e1e1e',
  border: '1px solid rgba(201,169,110,0.3)',
  color: '#f5f2ee',
  borderRadius: 3,
  padding: '6px 12px',
  fontSize: 13,
  outline: 'none',
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
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 28, fontWeight: 700, color: '#c9a96e', margin: 0 }}>
          Rechnungen
        </h1>
        <Link
          href="/invoices/new"
          style={{ padding: '8px 18px', background: '#c9a96e', color: '#111111', fontSize: 13, fontWeight: 600, borderRadius: 3, textDecoration: 'none', letterSpacing: '0.02em' }}
        >
          + Neue Rechnung
        </Link>
      </div>

      {/* Filters */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, padding: '16px 20px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#8a8580', fontWeight: 500 }}>Jahr:</label>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="">Alle Jahre</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#8a8580', fontWeight: 500 }}>Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={inputStyle}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s || 'Alle Status'}</option>
            ))}
          </select>
        </div>
        {invoices.length > 0 && (
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#8a8580' }}>
            {invoices.length} Rechnung(en) · Gesamt: <strong style={{ color: '#c9a96e' }}>{formatGermanCurrency(totalAmount)}</strong>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a8580', fontSize: 13 }}>Lade Rechnungen...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a8580', fontSize: 13 }}>
            Keine Rechnungen gefunden.{' '}
            <Link href="/invoices/new" style={{ color: '#c9a96e', textDecoration: 'none' }}>
              Neue Rechnung erstellen
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(201,169,110,0.05)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rechnungsnr.</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kunde</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Datum</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Leistungszeitraum</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Betrag</th>
                  <th style={{ padding: '10px 20px', textAlign: 'center', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#8a8580', fontSize: 12 }}>{inv.invoice_number}</td>
                    <td style={{ padding: '12px 20px', color: '#f5f2ee', fontWeight: 500 }}>
                      {inv.customer_name || inv.customer_snapshot?.name || '—'}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#8a8580' }}>{formatGermanDate(inv.date)}</td>
                    <td style={{ padding: '12px 20px', color: '#8a8580' }}>{inv.service_period || '—'}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600, color: '#f5f2ee', fontFamily: 'monospace' }}>
                      {formatGermanCurrency(inv.total)}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <span style={statusStyle(inv.status)}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => window.open(`/invoices/${inv.id}/print`, '_blank')}
                          style={{ fontSize: 12, color: '#8a8580', background: 'transparent', border: '1px solid rgba(138,133,128,0.3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer' }}
                          title="PDF anzeigen"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          style={{ fontSize: 12, color: '#c9a96e', background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer' }}
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id, inv.invoice_number)}
                          disabled={deleting === inv.id}
                          style={{ fontSize: 12, color: '#c0392b', background: 'transparent', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', opacity: deleting === inv.id ? 0.5 : 1 }}
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
