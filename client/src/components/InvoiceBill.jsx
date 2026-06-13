// InvoiceBill — Printable/PDF invoice receipt component with pricing breakdown
const formatDisplayDate = (value) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-US')
}

const InvoiceBill = ({ booking, pricing, invoiceNumber, logoPng, roomCover, bookingStatus, formatPrice }) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{`Invoice ${invoiceNumber}`}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --ink: #0f172a;
            --muted: #64748b;
            --line: #dbe4f0;
            --brandA: #0f766e;
            --brandB: #0ea5e9;
            --accent: #f59e0b;
            --accentSoft: rgba(245, 158, 11, 0.14);
            --paper: #f8fbff;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Outfit', Arial, sans-serif;
            color: var(--ink);
            margin: 0;
            background:
              radial-gradient(circle at top left, rgba(14,165,233,0.16), transparent 28%),
              radial-gradient(circle at bottom right, rgba(15,118,110,0.12), transparent 24%),
              linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
          }
          .page {
            max-width: 1120px;
            margin: 22px auto;
            padding: 18px;
          }
          .invoiceShell {
            position: relative;
            overflow: hidden;
            border-radius: 28px;
            border: 1px solid rgba(219, 228, 240, 0.95);
            background: rgba(255, 255, 255, 0.96);
            box-shadow: 0 28px 70px rgba(15, 23, 42, 0.1);
          }
          .invoiceShell::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              linear-gradient(135deg, rgba(14,165,233,0.08), transparent 35%),
              linear-gradient(315deg, rgba(245,158,11,0.08), transparent 28%);
            pointer-events: none;
          }
          .hero {
            position: relative;
            z-index: 1;
            padding: 28px;
            color: #ffffff;
            background:
              linear-gradient(120deg, rgba(15,118,110,0.97), rgba(14,165,233,0.92));
          }
          .heroInner {
            display: flex;
            justify-content: space-between;
            gap: 28px;
            align-items: flex-start;
          }
          .brandWrap { display: flex; gap: 16px; align-items: center; }
          .brandLogo {
            width: 72px;
            height: 72px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.95);
            padding: 12px;
            object-fit: contain;
            box-shadow: 0 18px 34px rgba(15, 23, 42, 0.22);
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 11px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.14);
            text-transform: uppercase;
            letter-spacing: 0.14em;
            font-size: 10px;
            font-weight: 700;
          }
          .brand {
            margin-top: 8px;
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 32px;
            line-height: 1;
            letter-spacing: 0.2px;
          }
          .heroTitle {
            margin-top: 8px;
            font-size: 14px;
            line-height: 1.7;
            color: rgba(255,255,255,0.88);
            max-width: 500px;
          }
          .heroMeta {
            min-width: 270px;
            text-align: right;
          }
          .invoiceNo {
            font-size: 29px;
            font-weight: 800;
            letter-spacing: 0.08em;
          }
          .issuedAt {
            margin-top: 6px;
            font-size: 13px;
            color: rgba(255,255,255,0.85);
          }
          .statusChip {
            margin-top: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 14px;
            border-radius: 999px;
            background: rgba(255,255,255,0.16);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.14em;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ffffff;
            box-shadow: 0 0 0 6px rgba(255,255,255,0.12);
          }
          .content {
            position: relative;
            z-index: 1;
            padding: 24px;
          }
          .summaryGrid {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 18px;
            margin-bottom: 18px;
          }
          .panel {
            border: 1px solid var(--line);
            border-radius: 22px;
            background: rgba(255,255,255,0.985);
            box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
          }
          .panelPad { padding: 18px; }
          .sectionLabel {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--brandA);
            margin-bottom: 10px;
          }
          .guestName {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 26px;
            line-height: 1.1;
            margin-bottom: 8px;
          }
          .detailText {
            font-size: 14px;
            color: var(--muted);
            line-height: 1.7;
          }
          .stack {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 14px;
          }
          .chip {
            border-radius: 18px;
            border: 1px solid rgba(148, 163, 184, 0.18);
            background: linear-gradient(180deg, #f8fbff, #ffffff);
            padding: 12px 14px;
          }
          .chipLabel {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 5px;
          }
          .chipValue { font-size: 15px; font-weight: 700; color: var(--ink); }
          .mediaPanel { overflow: hidden; }
          .mediaCover {
            width: 100%;
            height: 228px;
            object-fit: cover;
            display: block;
          }
          .mediaFallback {
            height: 228px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            text-align: center;
            color: var(--muted);
            background:
              radial-gradient(circle at top left, rgba(14,165,233,0.14), transparent 30%),
              linear-gradient(180deg, #f8fbff, #ffffff);
          }
          .mediaCaption {
            padding: 14px 16px 16px;
            border-top: 1px solid var(--line);
          }
          .mediaCaption strong { display: block; margin-bottom: 4px; }
          .captionRow {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .captionBadge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 10px;
            border-radius: 999px;
            background: rgba(15, 118, 110, 0.08);
            color: #0f766e;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .captionMark {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #0f766e;
            box-shadow: 0 0 0 5px rgba(15, 118, 110, 0.12);
          }
          .breakdown {
            margin-top: 18px;
            overflow: hidden;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid rgba(219, 228, 240, 0.95); padding: 15px 16px; font-size: 14px; text-align: left; }
          thead th {
            background: linear-gradient(120deg, #f7fdff, #eef7ff);
            color: #0f4c81;
            font-size: 11px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }
          .right { text-align: right; }
          .totalRow td {
            background: linear-gradient(120deg, rgba(14,165,233,0.06), rgba(15,118,110,0.06));
            font-weight: 800;
            font-size: 16px;
          }
          .amount {
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }
          .negative { color: #0f766e; }
          .footer {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px dashed var(--line);
            color: var(--muted);
            font-size: 12px;
          }
          .seal {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border-radius: 999px;
            background: var(--accentSoft);
            color: #92400e;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }
          .sealMark {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.16);
          }
          .heroArt {
            width: 120px;
            height: 82px;
            border-radius: 16px;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.4);
            box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
            margin-top: 12px;
          }
          @media print {
            body { background: #fff; }
            .page { margin: 0; max-width: 100%; padding: 0; }
            .invoiceShell { border: none; border-radius: 0; box-shadow: none; }
            .hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .content { padding: 20px; }
          }
          @media (max-width: 840px) {
            .heroInner,
            .summaryGrid,
            .footer {
              grid-template-columns: 1fr;
              flex-direction: column;
              text-align: left;
            }
            .heroMeta { min-width: 0; text-align: left; }
            .captionRow { flex-direction: column; align-items: flex-start; }
          }
        `}</style>
      </head>
      <body>
        <div className="page">
          <div className="invoiceShell">
            <div className="hero">
              <div className="heroInner">
                <div>
                  <div className="brandWrap">
                    <img className="brandLogo" src={logoPng} alt="SmartStayX logo" />
                    <div>
                      <div className="eyebrow">Reservation Receipt</div>
                      <div className="brand">SmartStayX</div>
                      <div className="heroTitle">
                        A refined booking statement with a premium, print-ready layout for your stay at {booking.hotel?.name || 'SmartStayX'}.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="heroMeta">
                  <div className="invoiceNo">{invoiceNumber}</div>
                  <div className="issuedAt">Issued {formatDisplayDate(new Date())}</div>
                  <div className="statusChip"><span className="dot"></span>{bookingStatus}</div>
                </div>
              </div>
            </div>

            <div className="content">
              <div className="summaryGrid">
                <div className="panel panelPad">
                  <div className="sectionLabel">Booking Summary</div>
                  <div className="guestName">{booking.guestDisplayName || 'Guest'}</div>
                  <div className="detailText">
                    {booking.hotel?.name || 'Hotel'} · {booking.room?.roomType || 'Room'}
                  </div>

                  <div className="stack">
                    <div className="chip">
                      <div className="chipLabel">Booking ID</div>
                      <div className="chipValue">{booking._id || '-'}</div>
                    </div>
                    <div className="chip">
                      <div className="chipLabel">Guests</div>
                      <div className="chipValue">{booking.guests || 1}</div>
                    </div>
                    <div className="chip">
                      <div className="chipLabel">Check-in</div>
                      <div className="chipValue">{formatDisplayDate(booking.checkInDate)}</div>
                    </div>
                    <div className="chip">
                      <div className="chipLabel">Check-out</div>
                      <div className="chipValue">{formatDisplayDate(booking.checkOutDate)}</div>
                    </div>
                  </div>
                </div>

                <div className="panel mediaPanel">
                  {roomCover ? (
                    <img className="mediaCover" src={roomCover} alt="Booked room" />
                  ) : (
                    <div className="mediaFallback">
                      <div>
                        <strong>{booking.room?.roomType || 'Room'}</strong>
                        <br />
                        Premium stay crafted for comfort, timing, and clarity.
                      </div>
                    </div>
                  )}
                  <div className="mediaCaption">
                    <div className="captionRow">
                      <strong>{booking.paymentMethod || 'Pay At Hotel'}</strong>
                      <span className="captionBadge"><span className="captionMark"></span>Verified stay</span>
                    </div>
                    <div className="detailText">Payment method for this reservation</div>
                  </div>
                </div>
              </div>

              <div className="panel breakdown">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Base room rate ({formatPrice(pricing.basePerNight)} × {pricing.nights} night{pricing.nights > 1 ? 's' : ''})</td>
                      <td className="right amount">{formatPrice(pricing.baseTotal)}</td>
                    </tr>
                    <tr>
                      <td>Dynamic pricing adjustment ({pricing.multiplier.toFixed(2)}×)</td>
                      <td className="right amount negative">{formatPrice(pricing.surgeAmount)}</td>
                    </tr>
                    <tr className="totalRow">
                      <td>Total payable</td>
                      <td className="right amount">{formatPrice(booking.totalPrice)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="footer">
                  <div className="seal"><span className="sealMark"></span>{booking.isPaid ? 'Paid in Full' : 'Unpaid'}</div>
                  <span>Thank you for choosing SmartStayX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <script>{`window.onload = function () { window.print(); }`}</script>
      </body>
    </html>
  )
}

export default InvoiceBill
