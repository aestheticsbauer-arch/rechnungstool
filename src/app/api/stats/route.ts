import { NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    await initDb()
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    const monthlyIncomeResult = await db.execute({
      sql: `SELECT
              CAST(strftime('%m', date) AS INTEGER) as month,
              SUM(total) as income,
              COUNT(*) as invoice_count
            FROM invoices
            WHERE strftime('%Y', date) = ?
              AND status IN ('Bezahlt', 'Versendet')
            GROUP BY month
            ORDER BY month`,
      args: [year],
    })

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const row = monthlyIncomeResult.rows.find(r => Number(r.month) === i + 1)
      return {
        month: i + 1,
        income: row ? Number(row.income) : 0,
        invoice_count: row ? Number(row.invoice_count) : 0,
      }
    })

    const totalIncome = monthly.reduce((sum, m) => sum + m.income, 0)

    const monthlyExpenseResult = await db.execute({
      sql: `SELECT
              CAST(strftime('%m', date) AS INTEGER) as month,
              SUM(amount) as expenses,
              COUNT(*) as expense_count
            FROM expenses
            WHERE strftime('%Y', date) = ?
            GROUP BY month
            ORDER BY month`,
      args: [year],
    })

    const monthlyWithExpenses = monthly.map(m => {
      const row = monthlyExpenseResult.rows.find(r => Number(r.month) === m.month)
      const expenses = row ? Number(row.expenses) : 0
      const expense_count = row ? Number(row.expense_count) : 0
      return { ...m, expenses, expense_count, net: m.income - expenses }
    })

    const totalExpenses = monthlyWithExpenses.reduce((sum, m) => sum + m.expenses, 0)

    const invoiceResult = await db.execute({
      sql: `SELECT i.*, c.name as customer_name
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            WHERE strftime('%Y', i.date) = ?
              AND i.status IN ('Bezahlt', 'Versendet')
            ORDER BY i.date ASC`,
      args: [year],
    })

    const expenseResult = await db.execute({
      sql: `SELECT * FROM expenses WHERE strftime('%Y', date) = ? ORDER BY date ASC`,
      args: [year],
    })

    return NextResponse.json({
      year: parseInt(year),
      monthly: monthlyWithExpenses,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      invoices: invoiceResult.rows.map(r => ({
        id: Number(r.id),
        invoice_number: String(r.invoice_number),
        customer_name: r.customer_name ? String(r.customer_name) : '',
        date: String(r.date),
        total: Number(r.total),
        status: String(r.status),
      })),
      expenses: expenseResult.rows.map(r => ({
        id: Number(r.id),
        date: String(r.date),
        description: String(r.description),
        amount: Number(r.amount),
        category: String(r.category),
      })),
    })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Statistiken' }, { status: 500 })
  }
}
