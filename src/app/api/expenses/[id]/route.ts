import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Expense } from '@/lib/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as Expense | undefined
    if (!expense) {
      return NextResponse.json({ error: 'Ausgabe nicht gefunden' }, { status: 404 })
    }
    return NextResponse.json(expense)
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
    const { id } = await params
    const db = getDb()
    const body = await request.json()

    db.prepare(`
      UPDATE expenses SET
        date = ?,
        description = ?,
        amount = ?,
        category = ?
      WHERE id = ?
    `).run(
      body.date,
      body.description?.trim() || '',
      Number(body.amount) || 0,
      body.category?.trim() || 'Sonstiges',
      id
    )

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as Expense
    return NextResponse.json(expense)
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
    const { id } = await params
    const db = getDb()
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Ausgabe' }, { status: 500 })
  }
}
