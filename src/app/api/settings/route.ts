import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET() {
  try {
    await initDb()
    const db = getDb()
    const result = await db.execute('SELECT key, value FROM settings')
    const settings: Record<string, string> = {}
    for (const row of result.rows) {
      settings[String(row.key)] = String(row.value)
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    await initDb()
    const db = getDb()
    const body = await request.json()

    for (const [key, value] of Object.entries(body)) {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        args: [key, String(value)],
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen' }, { status: 500 })
  }
}
