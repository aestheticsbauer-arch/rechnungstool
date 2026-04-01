'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Übersicht', icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { href: '/invoices', label: 'Rechnungen', icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
  )},
  { href: '/customers', label: 'Kunden', icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { href: '/stats', label: 'Statistik & EÜR', icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
  { href: '/settings', label: 'Einstellungen', icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
]

function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="no-print" style={{
      width: '220px',
      minHeight: '100vh',
      backgroundColor: '#0d0d0d',
      borderRight: '1px solid rgba(201,169,110,0.12)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo area */}
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
        <h1 style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '20px',
          fontWeight: '700',
          color: '#f5f2ee',
          letterSpacing: '0.02em',
          margin: 0,
          lineHeight: 1.2,
        }}>LUMI</h1>
        <p style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '10px',
          color: '#c9a96e',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin: '4px 0 0',
        }}>Rechnungstool</p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 24px',
                fontSize: '13px',
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontWeight: active ? '500' : '400',
                color: active ? '#c9a96e' : '#8a8580',
                textDecoration: 'none',
                borderLeft: active ? '2px solid #c9a96e' : '2px solid transparent',
                backgroundColor: active ? 'rgba(201,169,110,0.06)' : 'transparent',
                transition: 'all 0.15s ease',
                letterSpacing: '0.01em',
              }}
            >
              <span style={{ color: active ? '#c9a96e' : '#8a8580', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(201,169,110,0.12)' }}>
        <p style={{ fontSize: '10px', color: 'rgba(138,133,128,0.5)', fontFamily: '"DM Sans", sans-serif' }}>v1.0</p>
      </div>
    </aside>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <title>LUMI Rechnungstool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ backgroundColor: '#111111', margin: 0, padding: 0 }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#111111' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
