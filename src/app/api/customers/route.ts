import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Customer } from '@/lib/types'

export async function GET() {
  try {
    const db = getDb()
    const customers = db.prepare(
      'SELECT * FROM customers ORDER BY name ASC'
    ).all() as Customer[]
    return NextResponse.json(customers)
  } catch (error) {
    console.error('GET /api/customers error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Kunden' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb()
    const body = await request.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Kundenname ist erforderlich' }, { status: 400 })
    }

    const stmt = db.prepare(`
      INSERT INTO customers (name, contact_name, address, postal_code, city, country, email, tax_id, default_service, default_amount)
      VALUES (@name, @contact_name, @address, @postal_code, @city, @country, @email, @tax_id, @default_service, @default_amount)
    `)

    const result = stmt.run({
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

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid) as Customer
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Kunden' }, { status: 500 })
  }
}
