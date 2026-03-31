import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Customer } from '@/lib/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | undefined
    if (!customer) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(customer)
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Kunden' }, { status: 500 })
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Kundenname ist erforderlich' }, { status: 400 })
    }

    const stmt = db.prepare(`
      UPDATE customers SET
        name = @name,
        contact_name = @contact_name,
        address = @address,
        postal_code = @postal_code,
        city = @city,
        country = @country,
        email = @email,
        tax_id = @tax_id,
        default_service = @default_service,
        default_amount = @default_amount
      WHERE id = @id
    `)

    stmt.run({
      id,
      name: body.name?.trim() || '',
      contact_name: body.contact_name?.trim() || '',
      address: body.address?.trim() || '',
      postal_code: body.postal_code?.trim() || '',
      city: body.city?.trim() || '',
      country: body.country?.trim() || 'Deutschland',
      email: body.email?.trim() || '',
      tax_id: body.tax_id?.trim() || '',
      default_service: body.default_service?.trim() || '',
      default_amount: Number(body.default_amount) || 0,
    })

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer
    return NextResponse.json(customer)
  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Kunden' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    db.prepare('DELETE FROM customers WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Kunden' }, { status: 500 })
  }
}
