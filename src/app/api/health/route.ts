import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    return NextResponse.json({ ok: false, error: 'TURSO_DATABASE_URL fehlt' }, { status: 500 })
  }

  try {
    await initDb()
    const db = getDb()
    const result = await db.execute('SELECT 1 as test')
    return NextResponse.json({
      ok: true,
      url_prefix: url.substring(0, 30) + '...',
      token_set: !!token,
      db_response: result.rows[0],
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      url_prefix: url.substring(0, 30) + '...',
      token_set: !!token,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
