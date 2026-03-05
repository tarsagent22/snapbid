import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { businessName, trade, clientName, clientAddress, quoteNumber, lineItems, subtotal, tax, total, notes } = data

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    // Build HTML for PDF-like rendering (browser print / puppeteer-friendly)
    const { phone, email, businessAddress, licenseNumber, paymentTerms, quoteValidityDays, introMessage, scopeOfWork, inclusions, exclusions, showMarkupOnQuote } = data
    const filteredLineItems = showMarkupOnQuote
      ? lineItems
      : lineItems.filter((item: any) => !item.description.toLowerCase().includes('markup'))

    const PAYMENT_LABELS: Record<string, string> = {
      '50-deposit': '50% deposit to begin, balance on completion',
      '30-deposit': '30% deposit to begin, balance on completion',
      'on-completion': 'Full payment due on completion',
      'net-15': 'Net 15',
      'net-30': 'Net 30',
      'full-upfront': 'Full payment required upfront',
      'custom': 'As discussed',
    }
    const paymentLabel = PAYMENT_LABELS[paymentTerms] || paymentTerms || 'Net 30'
    const validDays = quoteValidityDays || 30

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Quote ${quoteNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #2563eb; }
  .logo { font-size: 22px; font-weight: 700; color: #2563eb; }
  .logo-sub { font-size: 13px; color: #6b7280; margin-top: 2px; text-transform: capitalize; }
  .logo-contact { font-size: 12px; color: #6b7280; margin-top: 6px; line-height: 1.6; }
  .meta { text-align: right; font-size: 13px; color: #6b7280; }
  .meta strong { display: block; font-size: 16px; color: #111; font-weight: 700; }
  .intro { background: #f0f9ff; border-left: 3px solid #2563eb; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #1e40af; border-radius: 0 6px 6px 0; }
  .bill-to { background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 32px; }
  .bill-to label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
  .bill-to p { font-size: 14px; color: #111; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: left; }
  thead th:not(:first-child) { text-align: right; }
  tbody td { padding: 12px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  tbody td:not(:first-child) { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 240px; }
  .totals-row { display: flex; justify-content: space-between; font-size: 14px; color: #6b7280; padding: 4px 0; }
  .totals-row.grand { font-size: 16px; font-weight: 700; color: #111; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 6px; }
  .notes { background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .notes label { font-size: 11px; font-weight: 600; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em; }
  .notes p { font-size: 13px; color: #1e40af; margin-top: 4px; }
  .terms { display: flex; gap: 24px; margin-bottom: 32px; font-size: 12px; color: #6b7280; }
  .terms div { display: flex; flex-direction: column; gap: 2px; }
  .terms strong { color: #374151; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  .footer { text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
  .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 99px; }
  .scope { background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .scope label { font-size: 11px; font-weight: 600; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
  .scope ul { list-style: none; margin: 0; padding: 0; }
  .scope ul li { font-size: 13px; color: #374151; padding: 2px 0; }
  .inclusions { background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .inclusions label { font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
  .inclusions ul { list-style: none; margin: 0; padding: 0; }
  .inclusions ul li { font-size: 13px; color: #14532d; padding: 2px 0; }
  .exclusions { background: #fffbeb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .exclusions label { font-size: 11px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
  .exclusions ul { list-style: none; margin: 0; padding: 0; }
  .exclusions ul li { font-size: 13px; color: #78350f; padding: 2px 0; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">${businessName}</div>
      <div class="logo-sub">${trade} Services</div>
      <div class="logo-contact">
        ${phone ? `📞 ${phone}` : ''}${phone && email ? ' &nbsp;·&nbsp; ' : ''}${email ? `✉ ${email}` : ''}<br>
        ${businessAddress ? businessAddress : ''}${businessAddress && licenseNumber ? ' &nbsp;·&nbsp; ' : ''}${licenseNumber ? `Lic. ${licenseNumber}` : ''}
      </div>
    </div>
    <div class="meta">
      <strong>Quote ${quoteNumber}</strong>
      <span>${date}</span><br>
      <span>Valid for ${validDays} days</span>
    </div>
  </div>

  ${introMessage ? `<div class="intro">${introMessage}</div>` : ''}

  <div class="bill-to">
    <label>Prepared For</label>
    <p><strong>${clientName}</strong></p>
    <p>${clientAddress}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${filteredLineItems.map((item: any) => `
      <tr>
        <td>${item.description}</td>
        <td>${item.qty}</td>
        <td>$${item.unitPrice}</td>
        <td>$${item.total}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>$${subtotal}</span></div>
      <div class="totals-row"><span>Tax (est.)</span><span>$${tax}</span></div>
      <div class="totals-row grand"><span>Total</span><span>$${total}</span></div>
    </div>
  </div>

  ${scopeOfWork ? `<div class="scope"><label>Scope of Work</label><ul>${
    (() => {
      const rawParts = scopeOfWork.split(/\n/).map((s: string) => s.trim()).filter(Boolean)
      const parts = rawParts.length > 1 ? rawParts : scopeOfWork.split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter(Boolean)
      return parts.map((s: string) => `<li>\u2192 ${s}</li>`).join('')
    })()
  }</ul></div>` : ''}

  ${inclusions && inclusions.length > 0 ? `<div class="inclusions"><label>What's Included</label><ul>${inclusions.map((s: string) => `<li>\u2713 ${s}</li>`).join('')}</ul></div>` : ''}

  ${exclusions && exclusions.length > 0 ? `<div class="exclusions"><label>Not Included</label><ul>${exclusions.map((s: string) => `<li>\u2717 ${s}</li>`).join('')}</ul></div>` : ''}

  ${notes ? `<div class="notes"><label>Notes</label><p>${notes}</p></div>` : ''}

  <div class="terms">
    <div><strong>Payment Terms</strong>${paymentLabel}</div>
    <div><strong>Quote Valid Until</strong>${new Date(Date.now() + validDays * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="footer">
    Generated by <span class="badge">SnapBid</span> · AI-powered quotes for contractors
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="quote-${quoteNumber}.html"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
