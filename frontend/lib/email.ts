import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Foodra <notifications@foodramarket.com>"
const LOGO = "https://foodramarket.com/foodra_logo.jpeg"

// ─── Shared layout ────────────────────────────────────────────────────────────
function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Foodra</title></head>
<body style="margin:0;padding:0;background:#f4f7f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f0;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header with logo -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b2e 0%,#2d9e4f 100%);padding:28px 40px;text-align:center;">
            <img src="${LOGO}" alt="Foodra" width="56" height="56"
              style="border-radius:12px;display:block;margin:0 auto 12px;object-fit:cover;"
              onerror="this.style.display='none'" />
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Foodra</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px;">Empowering African Farmers</div>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8faf5;padding:24px 40px;text-align:center;border-top:1px solid #e8f0e0;">
            <p style="margin:0;font-size:12px;color:#888;">© 2026 Foodra · Building the future of African agriculture</p>
            <p style="margin:6px 0 0;font-size:12px;color:#aaa;">You're receiving this because you have an account on Foodra.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function heading(title: string) {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">${title}</h1>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e8f0e0;margin:24px 0;">`
}

function btn(text: string, url: string) {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#1a6b2e,#2d9e4f);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;letter-spacing:0.3px;">
      ${text} →
    </a>
  </div>`
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:#666;width:160px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${value}</td>
  </tr>`
}

function tag(text: string, color = "#1a6b2e", bg = "#e8f5ed") {
  return `<span style="display:inline-block;background:${bg};color:${color};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.5px;">${text}</span>`
}

function moneyBox(lines: { label: string; value: string; bold?: boolean; green?: boolean }[]) {
  const rows = lines.map(l =>
    `<tr>
      <td style="padding:6px 0;font-size:14px;color:${l.bold ? "#1a1a1a" : "#555"};font-weight:${l.bold ? "700" : "400"};">${l.label}</td>
      <td style="padding:6px 0;font-size:14px;color:${l.green ? "#1a6b2e" : l.bold ? "#1a1a1a" : "#333"};font-weight:${l.bold ? "700" : "600"};text-align:right;">${l.value}</td>
    </tr>`
  ).join("")
  return `<div style="background:#f8faf5;border-radius:12px;padding:16px 20px;margin:16px 0;">
    <table cellpadding="0" cellspacing="0" style="width:100%;">${rows}</table>
  </div>`
}

// Inline receipt block — embedded in financial emails as a downloadable-style summary
function receiptBlock(lines: { label: string; value: string; bold?: boolean; green?: boolean }[], receiptRef: string) {
  const rows = lines.filter(l => l.label || l.value).map(l =>
    `<tr>
      <td style="padding:7px 12px;font-size:13px;color:${l.bold ? "#1a1a1a" : "#666"};font-weight:${l.bold ? "700" : "400"};border-bottom:1px dashed #e5e7eb;">${l.label}</td>
      <td style="padding:7px 12px;font-size:13px;color:${l.green ? "#1a6b2e" : l.bold ? "#111" : "#333"};font-weight:${l.bold ? "700" : "600"};text-align:right;border-bottom:1px dashed #e5e7eb;">${l.value}</td>
    </tr>`
  ).join("")
  return `
  <div style="margin:24px 0;border:1.5px solid #d1fae5;border-radius:12px;overflow:hidden;font-family:monospace;">
    <div style="background:linear-gradient(135deg,#1a6b2e,#2d9e4f);padding:10px 16px;display:flex;justify-content:space-between;align-items:center;">
      <span style="color:#fff;font-size:12px;font-weight:700;letter-spacing:1px;">FOODRA RECEIPT</span>
      <span style="color:rgba(255,255,255,0.75);font-size:11px;">${new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span>
    </div>
    <table cellpadding="0" cellspacing="0" style="width:100%;background:#fafffe;">${rows}</table>
    <div style="background:#f0fdf4;padding:8px 12px;text-align:center;border-top:1px dashed #d1fae5;">
      <span style="font-size:10px;color:#6b7280;letter-spacing:0.5px;">REF: ${receiptRef} • foodramarket.com</span>
    </div>
  </div>`
}

// ─── Send helper ──────────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  if (!to || !process.env.RESEND_API_KEY) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (e) {
    console.error("[Resend] Failed to send email:", e)
  }
}

// Send to many — batched to avoid rate limits (10 per batch, 600ms apart)
export async function sendBatch(recipients: { email: string; name: string }[], subject: string, htmlFn: (name: string) => string) {
  if (!process.env.RESEND_API_KEY) return
  const BATCH = 10
  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH)
    await Promise.allSettled(chunk.map(r => send(r.email, subject, htmlFn(r.name))))
    if (i + BATCH < recipients.length) await new Promise(res => setTimeout(res, 600))
  }
}

// Build a URL with ?uid= so the app can detect account mismatches
function appUrl(path: string, userId?: string) {
  const base = "https://foodramarket.com"
  return userId ? `${base}${path}?uid=${userId}` : `${base}${path}`
}

// ─── 1. Welcome ───────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  const html = layout(`
    ${heading(`Welcome to Foodra, ${name}! 👋`)}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0;">
      You're now part of a movement reshaping African agriculture. Whether you're here to buy fresh produce, sell your harvest, or grow your farm — Foodra is your platform.
    </p>
    ${divider()}
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      <tr>
        <td style="padding:12px;background:#f8faf5;border-radius:12px;text-align:center;">
          <div style="font-size:28px;">🛒</div>
          <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-top:6px;">Marketplace</div>
          <div style="font-size:12px;color:#888;">Buy &amp; sell produce</div>
        </td>
        <td style="width:12px;"></td>
        <td style="padding:12px;background:#f8faf5;border-radius:12px;text-align:center;">
          <div style="font-size:28px;">💰</div>
          <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-top:6px;">Funding</div>
          <div style="font-size:12px;color:#888;">Apply for grants</div>
        </td>
        <td style="width:12px;"></td>
        <td style="padding:12px;background:#f8faf5;border-radius:12px;text-align:center;">
          <div style="font-size:28px;">📚</div>
          <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-top:6px;">Training</div>
          <div style="font-size:12px;color:#888;">Learn &amp; grow</div>
        </td>
        <td style="width:12px;"></td>
        <td style="padding:12px;background:#f8faf5;border-radius:12px;text-align:center;">
          <div style="font-size:28px;">👛</div>
          <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-top:6px;">Wallet</div>
          <div style="font-size:12px;color:#888;">Crypto payments</div>
        </td>
      </tr>
    </table>
    ${btn("Explore Foodra", "https://foodramarket.com")}
  `)
  await send(to, "Welcome to Foodra 🌱", html)
}

// ─── 2. Order placed (buyer) ──────────────────────────────────────────────────
export async function sendOrderConfirmationEmail(
  to: string, name: string, orderId: string, total: number,
  items: { name: string; qty: number; price: number }[],
  userId?: string, usdcAmount?: number, rate?: number
) {
  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:10px 0;font-size:14px;color:#333;border-bottom:1px solid #f0f0f0;">${i.name}</td>
      <td style="padding:10px 0;font-size:14px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0;">×${i.qty}</td>
      <td style="padding:10px 0;font-size:14px;color:#1a6b2e;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">₦${(i.price * i.qty).toLocaleString()}</td>
    </tr>`
  ).join("")

  const html = layout(`
    ${heading("Order Confirmed! 🛒")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your order has been placed and is now being processed by the farmer(s).
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Order ID", `#${orderId.slice(-8).toUpperCase()}`)}
        ${infoRow("Status", tag("Pending"))}
      </table>
    </div>
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      <tr>
        <th style="text-align:left;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8f0e0;">Item</th>
        <th style="text-align:center;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8f0e0;">Qty</th>
        <th style="text-align:right;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8f0e0;">Amount (₦)</th>
      </tr>
      ${itemRows}
    </table>
    ${moneyBox([
      { label: "Subtotal (NGN)", value: `₦${total.toLocaleString()}` },
      ...(usdcAmount ? [{ label: "USDC Equivalent", value: `${usdcAmount.toFixed(4)} USDC` }] : []),
      ...(rate ? [{ label: "Exchange Rate", value: `₦${rate.toLocaleString()} / USDC` }] : []),
      { label: "Total Paid (NGN)", value: `₦${total.toLocaleString()}`, bold: true, green: true },
    ])}
    ${receiptBlock([
      { label: "Order ID", value: `#${orderId.slice(-8).toUpperCase()}` },
      ...items.map(i => ({ label: `${i.name} ×${i.qty}`, value: `₦${(i.price * i.qty).toLocaleString()}` })),
      { label: "Total", value: `₦${total.toLocaleString()}`, bold: true, green: true },
      ...(usdcAmount ? [{ label: "USDC", value: `${usdcAmount.toFixed(4)} USDC` }] : []),
    ], `ORD-${orderId.slice(-8).toUpperCase()}`)}
    ${btn("Track Your Order", appUrl(`/orders/${orderId}`, userId))}
  `)
  await send(to, `Order Confirmed #${orderId.slice(-8).toUpperCase()} ✅`, html)
}

// ─── 3. Order status update (buyer) ──────────────────────────────────────────
const statusConfig: Record<string, { icon: string; title: string; message: string; tagColor: string; tagBg: string }> = {
  Processing: { icon: "⚙️", title: "Order is Being Processed", message: "The farmer has confirmed your order and is preparing it for dispatch.", tagColor: "#b45309", tagBg: "#fef9c3" },
  Shipped:    { icon: "🚚", title: "Your Order is On the Way!", message: "Your order has been shipped and is heading your way.", tagColor: "#1d4ed8", tagBg: "#dbeafe" },
  Delivered:  { icon: "🎉", title: "Order Delivered!", message: "Your order has been delivered. We hope you love it!", tagColor: "#166534", tagBg: "#dcfce7" },
  Cancelled:  { icon: "❌", title: "Order Cancelled", message: "Your order has been cancelled. Contact support if you have questions.", tagColor: "#b91c1c", tagBg: "#fee2e2" },
}

export async function sendOrderStatusEmail(to: string, name: string, orderId: string, status: string, userId?: string) {
  const cfg = statusConfig[status]
  if (!cfg) return
  const html = layout(`
    ${heading(`${cfg.icon} ${cfg.title}`)}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, ${cfg.message}
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Order ID", `#${orderId.slice(-8).toUpperCase()}`)}
        ${infoRow("New Status", tag(status, cfg.tagColor, cfg.tagBg))}
      </table>
    </div>
    ${btn("View Order Details", appUrl(`/orders/${orderId}`, userId))}
  `)
  await send(to, `Your order is ${status} ${cfg.icon}`, html)
}

// ─── 4. New order for farmer ──────────────────────────────────────────────────
export async function sendFarmerNewOrderEmail(to: string, farmerName: string, orderId: string, items: { name: string; qty: number; price?: number }[], total: number) {
  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px 0;font-size:14px;color:#333;border-bottom:1px solid #f0f0f0;">${i.name}</td>
      <td style="padding:8px 0;font-size:14px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0;">×${i.qty}</td>
      ${i.price ? `<td style="padding:8px 0;font-size:14px;color:#1a6b2e;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">₦${(i.price * i.qty).toLocaleString()}</td>` : "<td></td>"}
    </tr>`
  ).join("")
  const html = layout(`
    ${heading(`New Order Received, ${farmerName}! 🧑‍🌾`)}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      You have a new order. Please process and ship it promptly.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <th style="text-align:left;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8f0e0;">Item</th>
        <th style="text-align:center;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8f0e0;">Qty</th>
        <th style="text-align:right;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8f0e0;">Amount</th>
      </tr>
      ${itemRows}
    </table>
    ${moneyBox([{ label: "Order Total (NGN)", value: `₦${total.toLocaleString()}`, bold: true, green: true }])}
    <div style="background:#f8faf5;border-radius:12px;padding:16px 20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Order ID", `#${orderId.slice(-8).toUpperCase()}`)}
      </table>
    </div>
    ${btn("Manage Order in Dashboard", "https://foodramarket.com/sales")}
  `)
  await send(to, `New order #${orderId.slice(-8).toUpperCase()} — ₦${total.toLocaleString()}`, html)
}

// ─── 5. Funding submitted ─────────────────────────────────────────────────────
export async function sendFundingSubmittedEmail(
  to: string, name: string, amount: number, score: number, tier: string, userId?: string,
  details?: { farmSize?: string; farmType?: string; yearsOfExperience?: number; expectedOutcome?: string }
) {
  const tierColors: Record<string, [string, string]> = {
    Excellent: ["#166534", "#dcfce7"], Good: ["#1d4ed8", "#dbeafe"],
    Fair: ["#b45309", "#fef9c3"], Poor: ["#b91c1c", "#fee2e2"],
  }
  const [tc, tb] = tierColors[tier] ?? ["#555", "#f0f0f0"]
  const html = layout(`
    ${heading("Funding Application Received! 💰")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your funding application has been submitted. Our team will review it and respond within <strong>5–7 business days</strong>.
    </p>
    <p style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Application Summary</p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Amount Requested", `₦${amount.toLocaleString()}`)}
        ${details?.farmType ? infoRow("Farm Type", details.farmType) : ""}
        ${details?.farmSize ? infoRow("Farm Size", details.farmSize) : ""}
        ${details?.yearsOfExperience !== undefined ? infoRow("Experience", `${details.yearsOfExperience} year(s)`) : ""}
        ${details?.expectedOutcome ? infoRow("Expected Outcome", details.expectedOutcome) : ""}
      </table>
    </div>
    <p style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Credit Assessment</p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Credit Score", `${score} / 100`)}
        ${infoRow("Credit Tier", tag(tier, tc, tb))}
        ${infoRow("Review Status", tag("Under Review", "#b45309", "#fef9c3"))}
      </table>
    </div>
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;">💡 <strong>Tip:</strong> A higher credit score improves your chances. Complete your profile and add more farm details to boost your score.</p>
    </div>
    ${btn("View My Application", appUrl("/funding", userId))}
  `)
  await send(to, "Funding Application Submitted 📋", html)
}

// ─── 6. Funding decision ──────────────────────────────────────────────────────
export async function sendFundingDecisionEmail(to: string, name: string, status: "Approved" | "Rejected", amount: number, note?: string, userId?: string) {
  const approved = status === "Approved"
  const html = layout(`
    ${heading(approved ? "Congratulations! Funding Approved! 🎉" : "Funding Application Update 📋")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, ${approved
        ? `your funding application has been <strong style="color:#1a6b2e;">approved!</strong> Our team will be in touch with the next steps.`
        : `after careful review, we were unable to approve your application at this time.`}
    </p>
    ${moneyBox([
      { label: approved ? "Amount Approved" : "Amount Requested", value: `₦${amount.toLocaleString()}`, bold: true, green: approved },
      { label: "Decision", value: approved ? "Approved ✅" : "Not Approved", bold: true },
      ...(note ? [{ label: "Reason / Note", value: note }] : []),
    ])}
    ${!approved ? `<div style="background:#f8faf5;border-radius:12px;padding:16px 20px;margin-top:4px;">
      <p style="margin:0;font-size:13px;color:#666;">You may re-apply after 90 days with an improved profile and stronger credit score.</p>
    </div>` : ""}
    ${btn(approved ? "View My Funding" : "Improve &amp; Reapply", appUrl("/funding", userId))}
  `)
  await send(to, approved ? "🎉 Your Funding Application is Approved!" : "Funding Application Update", html)
}

// ─── 7. Training enrollment ───────────────────────────────────────────────────
export async function sendTrainingEnrollmentEmail(
  to: string, name: string, trainingTitle: string, trainingId: string, userId?: string,
  details?: { date?: string; mode?: string; location?: string; instructor?: string }
) {
  const html = layout(`
    ${heading("Training Enrollment Confirmed! 🎓")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, you're officially enrolled! Get ready to level up your farming skills.
    </p>
    <div style="background:linear-gradient(135deg,#1a6b2e,#2d9e4f);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:18px;font-weight:700;color:#fff;">${trainingTitle}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Enrolled</div>
    </div>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${details?.date ? infoRow("Date", new Date(details.date).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })) : ""}
        ${details?.mode ? infoRow("Mode", details.mode) : ""}
        ${details?.location ? infoRow("Location", details.location) : ""}
        ${details?.instructor ? infoRow("Instructor", details.instructor) : ""}
      </table>
    </div>
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;">📅 Please arrive on time. Check the training page for any last-minute updates.</p>
    </div>
    ${btn("View Training Details", appUrl(`/training/${trainingId}`, userId))}
  `)
  await send(to, `Enrolled: ${trainingTitle} 🎓`, html)
}

// ─── 8. Dispute submitted ─────────────────────────────────────────────────────
export async function sendDisputeSubmittedEmail(to: string, name: string, orderId: string, reason: string, userId?: string) {
  const html = layout(`
    ${heading("Dispute Submitted ⚖️")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your dispute has been received. Our team will review it within <strong>3–5 business days</strong>.
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Order ID", `#${orderId.slice(-8).toUpperCase()}`)}
        ${infoRow("Reason", reason)}
        ${infoRow("Status", tag("Under Review", "#b45309", "#fef9c3"))}
      </table>
    </div>
    ${btn("View Order", appUrl(`/orders/${orderId}`, userId))}
  `)
  await send(to, `Dispute Received — Order #${orderId.slice(-8).toUpperCase()} ⚖️`, html)
}

// ─── 9. Contact form confirmation ─────────────────────────────────────────────
export async function sendContactConfirmationEmail(to: string, name: string, subject: string) {
  const html = layout(`
    ${heading("We Got Your Message! ✉️")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, thanks for reaching out! Our team will respond within <strong>24–48 hours</strong>.
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Subject", subject || "General Inquiry")}
        ${infoRow("Status", tag("Received ✓", "#166534", "#dcfce7"))}
      </table>
    </div>
    ${divider()}
    <p style="font-size:13px;color:#888;text-align:center;">Need urgent help? Email us at <a href="mailto:support@foodramarket.com" style="color:#1a6b2e;">support@foodramarket.com</a></p>
  `)
  await send(to, "We received your message ✉️", html)
}

// ─── 10. Admin broadcast ──────────────────────────────────────────────────────
export async function sendAdminMessageEmail(to: string, name: string, message: string) {
  const html = layout(`
    ${heading("Message from Foodra 📣")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">Hi <strong>${name}</strong>,</p>
    <div style="background:#f8faf5;border-radius:12px;padding:24px;border-left:4px solid #1a6b2e;font-size:15px;color:#333;line-height:1.8;">
      ${message}
    </div>
    ${divider()}
    <p style="font-size:13px;color:#888;text-align:center;">Reply to <a href="mailto:support@foodramarket.com" style="color:#1a6b2e;">support@foodramarket.com</a> if you have questions.</p>
  `)
  await send(to, "📣 Message from Foodra Team", html)
}

// ─── 11. Wishlist price alert ─────────────────────────────────────────────────
export async function sendPriceAlertEmail(to: string, name: string, productName: string, oldPrice: number, newPrice: number, productId: string) {
  const saving = oldPrice - newPrice
  const pct = Math.round((saving / oldPrice) * 100)
  const html = layout(`
    ${heading("Price Drop Alert! 🔔")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, a product on your wishlist just dropped in price.
    </p>
    <div style="background:linear-gradient(135deg,#065f46,#059669);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:14px;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;">${productName}</div>
      <div style="margin:12px 0;">
        <span style="font-size:18px;color:rgba(255,255,255,0.5);text-decoration:line-through;">₦${oldPrice.toLocaleString()}</span>
        &nbsp;→&nbsp;
        <span style="font-size:28px;font-weight:800;color:#fff;">₦${newPrice.toLocaleString()}</span>
      </div>
      <div style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:700;">
        Save ₦${saving.toLocaleString()} (${pct}% off)
      </div>
    </div>
    ${btn("Buy Now Before Price Goes Up", `https://foodramarket.com/marketplace/${productId}`)}
  `)
  await send(to, `🔔 Price Drop: ${productName} is now ₦${newPrice.toLocaleString()}`, html)
}

// ─── 12. Wallet funding request created ──────────────────────────────────────
export async function sendWalletFundingRequestEmail(to: string, name: string, ngnAmount: number, usdcAmount: number, reference: string, userId?: string, rate?: number) {
  const html = layout(`
    ${heading("Wallet Funding Request Received 🏦")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your request to fund your wallet has been received. Please complete the bank transfer within <strong>20 minutes</strong>.
    </p>
    ${moneyBox([
      { label: "You transfer (NGN)", value: `₦${Number(ngnAmount).toLocaleString()}`, bold: true },
      { label: "You receive (USDC)", value: `${usdcAmount} USDC`, bold: true, green: true },
      ...(rate ? [{ label: "Exchange Rate", value: `₦${rate.toLocaleString()} / USDC` }] : []),
      { label: "Reference Code", value: `<strong style="font-family:monospace;font-size:16px;color:#1a6b2e;">${reference}</strong>` },
      { label: "Expires In", value: "20 minutes" },
    ])}
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;">⚠️ <strong>Important:</strong> You must include the reference code <strong>${reference}</strong> in your bank transfer description so we can identify your payment.</p>
    </div>
    ${btn("View Wallet", appUrl("/wallet", userId))}
  `)
  await send(to, `Wallet Funding Request — ${reference}`, html)
}

// ─── 13. Wallet funded / rejected / expired ───────────────────────────────────
export async function sendWalletFundingStatusEmail(to: string, name: string, status: "Confirmed" | "Rejected" | "Expired", ngnAmount: number, usdcAmount: number, reference: string, adminNote?: string, userId?: string, rate?: number) {
  const configs = {
    Confirmed: { title: "Wallet Funded Successfully! ✅", color: "#166534", bg: "#dcfce7" },
    Rejected:  { title: "Funding Request Rejected ❌",    color: "#b91c1c", bg: "#fee2e2" },
    Expired:   { title: "Funding Request Expired ⏰",     color: "#b45309", bg: "#fef9c3" },
  }
  const cfg = configs[status]
  const html = layout(`
    ${heading(cfg.title)}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">Hi <strong>${name}</strong>,</p>
    ${moneyBox([
      { label: "Reference", value: reference },
      { label: "NGN Amount", value: `₦${Number(ngnAmount).toLocaleString()}` },
      ...(status === "Confirmed" ? [{ label: "USDC Credited", value: `${usdcAmount} USDC`, bold: true, green: true }] : [{ label: "USDC Amount", value: `${usdcAmount} USDC` }]),
      ...(rate ? [{ label: "Rate Used", value: `₦${rate.toLocaleString()} / USDC` }] : []),
      { label: "Status", value: status, bold: true },
      ...(adminNote ? [{ label: "Note", value: adminNote }] : []),
    ])}
    ${status === "Confirmed" ? receiptBlock([
      { label: "Reference", value: reference },
      { label: "NGN Transferred", value: `₦${Number(ngnAmount).toLocaleString()}` },
      { label: "USDC Credited", value: `${usdcAmount} USDC`, bold: true, green: true },
      ...(rate ? [{ label: "Rate", value: `₦${rate.toLocaleString()} / USDC` }] : []),
    ], `WFR-${reference}`) : ""}
    ${status !== "Confirmed" ? `<div style="background:#f8faf5;border-radius:12px;padding:16px 20px;margin-top:4px;">
      <p style="margin:0;font-size:13px;color:#666;">
        ${status === "Rejected" ? "Please contact support if you believe this is an error." : "Please create a new funding request if you still want to top up your wallet."}
      </p>
    </div>` : ""}
    ${btn("Go to Wallet", appUrl("/wallet", userId))}
  `)
  await send(to, `Wallet Funding ${status} — ${reference}`, html)
}

// ─── 14. Farmer verification submitted ───────────────────────────────────────
export async function sendVerificationSubmittedEmail(to: string, name: string, userId?: string) {
  const html = layout(`
    ${heading("Verification Request Submitted 🪪")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your farmer verification request has been received. Our team will review your documents within <strong>2–3 business days</strong>.
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Status", tag("Under Review", "#b45309", "#fef9c3"))}
      </table>
    </div>
    ${btn("View Profile", appUrl("/profile", userId))}
  `)
  await send(to, "Farmer Verification Request Submitted 🪪", html)
}

// ─── 15. Farmer verification decision ────────────────────────────────────────
export async function sendVerificationDecisionEmail(to: string, name: string, approved: boolean, adminNote?: string, userId?: string) {
  const html = layout(`
    ${heading(approved ? "Farmer Verification Approved! ✅" : "Farmer Verification Update 📋")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, ${approved
        ? "your farmer profile has been <strong style='color:#1a6b2e;'>verified</strong>. You now have a verified badge and unlock full marketplace benefits."
        : `your verification request was not approved at this time.${adminNote ? ` Reason: <em>${adminNote}</em>` : ""} You may reapply with updated documents.`}
    </p>
    ${approved ? `<div style="background:#dcfce7;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:16px;font-weight:700;color:#166534;">✅ Verified Farmer</div>
    </div>` : ""}
    ${btn("View Profile", appUrl("/profile", userId))}
  `)
  await send(to, approved ? "✅ Farmer Verification Approved!" : "Farmer Verification Update", html)
}

// ─── 16. Support reply from admin ─────────────────────────────────────────────
export async function sendSupportReplyEmail(to: string, name: string, message: string, userId?: string) {
  const html = layout(`
    ${heading("New Reply from Foodra Support 💬")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, our support team has replied to your message.
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;border-left:4px solid #1a6b2e;font-size:15px;color:#333;line-height:1.8;">
      ${message}
    </div>
    ${divider()}
    <p style="font-size:13px;color:#888;text-align:center;">Reply at <a href="mailto:support@foodramarket.com" style="color:#1a6b2e;">support@foodramarket.com</a></p>
    ${btn("View Conversation", appUrl("/profile", userId))}
  `)
  await send(to, "💬 Support Reply from Foodra", html)
}

// ─── 17. Escrow payment failed ────────────────────────────────────────────────
export async function sendPaymentFailedEmail(
  to: string, name: string, orderId: string, reason?: string,
  userId?: string,
  items?: { name: string; qty: number; price: number }[],
  total?: number
) {
  const itemRows = items?.map(i =>
    `<tr>
      <td style="padding:8px 0;font-size:14px;color:#333;border-bottom:1px solid #f0f0f0;">${i.name}</td>
      <td style="padding:8px 0;font-size:14px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0;">×${i.qty}</td>
      <td style="padding:8px 0;font-size:14px;color:#333;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">₦${(i.price * i.qty).toLocaleString()}</td>
    </tr>`
  ).join("") ?? ""

  const html = layout(`
    ${heading("Payment Not Completed ⚠️")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your payment for order <strong>#${orderId.slice(-8).toUpperCase()}</strong> was not completed.
    </p>
    ${reason ? `<div style="background:#fee2e2;border-left:4px solid #b91c1c;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#b91c1c;"><strong>Reason:</strong> ${reason}</p>
    </div>` : ""}
    ${items?.length ? `
    <p style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Items in Your Cart</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <th style="text-align:left;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;border-bottom:2px solid #e8f0e0;">Item</th>
        <th style="text-align:center;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;border-bottom:2px solid #e8f0e0;">Qty</th>
        <th style="text-align:right;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;border-bottom:2px solid #e8f0e0;">Amount</th>
      </tr>
      ${itemRows}
    </table>
    ${total ? moneyBox([{ label: "Total (NGN)", value: `₦${total.toLocaleString()}`, bold: true }]) : ""}` : ""}
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;">Your cart items are saved. Return to complete your purchase anytime.</p>
    </div>
    ${btn("Return to Cart", appUrl("/shop", userId))}
  `)
  await send(to, `⚠️ Payment Not Completed — Order #${orderId.slice(-8).toUpperCase()}`, html)
}

// ─── 18. Membership tier upgrade ──────────────────────────────────────────────
const TIER_EMOJIS: Record<string, string> = { Seed: "🌱", Sprout: "🌿", Grower: "🌾", Harvester: "🏆", Champion: "⭐" }
const TIER_PERKS: Record<string, string> = {
  Sprout:    "You're building a presence on Foodra. Keep completing orders to level up.",
  Grower:    "You're an active and trusted community member. Keep it up!",
  Harvester: "You're a highly trusted member of Foodra. Almost at the top!",
  Champion:  "You've reached the highest tier! Enjoy a <strong>5% discount</strong> on all future purchases.",
}

export async function sendMembershipUpgradeEmail(to: string, name: string, newTier: string, score: number, userId?: string) {
  const emoji = TIER_EMOJIS[newTier] ?? "🎉"
  const perk = TIER_PERKS[newTier] ?? "Keep engaging to unlock more benefits."
  const html = layout(`
    ${heading(`You've Reached ${newTier} Tier! ${emoji}`)}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your Foodra membership score has grown and you've been promoted!
    </p>
    <div style="background:linear-gradient(135deg,#1a6b2e,#2d9e4f);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:40px;">${emoji}</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-top:8px;">${newTier}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Score: ${score} / 100</div>
    </div>
    <p style="color:#555;font-size:14px;line-height:1.7;">${perk}</p>
    ${btn("View My Profile", appUrl("/profile", userId))}
  `)
  await send(to, `${emoji} You've reached ${newTier} tier on Foodra!`, html)
}

// ─── 19. Dispute resolved by admin ────────────────────────────────────────────
export async function sendDisputeResolvedEmail(to: string, name: string, orderId: string, userId?: string) {
  const html = layout(`
    ${heading("Dispute Resolved ⚖️")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your dispute for order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been reviewed and resolved. Please check your order for the updated payment status.
    </p>
    ${btn("View Order", appUrl(`/orders/${orderId}`, userId))}
  `)
  await send(to, `⚖️ Dispute Resolved — Order #${orderId.slice(-8).toUpperCase()}`, html)
}

// ─── 20. Crypto send confirmation ────────────────────────────────────────────
export async function sendCryptoSentEmail(
  to: string, name: string,
  amount: string, token: string,
  toAddress: string, toName: string | null,
  txHash: string | null,
  ngnEquiv: number | null,
  userId?: string
) {
  const explorerUrl = txHash ? `https://sepolia.basescan.org/tx/${txHash}` : null
  const html = layout(`
    ${heading("Crypto Sent Successfully ✅")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your transfer has been confirmed on the blockchain.
    </p>
    ${moneyBox([
      { label: "Amount Sent", value: `${amount} ${token}`, bold: true, green: true },
      ...(ngnEquiv ? [{ label: "NGN Equivalent", value: `≈ ₦${ngnEquiv.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }] : []),
      { label: "To", value: toName ? `${toName} (${toAddress.slice(0, 8)}...${toAddress.slice(-6)})` : `${toAddress.slice(0, 10)}...${toAddress.slice(-8)}` },
      { label: "Network", value: "Base Sepolia (Testnet)" },
      ...(txHash ? [{ label: "Tx Hash", value: `${txHash.slice(0, 12)}...${txHash.slice(-8)}` }] : []),
    ])}
    ${receiptBlock([
      { label: "Amount", value: `${amount} ${token}`, bold: true, green: true },
      ...(ngnEquiv ? [{ label: "NGN Equiv", value: `₦${ngnEquiv.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }] : []),
      { label: "To", value: toName ?? `${toAddress.slice(0, 10)}...${toAddress.slice(-6)}` },
      { label: "Network", value: "Base Sepolia" },
      ...(txHash ? [{ label: "Tx Hash", value: `${txHash.slice(0, 12)}...${txHash.slice(-8)}` }] : []),
    ], txHash ? `TX-${txHash.slice(-10).toUpperCase()}` : `TX-${Date.now().toString(36).toUpperCase()}`)}
    ${explorerUrl ? `<div style="text-align:center;margin:16px 0;">
      <a href="${explorerUrl}" style="color:#1a6b2e;font-size:13px;text-decoration:underline;">View on Basescan →</a>
    </div>` : ""}
    <div style="background:#f8faf5;border-left:4px solid #1a6b2e;padding:14px 18px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#555;">Keep this email as your proof of transfer.</p>
    </div>
    ${btn("View Wallet", appUrl("/wallet", userId))}
  `)
  await send(to, `✅ You sent ${amount} ${token} on Foodra`, html)
}
