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
      sql: 'SELECT * FROM expenses WHERE id = ?',
      args: [id],
    })
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ausgabe nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('GET /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Ausgabe' }, { status: 500 })
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

    await db.execute({
      sql: 'UPDATE expenses SET date = ?, description = ?, amount = ?, category = ? WHERE id = ?',
      args: [
        body.date,
        body.description?.trim() || '',
        Number(body.amount) || 0,
        body.category?.trim() || 'Sonstiges',
        id,
      ],
    })

    const result = await db.execute({
      sql: 'SELECT * FROM expenses WHERE id = ?',
      args: [id],
    })
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('PUT /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Ausgabe' }, { status: 500 })
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
    await db.execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [id] })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Ausgabe' }, { status: 500 })
  }
}
