import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'rechnungen.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initSchema(db)

  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS customers (
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
    );

    CREATE TABLE IF NOT EXISTS invoices (
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'Sonstiges',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Insert default settings if not exist
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
  }

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  )

  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value)
  }
}
