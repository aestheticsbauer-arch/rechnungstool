'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatGermanCurrency } from '@/lib/utils'
import type { Customer } from '@/lib/types'

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
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 28, fontWeight: 700, color: '#c9a96e', margin: 0 }}>
          Kunden
        </h1>
        <Link
          href="/customers/new"
          style={{ padding: '8px 18px', background: '#c9a96e', color: '#111111', fontSize: 13, fontWeight: 600, borderRadius: 3, textDecoration: 'none', letterSpacing: '0.02em' }}
        >
          + Neuer Kunde
        </Link>
      </div>

      {/* Search */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, padding: '16px 20px', marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Kunden suchen (Name, Ort, E-Mail)..."
          style={inputStyle}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a8580', fontSize: 13 }}>Lade Kunden...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8a8580', fontSize: 13 }}>
            {search ? 'Keine Kunden gefunden.' : (
              <>
                Noch keine Kunden vorhanden.{' '}
                <Link href="/customers/new" style={{ color: '#c9a96e', textDecoration: 'none' }}>
                  Ersten Kunden anlegen
                </Link>
              </>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(201,169,110,0.05)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kontakt</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ort</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>E-Mail</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Standard-Leistung</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Std.-Betrag</th>
                  <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 600, fontSize: 11, color: '#8a8580', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} style={{ borderTop: '1px solid rgba(201,169,110,0.08)' }}>
                    <td style={{ padding: '12px 20px', color: '#f5f2ee', fontWeight: 600 }}>{customer.name}</td>
                    <td style={{ padding: '12px 20px', color: '#8a8580' }}>{customer.contact_name || '—'}</td>
                    <td style={{ padding: '12px 20px', color: '#8a8580' }}>
                      {[customer.postal_code, customer.city].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {customer.email ? (
                        <a href={`mailto:${customer.email}`} style={{ color: '#c9a96e', textDecoration: 'none' }}>
                          {customer.email}
                        </a>
                      ) : <span style={{ color: '#8a8580' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#8a8580', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customer.default_service || '—'}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', color: '#f5f2ee', fontFamily: 'monospace', fontSize: 12 }}>
                      {customer.default_amount > 0 ? formatGermanCurrency(customer.default_amount) : <span style={{ color: '#8a8580' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => router.push(`/invoices/new?customer_id=${customer.id}`)}
                          style={{ fontSize: 12, color: '#4ade80', background: 'transparent', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Neue Rechnung
                        </button>
                        <button
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          style={{ fontSize: 12, color: '#c9a96e', background: 'transparent', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer' }}
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          disabled={deleting === customer.id}
                          style={{ fontSize: 12, color: '#c0392b', background: 'transparent', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', opacity: deleting === customer.id ? 0.5 : 1 }}
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
