import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Invoice, InvoiceRow } from '@/lib/types'

function parseInvoiceRow(row: InvoiceRow): Invoice {
  return {
    ...row,
    customer_snapshot: typeof row.customer_snapshot === 'string'
      ? JSON.parse(row.customer_snapshot)
      : row.customer_snapshot,
    items: typeof row.items === 'string'
      ? JSON.parse(row.items)
      : row.items,
    status: row.status as Invoice['status'],
  }
}

export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')

    let query = `
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `
    const queryParams: (string | number)[] = []

    if (year) {
      query += ` AND strftime('%Y', i.date) = ?`
      queryParams.push(year)
    }
    if (status) {
      query += ` AND i.status = ?`
      queryParams.push(status)
    }
    if (customerId) {
      query += ` AND i.customer_id = ?`
      queryParams.push(customerId)
    }

    query += ' ORDER BY i.date DESC, i.created_at DESC'

    const rows = db.prepare(query).all(...queryParams) as InvoiceRow[]
    const invoices = rows.map(parseInvoiceRow)
    return NextResponse.json(invoices)
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnungen' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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

    const customerSnapshot = body.customer_snapshot || {}

    const stmt = db.prepare(`
      INSERT INTO invoices (invoice_number, customer_id, customer_snapshot, date, service_period, items, subtotal, tax_rate, tax_amount, total, status, notes)
      VALUES (@invoice_number, @customer_id, @customer_snapshot, @date, @service_period, @items, @subtotal, @tax_rate, @tax_amount, @total, @status, @notes)
    `)

    const result = stmt.run({
      invoice_number: body.invoice_number.trim(),
      customer_id: body.customer_id || null,
      customer_snapshot: JSON.stringify(customerSnapshot),
      date: body.date,
      service_period: body.service_period?.trim() || '',
      items: JSON.stringify(items),
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      status: body.status || 'Entwurf',
      notes: body.notes?.trim() || '',
    })

    const row = db.prepare(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(result.lastInsertRowid) as InvoiceRow

    return NextResponse.json(parseInvoiceRow(row), { status: 201 })
  } catch (error) {
    console.error('POST /api/invoices error:', error)
    const msg = error instanceof Error && error.message.includes('UNIQUE')
      ? 'Rechnungsnummer bereits vorhanden'
      : 'Fehler beim Erstellen der Rechnung'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
