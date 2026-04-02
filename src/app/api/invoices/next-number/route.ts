import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET() {
  try {
    await initDb()
    const db = getDb()

    const settingsResult = await db.execute('SELECT key, value FROM settings')
    const settings: Record<string, string> = {}
    for (const row of settingsResult.rows) {
      settings[String(row.key)] = String(row.value)
    }

    const prefix = settings.invoice_prefix || 'RE'
    const suffix = settings.invoice_suffix || ''
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    const base = suffix
      ? `${prefix}-${year}-${month}-${suffix}`
      : `${prefix}-${year}-${month}`

    const exact = await db.execute({
      sql: 'SELECT invoice_number FROM invoices WHERE invoice_number = ?',
      args: [base],
    })

    if (exact.rows.length === 0) {
      return NextResponse.json({ next_number: base })
    }

    const pattern = `${base}-%`
    const variants = await db.execute({
      sql: 'SELECT invoice_number FROM invoices WHERE invoice_number = ? OR invoice_number LIKE ? ORDER BY invoice_number',
      args: [base, pattern],
    })

    let max = 1
    for (const v of variants.rows) {
      if (String(v.invoice_number) === base) continue
      const tail = String(v.invoice_number).slice(base.length + 1)
      const n = parseInt(tail, 10)
      if (!isNaN(n) && n > max) max = n
    }

    return NextResponse.json({ next_number: `${base}-${max + 1}` })
  } catch (error) {
    console.error('GET /api/invoices/next-number error:', error)
    return NextResponse.json({ error: 'Fehler beim Generieren der Rechnungsnummer' }, { status: 500 })
  }
}
