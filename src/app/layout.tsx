'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Übersicht', icon: '🏠' },
  { href: '/invoices', label: 'Rechnungen', icon: '📄' },
  { href: '/customers', label: 'Kunden', icon: '👥' },
  { href: '/stats', label: 'Statistik & EÜR', icon: '📊' },
  { href: '/settings', label: 'Einstellungen', icon: '⚙️' },
]

function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 min-h-screen bg-blue-700 text-white flex flex-col no-print">
      <div className="px-6 py-5 border-b border-blue-600">
        <h1 className="text-lg font-bold leading-tight">Rechnungstool</h1>
        <p className="text-blue-200 text-xs mt-0.5">Social Media Agentur</p>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-blue-800 text-white'
                : 'text-blue-100 hover:bg-blue-600 hover:text-white'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-blue-600">
        <p className="text-blue-300 text-xs">Version 1.0</p>
      </div>
    </aside>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <title>Rechnungstool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-gray-50">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
