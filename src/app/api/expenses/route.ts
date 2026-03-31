import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { Expense } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    let query = 'SELECT * FROM expenses'
    const queryParams: string[] = []

    if (year) {
      query += ` WHERE strftime('%Y', date) = ?`
      queryParams.push(year)
    }

    query += ' ORDER BY date DESC, created_at DESC'

    const expenses = db.prepare(query).all(...queryParams) as Expense[]
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Ausgaben' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb()
    const body = await request.json()

    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Beschreibung ist erforderlich' }, { status: 400 })
    }
    if (!body.date) {
      return NextResponse.json({ error: 'Datum ist erforderlich' }, { status: 400 })
    }
    if (!body.amount || isNaN(Number(body.amount))) {
      return NextResponse.json({ error: 'Betrag ist erforderlich' }, { status: 400 })
    }

    const result = db.prepare(`
      INSERT INTO expenses (date, description, amount, category)
      VALUES (?, ?, ?, ?)
    `).run(
      body.date,
      body.description.trim(),
      Number(body.amount),
      body.category?.trim() || 'Sonstiges'
    )

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid) as Expense
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Ausgabe' }, { status: 500 })
  }
}
