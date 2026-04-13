import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET() {
  try {
    await initDb()
    const db = getDb()
    const result = await db.execute('SELECT * FROM customers ORDER BY name ASC')
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/customers error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Kunden' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDb()
    const db = getDb()
    const body = await request.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Kundenname ist erforderlich' }, { status: 400 })
    }

    const result = await db.execute({
      sql: `INSERT INTO customers (name, contact_name, address, postal_code, city, country, email, tax_id, default_service, default_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        body.name?.trim() || '',
        body.contact_name?.trim() || '',
        body.address?.trim() || '',
        body.postal_code?.trim() || '',
        body.city?.trim() || '',
        body.country?.trim() || 'Deutschland',
        body.email?.trim() || '',
        body.tax_id?.trim() || '',
        body.default_service?.trim() || '',
        Number(body.default_amount) || 0,
      ],
    })

    const row = await db.execute({
      sql: 'SELECT * FROM customers WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    })
    return NextResponse.json(row.rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Kunden' }, { status: 500 })
  }
}
