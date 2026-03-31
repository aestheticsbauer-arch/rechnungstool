import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Monthly income from invoices (Bezahlt + Versendet)
    const monthlyIncomeRows = db.prepare(`
      SELECT
        CAST(strftime('%m', date) AS INTEGER) as month,
        SUM(total) as income,
        COUNT(*) as invoice_count
      FROM invoices
      WHERE strftime('%Y', date) = ?
        AND status IN ('Bezahlt', 'Versendet')
      GROUP BY month
      ORDER BY month
    `).all(year) as { month: number; income: number; invoice_count: number }[]

    // All 12 months
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyIncomeRows.find(r => r.month === i + 1)
      return {
        month: i + 1,
        income: monthData?.income || 0,
        invoice_count: monthData?.invoice_count || 0,
      }
    })

    const totalIncome = monthly.reduce((sum, m) => sum + m.income, 0)

    // Monthly expenses
    const monthlyExpenseRows = db.prepare(`
      SELECT
        CAST(strftime('%m', date) AS INTEGER) as month,
        SUM(amount) as expenses,
        COUNT(*) as expense_count
      FROM expenses
      WHERE strftime('%Y', date) = ?
      GROUP BY month
      ORDER BY month
    `).all(year) as { month: number; expenses: number; expense_count: number }[]

    const monthlyWithExpenses = monthly.map(m => {
      const expData = monthlyExpenseRows.find(r => r.month === m.month)
      return {
        ...m,
        expenses: expData?.expenses || 0,
        expense_count: expData?.expense_count || 0,
        net: m.income - (expData?.expenses || 0),
      }
    })

    const totalExpenses = monthlyWithExpenses.reduce((sum, m) => sum + m.expenses, 0)

    // All invoices for the year (for EÜR details)
    const invoiceRows = db.prepare(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE strftime('%Y', i.date) = ?
        AND i.status IN ('Bezahlt', 'Versendet')
      ORDER BY i.date ASC
    `).all(year) as Array<{ id: number; invoice_number: string; customer_name: string; date: string; total: number; status: string }>

    // All expenses for the year
    const expenseRows = db.prepare(`
      SELECT * FROM expenses
      WHERE strftime('%Y', date) = ?
      ORDER BY date ASC
    `).all(year) as Array<{ id: number; date: string; description: string; amount: number; category: string }>

    return NextResponse.json({
      year: parseInt(year),
      monthly: monthlyWithExpenses,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      invoices: invoiceRows,
      expenses: expenseRows,
    })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Statistiken' }, { status: 500 })
  }
}
