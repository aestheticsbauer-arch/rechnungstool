import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key] = row.value

    const prefix = settings.invoice_prefix || 'RE'
    const suffix = settings.invoice_suffix || ''
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    // Base number for this year-month, e.g. "RE-2026-03-Bauer"
    const base = suffix
      ? `${prefix}-${year}-${month}-${suffix}`
      : `${prefix}-${year}-${month}`

    // Check if that exact number already exists, if so append -2, -3, …
    const exact = db.prepare(
      'SELECT invoice_number FROM invoices WHERE invoice_number = ?'
    ).get(base) as { invoice_number: string } | undefined

    if (!exact) {
      return NextResponse.json({ next_number: base })
    }

    // Find the highest existing numbered variant for this base
    const pattern = `${base}-%`
    const variants = db.prepare(
      'SELECT invoice_number FROM invoices WHERE invoice_number = ? OR invoice_number LIKE ? ORDER BY invoice_number'
    ).all(base, pattern) as { invoice_number: string }[]

    let max = 1
    for (const v of variants) {
      if (v.invoice_number === base) continue
      const tail = v.invoice_number.slice(base.length + 1) // after "base-"
      const n = parseInt(tail, 10)
      if (!isNaN(n) && n > max) max = n
    }

    return NextResponse.json({ next_number: `${base}-${max + 1}` })
  } catch (error) {
    console.error('GET /api/invoices/next-number error:', error)
    return NextResponse.json({ error: 'Fehler beim Generieren der Rechnungsnummer' }, { status: 500 })
  }
}
