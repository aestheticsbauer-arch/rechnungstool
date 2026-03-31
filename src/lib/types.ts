export interface Setting {
  key: string
  value: string
}

export interface Settings {
  company_name: string
  company_address: string
  company_postal_code: string
  company_city: string
  company_country: string
  company_email: string
  company_phone: string
  company_iban: string
  company_bic: string
  company_bank: string
  tax_number: string
  tax_id: string
  is_kleinunternehmer: string
  payment_terms_days: string
  invoice_prefix: string
}

export interface Customer {
  id: number
  name: string
  contact_name: string
  address: string
  postal_code: string
  city: string
  country: string
  email: string
  tax_id: string
  default_service: string
  default_amount: number
  created_at: string
}

export interface InvoiceItem {
  description: string
  amount: number
}

export interface CustomerSnapshot {
  name: string
  contact_name: string
  address: string
  postal_code: string
  city: string
  country: string
  email: string
  tax_id: string
}

export interface Invoice {
  id: number
  invoice_number: string
  customer_id: number
  customer_snapshot: CustomerSnapshot
  date: string
  service_period: string
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: 'Entwurf' | 'Versendet' | 'Bezahlt'
  notes: string
  created_at: string
  customer_name?: string
}

export interface InvoiceRow {
  id: number
  invoice_number: string
  customer_id: number
  customer_snapshot: string
  date: string
  service_period: string
  items: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: string
  notes: string
  created_at: string
  customer_name?: string
}

export interface Expense {
  id: number
  date: string
  description: string
  amount: number
  category: string
  created_at: string
}

export interface MonthlyStats {
  month: number
  income: number
  invoice_count: number
}

export interface StatsResponse {
  year: number
  monthly: MonthlyStats[]
  total_income: number
  total_expenses: number
  net: number
}
