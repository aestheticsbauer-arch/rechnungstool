import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import type { Invoice } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInvoiceRow(row: any): Invoice {
  return {
    ...row,
    id: Number(row.id),
    customer_id: row.customer_id ? Number(row.customer_id) : null,
    subtotal: Number(row.subtotal),
    tax_rate: Number(row.tax_rate),
    tax_amount: Number(row.tax_amount),
    total: Number(row.total),
    customer_snapshot: typeof row.customer_snapshot === 'string'
      ? JSON.parse(row.customer_snapshot)
      : (row.customer_snapshot || {}),
    items: typeof row.items === 'string'
      ? JSON.parse(row.items)
      : (row.items || []),
    status: row.status as Invoice['status'],
  }
}

export async function GET(request: Request) {
  try {
    await initDb()
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')

    let sql = `
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `
    const args: (string | number)[] = []

    if (year) { sql += ` AND strftime('%Y', i.date) = ?`; args.push(year) }
    if (status) { sql += ` AND i.status = ?`; args.push(status) }
    if (customerId) { sql += ` AND i.customer_id = ?`; args.push(customerId) }

    sql += ' ORDER BY i.date DESC, i.created_at DESC'

    const result = await db.execute({ sql, args })
    return NextResponse.json(result.rows.map(parseInvoiceRow))
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnungen' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDb()
    const db = getDb()
    const body = await request.json()

    if (!body.invoice_number?.trim()) {
      return NextResponse.json({ error: 'Rechnungsnummer ist erforderlich' }, { status: 400 })
    }
    if (!body.date) {
      return NextResponse.json({ error: 'Datum ist erforderlich' }, { status: 400 })
    }

    const items = Array.isArray(body.items) ? body.items : []
    const subtotal = items.reduce((sum: number, item: { amount: number }) => sum + (Number(item.amount) || 0), 0)
    const taxRate = Number(body.tax_rate) || 0
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    const result = await db.execute({
      sql: `INSERT INTO invoices (invoice_number, customer_id, customer_snapshot, date, service_period, items, subtotal, tax_rate, tax_amount, total, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        body.invoice_number.trim(),
        body.customer_id || null,
        JSON.stringify(body.customer_snapshot || {}),
        body.date,
        body.service_period?.trim() || '',
        JSON.stringify(items),
        subtotal,
        taxRate,
        taxAmount,
        total,
        body.status || 'Entwurf',
        body.notes?.trim() || '',
      ],
    })

    const row = await db.execute({
      sql: `SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ?`,
      args: [result.lastInsertRowid],
    })
    return NextResponse.json(parseInvoiceRow(row.rows[0]), { status: 201 })
  } catch (error) {
    console.error('POST /api/invoices error:', error)
    const msg = error instanceof Error && error.message.includes('UNIQUE')
      ? 'Rechnungsnummer bereits vorhanden'
      : 'Fehler beim Erstellen der Rechnung'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
