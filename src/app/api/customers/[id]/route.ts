import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb()
    const { id } = await params
    const db = getDb()
    const result = await db.execute({
      sql: 'SELECT * FROM customers WHERE id = ?',
      args: [id],
    })
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
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
    await initDb()
    const { id } = await params
    const db = getDb()
    const body = await request.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Kundenname ist erforderlich' }, { status: 400 })
    }

    await db.execute({
      sql: `UPDATE customers SET
              name = ?, contact_name = ?, address = ?, postal_code = ?,
              city = ?, country = ?, email = ?, tax_id = ?,
              default_service = ?, default_amount = ?
            WHERE id = ?`,
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
        id,
      ],
    })

    const result = await db.execute({
      sql: 'SELECT * FROM customers WHERE id = ?',
      args: [id],
    })
    return NextResponse.json(result.rows[0])
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
    await initDb()
    const { id } = await params
    const db = getDb()
    await db.execute({ sql: 'DELETE FROM customers WHERE id = ?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Kunden' }, { status: 500 })
  }
}
