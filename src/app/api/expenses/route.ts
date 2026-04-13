import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    await initDb()
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    let sql = 'SELECT * FROM expenses'
    const args: string[] = []

    if (year) {
      sql += ` WHERE strftime('%Y', date) = ?`
      args.push(year)
    }
    sql += ' ORDER BY date DESC, created_at DESC'

    const result = await db.execute({ sql, args })
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Ausgaben' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await initDb()
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

    const result = await db.execute({
      sql: 'INSERT INTO expenses (date, description, amount, category) VALUES (?, ?, ?, ?)',
      args: [body.date, body.description.trim(), Number(body.amount), body.category?.trim() || 'Sonstiges'],
    })

    const row = await db.execute({
      sql: 'SELECT * FROM expenses WHERE id = ?',
      args: [Number(result.lastInsertRowid)],
    })
    return NextResponse.json(row.rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Ausgabe' }, { status: 500 })
  }
}
