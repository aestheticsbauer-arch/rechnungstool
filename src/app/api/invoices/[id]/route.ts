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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb()
    const { id } = await params
    const db = getDb()
    const result = await db.execute({
      sql: `SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ?`,
      args: [id],
    })
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(parseInvoiceRow(result.rows[0]))
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnung' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb()
    const { id } = await params
    const db = getDb()
    const body = await request.json()

    if (!body.invoice_number?.trim()) {
      return NextResponse.json({ error: 'Rechnungsnummer ist erforderlich' }, { status: 400 })
    }

    const items = Array.isArray(body.items) ? body.items : []
    const subtotal = items.reduce((sum: number, item: { amount: number }) => sum + (Number(item.amount) || 0), 0)
    const taxRate = Number(body.tax_rate) || 0
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    await db.execute({
      sql: `UPDATE invoices SET
              invoice_number = ?, customer_id = ?, customer_snapshot = ?, date = ?,
              service_period = ?, items = ?, subtotal = ?, tax_rate = ?,
              tax_amount = ?, total = ?, status = ?, notes = ?
            WHERE id = ?`,
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
        id,
      ],
    })

    const result = await db.execute({
      sql: `SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ?`,
      args: [id],
    })
    return NextResponse.json(parseInvoiceRow(result.rows[0]))
  } catch (error) {
    console.error('PUT /api/invoices/[id] error:', error)
    const msg = error instanceof Error && error.message.includes('UNIQUE')
      ? 'Rechnungsnummer bereits vorhanden'
      : 'Fehler beim Aktualisieren der Rechnung'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb()
    const { id } = await params
    const db = getDb()
    await db.execute({ sql: 'DELETE FROM invoices WHERE id = ?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Rechnung' }, { status: 500 })
  }
}
