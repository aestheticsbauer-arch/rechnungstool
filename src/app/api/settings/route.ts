import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb()
    const body = await request.json()
    const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    const updateMany = db.transaction((data: Record<string, string>) => {
      for (const [key, value] of Object.entries(data)) {
        update.run(key, String(value))
      }
    })
    updateMany(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen' }, { status: 500 })
  }
}
