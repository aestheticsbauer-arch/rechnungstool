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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const row = db.prepare(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(id) as InvoiceRow | undefined

    if (!row) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(parseInvoiceRow(row))
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

    const stmt = db.prepare(`
      UPDATE invoices SET
        invoice_number = @invoice_number,
        customer_id = @customer_id,
        customer_snapshot = @customer_snapshot,
        date = @date,
        service_period = @service_period,
        items = @items,
        subtotal = @subtotal,
        tax_rate = @tax_rate,
        tax_amount = @tax_amount,
        total = @total,
        status = @status,
        notes = @notes
      WHERE id = @id
    `)

    stmt.run({
      id,
      invoice_number: body.invoice_number.trim(),
      customer_id: body.customer_id || null,
      customer_snapshot: JSON.stringify(body.customer_snapshot || {}),
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
    `).get(id) as InvoiceRow

    return NextResponse.json(parseInvoiceRow(row))
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
    const { id } = await params
    const db = getDb()
    db.prepare('DELETE FROM invoices WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Rechnung' }, { status: 500 })
  }
}
