'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatGermanDate, addDays } from '@/lib/utils'
import type { Invoice, Settings } from '@/lib/types'

export default function InvoicePrintPage() {
  const params = useParams()
  const id = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [invRes, settingsRes] = await Promise.all([
          fetch(`/api/invoices/${id}`),
          fetch('/api/settings'),
        ])
        const invData = await invRes.json()
        const settingsData = await settingsRes.json()

        if (!invRes.ok) {
          setError(invData.error || 'Rechnung nicht gefunden')
          return
        }

        setInvoice(invData)
        setSettings(settingsData)
      } catch (e) {
        setError('Fehler beim Laden der Rechnung')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Auto-print after short delay
  useEffect(() => {
    if (!loading && invoice && settings) {
      const timer = setTimeout(() => {
        window.print()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [loading, invoice, settings])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
        Lade Rechnung...
      </div>
    )
  }

  if (error || !invoice || !settings) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#cc0000' }}>
        {error || 'Fehler beim Laden'}
      </div>
    )
  }

  const isKleinunternehmer = settings.is_kleinunternehmer === 'true'
  const paymentDays = parseInt(settings.payment_terms_days) || 14
  const dueDate = addDays(invoice.date, paymentDays)
  const snap = invoice.customer_snapshot

  const senderLine = [
    settings.company_name,
    settings.company_address,
    `${settings.company_postal_code} ${settings.company_city}`.trim(),
  ].filter(Boolean).join(' · ')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', Arial, Helvetica, sans-serif;
          font-size: 10pt;
          color: #1a1a1a;
          background: #f0f0f0;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          background: white;
          padding: 20mm 20mm 25mm 25mm;
          position: relative;
          box-shadow: 0 2px 20px rgba(0,0,0,0.15);
        }

        .print-btn {
          position: fixed;
          top: 15px;
          right: 15px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 2px 8px rgba(37,99,235,0.4);
          z-index: 100;
        }
        .print-btn:hover { background: #1d4ed8; }

        .sender-small {
          font-size: 7pt;
          color: #555;
          border-bottom: 1px solid #555;
          padding-bottom: 1.5mm;
          margin-bottom: 2mm;
          letter-spacing: 0.01em;
        }

        .recipient-block {
          height: 45mm;
          margin-bottom: 8mm;
        }

        .recipient-name {
          font-size: 10.5pt;
          font-weight: 600;
          margin-bottom: 1mm;
        }

        .recipient-address {
          font-size: 10pt;
          line-height: 1.6;
        }

        .header-right {
          float: right;
          text-align: right;
          margin-top: -5mm;
        }

        .company-name {
          font-size: 14pt;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 1mm;
        }

        .company-details {
          font-size: 8.5pt;
          color: #444;
          line-height: 1.7;
        }

        .clearfix::after { content: ''; display: block; clear: both; }

        .invoice-title {
          font-size: 20pt;
          font-weight: 700;
          color: #1a1a1a;
          margin: 8mm 0 5mm 0;
          clear: both;
        }

        .meta-table {
          width: 100%;
          margin-bottom: 8mm;
          border-collapse: collapse;
        }
        .meta-table td {
          padding: 1.5mm 3mm 1.5mm 0;
          font-size: 9.5pt;
          vertical-align: top;
        }
        .meta-table td:first-child {
          color: #555;
          width: 45mm;
          font-weight: 500;
        }
        .meta-table td:last-child {
          font-weight: 600;
          color: #1a1a1a;
        }

        .salutation {
          font-size: 10pt;
          margin-bottom: 5mm;
          line-height: 1.5;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5mm;
        }
        .items-table thead tr {
          background: #1a1a1a;
          color: white;
        }
        .items-table thead th {
          padding: 2.5mm 3mm;
          text-align: left;
          font-size: 9pt;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .items-table thead th:last-child {
          text-align: right;
        }
        .items-table tbody tr {
          border-bottom: 1px solid #e5e5e5;
        }
        .items-table tbody tr:last-child {
          border-bottom: none;
        }
        .items-table tbody td {
          padding: 3mm 3mm;
          font-size: 10pt;
          vertical-align: top;
        }
        .items-table tbody td:last-child {
          text-align: right;
          font-weight: 500;
          white-space: nowrap;
        }

        .totals-section {
          margin-left: auto;
          width: 80mm;
          margin-bottom: 8mm;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 1.5mm 0;
          font-size: 9.5pt;
          color: #333;
          border-bottom: 1px solid #eee;
        }
        .totals-row:last-child {
          border-bottom: none;
        }
        .totals-row.total {
          font-size: 12pt;
          font-weight: 700;
          color: #1a1a1a;
          border-top: 2px solid #1a1a1a;
          border-bottom: 2px solid #1a1a1a;
          padding: 2mm 0;
          margin-top: 1mm;
        }
        .totals-row span:last-child {
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }
        .totals-row.total span:last-child {
          font-weight: 700;
        }

        .kleinunternehmer-note {
          font-size: 8.5pt;
          color: #555;
          margin-bottom: 6mm;
          padding: 3mm 4mm;
          border-left: 3px solid #999;
          background: #fafafa;
          line-height: 1.5;
        }

        .payment-section {
          margin-bottom: 8mm;
          padding: 4mm 5mm;
          border: 1px solid #ccc;
          border-radius: 1mm;
          background: #fafafa;
        }
        .payment-title {
          font-size: 9.5pt;
          font-weight: 700;
          margin-bottom: 3mm;
          color: #1a1a1a;
        }
        .payment-table {
          width: 100%;
          border-collapse: collapse;
        }
        .payment-table td {
          padding: 1mm 3mm 1mm 0;
          font-size: 9pt;
          vertical-align: top;
        }
        .payment-table td:first-child {
          color: #555;
          width: 20mm;
          font-weight: 500;
        }
        .payment-table td:last-child {
          font-family: 'Courier New', monospace;
          font-weight: 600;
          color: #1a1a1a;
        }

        .notes-section {
          font-size: 9pt;
          color: #444;
          margin-bottom: 6mm;
          line-height: 1.6;
        }

        .footer {
          position: absolute;
          bottom: 10mm;
          left: 25mm;
          right: 20mm;
          border-top: 0.5px solid #ccc;
          padding-top: 2.5mm;
          display: flex;
          justify-content: space-between;
          font-size: 7.5pt;
          color: #777;
          line-height: 1.6;
        }
        .footer-col {
          flex: 1;
        }
        .footer-col:not(:first-child) {
          padding-left: 5mm;
        }

        @media print {
          body { background: white; }
          .page {
            margin: 0;
            box-shadow: none;
            padding: 20mm 20mm 25mm 25mm;
          }
          .print-btn { display: none !important; }
        }
      `}</style>

      <button className="print-btn no-print" onClick={() => window.print()}>
        Drucken / Als PDF speichern
      </button>

      <div className="page">

        {/* Header: Company top-right + Recipient address left */}
        <div className="clearfix">
          {/* Recipient */}
          <div className="recipient-block" style={{ float: 'left', width: '90mm' }}>
            {senderLine && (
              <div className="sender-small">{senderLine}</div>
            )}
            {snap?.name && (
              <>
                <div className="recipient-name">{snap.name}</div>
                <div className="recipient-address">
                  {snap.contact_name && <div>{snap.contact_name}</div>}
                  {snap.address && <div>{snap.address}</div>}
                  {(snap.postal_code || snap.city) && (
                    <div>{[snap.postal_code, snap.city].filter(Boolean).join(' ')}</div>
                  )}
                  {snap.country && snap.country !== 'Deutschland' && <div>{snap.country}</div>}
                </div>
              </>
            )}
          </div>

          {/* Sender / Company info top right */}
          <div className="header-right">
            <div className="company-name">{settings.company_name || 'Ihr Unternehmen'}</div>
            <div className="company-details">
              {settings.company_address && <div>{settings.company_address}</div>}
              {(settings.company_postal_code || settings.company_city) && (
                <div>{[settings.company_postal_code, settings.company_city].filter(Boolean).join(' ')}</div>
              )}
              {settings.company_email && <div>{settings.company_email}</div>}
              {settings.company_phone && <div>{settings.company_phone}</div>}
              {settings.tax_number && <div>StNr: {settings.tax_number}</div>}
              {settings.tax_id && <div>USt-IdNr: {settings.tax_id}</div>}
            </div>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="invoice-title">Rechnung</div>

        {/* Meta Info */}
        <table className="meta-table">
          <tbody>
            <tr>
              <td>Rechnungsnummer</td>
              <td>{invoice.invoice_number}</td>
            </tr>
            <tr>
              <td>Rechnungsdatum</td>
              <td>{formatGermanDate(invoice.date)}</td>
            </tr>
            {invoice.service_period && (
              <tr>
                <td>Leistungszeitraum</td>
                <td>{invoice.service_period}</td>
              </tr>
            )}
            <tr>
              <td>Zahlungsziel</td>
              <td>{formatGermanDate(dueDate)}</td>
            </tr>
          </tbody>
        </table>

        {/* Salutation */}
        <div className="salutation">
          {snap?.contact_name
            ? `Sehr geehrte Damen und Herren,`
            : `Sehr geehrte Damen und Herren,`}
          <br />
          für die erbrachten Leistungen{invoice.service_period ? ` im Zeitraum ${invoice.service_period}` : ''} erlauben wir uns, folgende Rechnung zu stellen:
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '60%' }}>Beschreibung</th>
              <th style={{ textAlign: 'right' }}>Betrag</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals-section">
          <div className="totals-row">
            <span>Nettobetrag</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {isKleinunternehmer ? (
            <div className="totals-row">
              <span>MwSt. (0% gem. § 19 UStG)</span>
              <span>{formatCurrency(0)}</span>
            </div>
          ) : (
            <div className="totals-row">
              <span>MwSt. ({invoice.tax_rate}%)</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>
          )}
          <div className="totals-row total">
            <span>Gesamtbetrag</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {/* Kleinunternehmer Note */}
        {isKleinunternehmer && (
          <div className="kleinunternehmer-note">
            Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer berechnet.
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="notes-section">
            <strong>Hinweis:</strong> {invoice.notes}
          </div>
        )}

        {/* Payment Info */}
        <div className="payment-section">
          <div className="payment-title">
            Bitte überweisen Sie den Betrag bis zum {formatGermanDate(dueDate)} auf folgendes Konto:
          </div>
          <table className="payment-table">
            <tbody>
              {settings.company_iban && (
                <tr>
                  <td>IBAN</td>
                  <td>{settings.company_iban}</td>
                </tr>
              )}
              {settings.company_bic && (
                <tr>
                  <td>BIC</td>
                  <td>{settings.company_bic}</td>
                </tr>
              )}
              {settings.company_bank && (
                <tr>
                  <td>Bank</td>
                  <td>{settings.company_bank}</td>
                </tr>
              )}
              <tr>
                <td>Verwendungszweck</td>
                <td>{invoice.invoice_number}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Closing */}
        <div style={{ fontSize: '10pt', marginBottom: '8mm', lineHeight: '1.5' }}>
          Mit freundlichen Grüßen
          <br /><br />
          {settings.company_name}
        </div>

        {/* Footer */}
        <div className="footer">
          <div className="footer-col">
            <strong>{settings.company_name}</strong>
            {settings.company_address && <div>{settings.company_address}</div>}
            {(settings.company_postal_code || settings.company_city) && (
              <div>{[settings.company_postal_code, settings.company_city].filter(Boolean).join(' ')}</div>
            )}
          </div>
          <div className="footer-col">
            {settings.company_email && <div>{settings.company_email}</div>}
            {settings.company_phone && <div>{settings.company_phone}</div>}
          </div>
          <div className="footer-col">
            {settings.company_iban && <div>IBAN: {settings.company_iban}</div>}
            {settings.company_bic && <div>BIC: {settings.company_bic}</div>}
            {settings.company_bank && <div>{settings.company_bank}</div>}
          </div>
          <div className="footer-col">
            {settings.tax_number && <div>StNr: {settings.tax_number}</div>}
            {settings.tax_id && <div>USt-IdNr: {settings.tax_id}</div>}
          </div>
        </div>

      </div>
    </>
  )
}
