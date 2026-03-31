import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()

    // Get current settings
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }

    const prefix = settings.invoice_prefix || 'RE'
    const year = new Date().getFullYear()

    // Find highest invoice number with this prefix and year
    const pattern = `${prefix}-${year}-%`
    const lastInvoice = db.prepare(
      'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1'
    ).get(pattern) as { invoice_number: string } | undefined

    let nextNum = 1
    if (lastInvoice) {
      const parts = lastInvoice.invoice_number.split('-')
      const lastNum = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1
      }
    }

    const nextNumber = `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
    return NextResponse.json({ next_number: nextNumber })
  } catch (error) {
    console.error('GET /api/invoices/next-number error:', error)
    return NextResponse.json({ error: 'Fehler beim Generieren der Rechnungsnummer' }, { status: 500 })
  }
}
