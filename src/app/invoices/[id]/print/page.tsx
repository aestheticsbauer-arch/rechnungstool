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
        if (!invRes.ok) { setError(invData.error || 'Rechnung nicht gefunden'); return }
        setInvoice(invData)
        setSettings(settingsData)
      } catch {
        setError('Fehler beim Laden der Rechnung')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!loading && invoice && settings) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [loading, invoice, settings])

  if (loading) {
    return <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>Lade Rechnung...</div>
  }
  if (error || !invoice || !settings) {
    return <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: 'red' }}>{error || 'Fehler'}</div>
  }

  const isKleinunternehmer = settings.is_kleinunternehmer === 'true'
  const paymentDays = parseInt(settings.payment_terms_days) || 14
  const dueDate = addDays(invoice.date, paymentDays)
  const snap = invoice.customer_snapshot

  const fmtEur = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)

  const fmtTotal = (n: number) => {
    const formatted = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)
    return `${formatted} €`
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #e8e8e8;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10.5pt;
          color: #000;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .logo-strip {
          background: #000000;
          width: 210mm;
          margin: 20px auto 0 auto;
          padding: 14px 20mm;
          display: flex;
          align-items: center;
        }

        .logo-strip img {
          height: 48px;
          width: auto;
          display: block;
          transform: rotate(-90deg);
        }

        .page {
          width: 210mm;
          min-height: 260mm;
          margin: 0 auto 20px auto;
          background: white;
          padding: 14mm 20mm 20mm 20mm;
          position: relative;
          box-shadow: 0 2px 20px rgba(0,0,0,0.18);
        }

        .print-btn {
          position: fixed;
          top: 15px;
          right: 15px;
          background: #c9a96e;
          color: #111111;
          border: none;
          padding: 10px 22px;
          border-radius: 3px;
          font-size: 14px;
          cursor: pointer;
          font-family: Arial, sans-serif;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(201,169,110,0.4);
          z-index: 100;
        }
        .print-btn:hover { background: #b8944f; }

        p { line-height: 1.6; }

        .divider {
          border: none;
          border-top: 1px solid #000;
          margin: 5mm 0;
        }

        .section { margin-top: 0; }

        .label { font-weight: bold; }

        .heading {
          font-size: 13pt;
          font-weight: bold;
          margin-bottom: 2mm;
        }

        .total-line {
          font-size: 13pt;
          font-weight: bold;
          margin: 1mm 0;
        }

        .closing { margin-top: 12mm; }

        @media print {
          body { background: white; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .logo-strip {
            margin: 0 auto;
            background: #000000 !important;
          }
          .page {
            margin: 0 auto;
            box-shadow: none;
            padding: 14mm 20mm 20mm 20mm;
          }
          .print-btn { display: none !important; }
        }
      `}</style>

      <button className="print-btn" onClick={() => window.print()}>
        Drucken / Als PDF speichern
      </button>

      {/* Black logo strip */}
      <div className="logo-strip">
        <img
          src="https://i.postimg.cc/ZW5x32q3/The-(Deine-Geschichte).png"
          alt="Logo"
        />
      </div>

      <div className="page">

        {/* Sender info */}
        <div className="section">
          <p className="label">{settings.company_name}</p>
          {settings.company_address && <p>{settings.company_address}</p>}
          {(settings.company_postal_code || settings.company_city) && (
            <p>{[settings.company_postal_code, settings.company_city].filter(Boolean).join(' ')}</p>
          )}
          {settings.company_email && <p>E-Mail: {settings.company_email}</p>}
          {settings.company_phone && <p>Telefon: {settings.company_phone}</p>}
        </div>

        {/* Tax numbers */}
        {(settings.tax_id || settings.tax_number) && (
          <div style={{ marginTop: '4mm' }}>
            {settings.tax_id && <p>UstID: {settings.tax_id}</p>}
            {settings.tax_number && <p>Steuernummer Gewerbe: {settings.tax_number}</p>}
          </div>
        )}

        {/* Customer address */}
        {snap?.name && (
          <div style={{ marginTop: '6mm' }}>
            <p>{snap.name}</p>
            {snap.contact_name && <p>{snap.contact_name}</p>}
            {snap.address && <p>{snap.address}</p>}
            {(snap.postal_code || snap.city) && (
              <p>{[snap.postal_code, snap.city].filter(Boolean).join(' ')}</p>
            )}
          </div>
        )}

        <hr className="divider" />

        {/* Invoice meta */}
        <p className="heading">Rechnung</p>
        <p>Rechnungsnummer: {invoice.invoice_number}</p>
        <p>Rechnungsdatum: {formatGermanDate(invoice.date)}</p>
        {invoice.service_period && <p>Leistungszeitraum: {invoice.service_period}</p>}

        <hr className="divider" />

        {/* Service description */}
        <p className="label">Leistungsbeschreibung:</p>
        {invoice.items.map((item, i) => (
          <div key={i} style={{ marginTop: '1mm' }}>
            <p>{item.description}</p>
            {invoice.items.length > 1 && (
              <p style={{ marginTop: '0.5mm', fontWeight: 'bold' }}>{fmtEur(item.amount)}</p>
            )}
          </div>
        ))}

        <hr className="divider" />

        {/* Total */}
        <p className="total-line">
          Gesamtbetrag (netto):&nbsp;&nbsp;{fmtTotal(invoice.subtotal)}
        </p>

        {!isKleinunternehmer && invoice.tax_rate > 0 && (
          <div style={{ marginTop: '2mm' }}>
            <p>zzgl. {invoice.tax_rate}% MwSt.: {fmtEur(invoice.tax_amount)}</p>
            <p className="total-line" style={{ marginTop: '2mm' }}>
              Gesamtbetrag (brutto):&nbsp;&nbsp;{fmtTotal(invoice.total)}
            </p>
          </div>
        )}

        {isKleinunternehmer && (
          <p style={{ marginTop: '2mm', fontSize: '9pt', color: '#333' }}>
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
          </p>
        )}

        {/* Spacer */}
        <div style={{ height: '10mm' }} />

        {/* Payment */}
        <p>
          Zahlungsziel: Bitte überweisen Sie den Betrag
          {paymentDays > 0 ? ` bis zum ${formatGermanDate(dueDate)}` : ''} auf folgendes Konto:
        </p>

        <div style={{ marginTop: '4mm' }}>
          <p className="label">Bankverbindung:</p>
          {settings.company_name && <p>Kontoinhaberin: {settings.company_name}</p>}
          {settings.company_iban && <p>IBAN: {settings.company_iban}</p>}
          {settings.company_bic && <p>BIC: {settings.company_bic}</p>}
          {settings.company_bank && <p>Bankname: {settings.company_bank}</p>}
        </div>

        {invoice.notes && (
          <p style={{ marginTop: '4mm' }}>{invoice.notes}</p>
        )}

        {/* Closing */}
        <div className="closing">
          <hr className="divider" />
          <p>Bei Rückfragen stehe ich Ihnen jederzeit gerne zur Verfügung.</p>
          <p style={{ marginTop: '2mm' }}>Mit freundlichen Grüßen,</p>
          <p style={{ marginTop: '8mm' }}>{settings.company_name}</p>
        </div>

      </div>
    </>
  )
}
