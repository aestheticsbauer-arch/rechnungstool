import { createClient, type Client } from '@libsql/client'

let client: Client | null = null
let initialized = false

export function getDb(): Client {
  if (client) return client

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error('TURSO_DATABASE_URL ist nicht gesetzt')
  }

  client = createClient({ url, authToken })
  return client
}

export async function initDb(): Promise<void> {
  if (initialized) return
  const db = getDb()

  await db.execute(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    postal_code TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT 'Deutschland',
    email TEXT NOT NULL DEFAULT '',
    tax_id TEXT NOT NULL DEFAULT '',
    default_service TEXT NOT NULL DEFAULT '',
    default_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    customer_snapshot TEXT NOT NULL DEFAULT '{}',
    date TEXT NOT NULL,
    service_period TEXT NOT NULL DEFAULT '',
    items TEXT NOT NULL DEFAULT '[]',
    subtotal REAL NOT NULL DEFAULT 0,
    tax_rate REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Entwurf',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  await db.execute(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'Sonstiges',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const defaultSettings: Record<string, string> = {
    company_name: '',
    company_address: '',
    company_postal_code: '',
    company_city: '',
    company_country: 'Deutschland',
    company_email: '',
    company_phone: '',
    company_iban: '',
    company_bic: '',
    company_bank: '',
    tax_number: '',
    tax_id: '',
    is_kleinunternehmer: 'true',
    payment_terms_days: '14',
    invoice_prefix: 'RE',
    invoice_suffix: 'Bauer',
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      args: [key, value],
    })
  }

  initialized = true
}
