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
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a6b2e 0%,#2d9e4f 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🌱 Foodra</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Empowering African Farmers</div>
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

function heading(icon: string, title: string) {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">${icon} ${title}</h1>`
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
    <td style="padding:8px 0;font-size:14px;color:#666;width:140px;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#1a1a1a;font-weight:600;">${value}</td>
  </tr>`
}

function tag(text: string, color = "#1a6b2e", bg = "#e8f5ed") {
  return `<span style="display:inline-block;background:${bg};color:${color};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.5px;">${text}</span>`
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

// ─── 1. Welcome ───────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  const html = layout(`
    ${heading("👋", `Welcome to Foodra, ${name}!`)}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0;">
      You're now part of a movement reshaping African agriculture. Whether you're here to buy fresh produce, sell your harvest, or grow your farm — Foodra is your platform.
    </p>
    ${divider()}
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      <tr>
        <td style="padding:12px;background:#f8faf5;border-radius:12px;text-align:center;">
          <div style="font-size:28px;">🛒</div>
          <div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-top:6px;">Marketplace</div>
          <div style="font-size:12px;color:#888;">Buy & sell produce</div>
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
          <div style="font-size:12px;color:#888;">Learn & grow</div>
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
export async function sendOrderConfirmationEmail(to: string, name: string, orderId: string, total: number, items: { name: string; qty: number; price: number }[]) {
  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:10px 0;font-size:14px;color:#333;border-bottom:1px solid #f0f0f0;">${i.name}</td>
      <td style="padding:10px 0;font-size:14px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0;">x${i.qty}</td>
      <td style="padding:10px 0;font-size:14px;color:#1a6b2e;font-weight:600;text-align:right;border-bottom:1px solid #f0f0f0;">₦${(i.price * i.qty).toLocaleString()}</td>
    </tr>`
  ).join("")

  const html = layout(`
    ${heading("🛒", "Order Confirmed!")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your order has been placed successfully and is now being processed by the farmer(s).
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
        <th style="text-align:right;padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e8f0e0;">Amount</th>
      </tr>
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:12px 0;font-size:15px;font-weight:700;color:#1a1a1a;">Total</td>
        <td style="padding:12px 0;font-size:15px;font-weight:700;color:#1a6b2e;text-align:right;">₦${total.toLocaleString()}</td>
      </tr>
    </table>
    ${btn("Track Your Order", `https://foodramarket.com/orders/${orderId}`)}
  `)
  await send(to, `Order Confirmed #${orderId.slice(-8).toUpperCase()} ✅`, html)
}

// ─── 3. Order status update (buyer) ──────────────────────────────────────────
const statusConfig: Record<string, { icon: string; title: string; message: string; tagColor: string; tagBg: string }> = {
  Processing: { icon: "⚙️", title: "Order is Being Processed", message: "Great news! The farmer has confirmed your order and is preparing it for dispatch.", tagColor: "#b45309", tagBg: "#fef9c3" },
  Shipped:    { icon: "🚚", title: "Your Order is On the Way!", message: "Your order has been shipped and is heading your way. Sit tight!", tagColor: "#1d4ed8", tagBg: "#dbeafe" },
  Delivered:  { icon: "🎉", title: "Order Delivered!", message: "Your order has been delivered. We hope you love it! Don't forget to leave a review.", tagColor: "#166534", tagBg: "#dcfce7" },
  Cancelled:  { icon: "❌", title: "Order Cancelled", message: "Your order has been cancelled. If you have any questions, please contact support.", tagColor: "#b91c1c", tagBg: "#fee2e2" },
}

export async function sendOrderStatusEmail(to: string, name: string, orderId: string, status: string) {
  const cfg = statusConfig[status]
  if (!cfg) return
  const html = layout(`
    ${heading(cfg.icon, cfg.title)}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, ${cfg.message}
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Order ID", `#${orderId.slice(-8).toUpperCase()}`)}
        ${infoRow("Status", tag(status, cfg.tagColor, cfg.tagBg))}
      </table>
    </div>
    ${btn("View Order Details", `https://foodramarket.com/orders/${orderId}`)}
  `)
  await send(to, `Your order is ${status} ${cfg.icon}`, html)
}

// ─── 4. New order for farmer ──────────────────────────────────────────────────
export async function sendFarmerNewOrderEmail(to: string, farmerName: string, orderId: string, items: { name: string; qty: number }[], total: number) {
  const itemList = items.map(i => `<li style="padding:4px 0;font-size:14px;color:#333;">${i.name} — <strong>x${i.qty}</strong></li>`).join("")
  const html = layout(`
    ${heading("🧑‍🌾", `New Order Received, ${farmerName}!`)}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      You have a new order waiting for you. Please process and ship it promptly to keep buyers happy.
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Order ID", `#${orderId.slice(-8).toUpperCase()}`)}
        ${infoRow("Total Value", `₦${total.toLocaleString()}`)}
      </table>
    </div>
    <p style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Items Ordered</p>
    <ul style="margin:0;padding-left:20px;">${itemList}</ul>
    ${btn("Manage Order in Dashboard", `https://foodramarket.com/sales`)}
  `)
  await send(to, `🧑‍🌾 New order #${orderId.slice(-8).toUpperCase()} — ₦${total.toLocaleString()}`, html)
}

// ─── 5. Funding submitted ─────────────────────────────────────────────────────
export async function sendFundingSubmittedEmail(to: string, name: string, amount: number, score: number, tier: string) {
  const tierColors: Record<string, [string, string]> = {
    Excellent: ["#166534", "#dcfce7"], Good: ["#1d4ed8", "#dbeafe"],
    Fair: ["#b45309", "#fef9c3"], Poor: ["#b91c1c", "#fee2e2"],
  }
  const [tc, tb] = tierColors[tier] ?? ["#555", "#f0f0f0"]
  const html = layout(`
    ${heading("💰", "Funding Application Received!")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your funding application has been successfully submitted. Our team will review it and get back to you within <strong>5–7 business days</strong>.
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Amount Requested", `₦${amount.toLocaleString()}`)}
        ${infoRow("Credit Score", `${score}/100`)}
        ${infoRow("Credit Tier", tag(tier, tc, tb))}
        ${infoRow("Status", tag("Under Review", "#b45309", "#fef9c3"))}
      </table>
    </div>
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;">💡 <strong>Tip:</strong> A higher credit score improves your chances. Complete your profile and add more farm details to boost your score.</p>
    </div>
    ${btn("View My Application", "https://foodramarket.com/funding")}
  `)
  await send(to, "Funding Application Submitted 📋", html)
}

// ─── 6. Funding decision ──────────────────────────────────────────────────────
export async function sendFundingDecisionEmail(to: string, name: string, status: "Approved" | "Rejected", amount: number, note?: string) {
  const approved = status === "Approved"
  const html = layout(`
    ${heading(approved ? "🎉" : "📋", approved ? "Congratulations! Funding Approved!" : "Funding Application Update")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, ${approved
        ? `we're thrilled to inform you that your funding application for <strong>₦${amount.toLocaleString()}</strong> has been <strong style="color:#1a6b2e;">approved!</strong> Our team will be in touch with the next steps.`
        : `after careful review, we were unable to approve your application for ₦${amount.toLocaleString()} at this time.`}
    </p>
    ${approved ? `
    <div style="background:#dcfce7;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;">🌱</div>
      <div style="font-size:18px;font-weight:700;color:#166534;margin-top:8px;">₦${amount.toLocaleString()} Approved</div>
      <div style="font-size:13px;color:#4d7c0f;margin-top:4px;">Funds will be disbursed per our agreement terms</div>
    </div>` : `
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:24px;">
      ${note ? `${infoRow("Reason", note)}` : ""}
      <p style="margin:8px 0 0;font-size:13px;color:#666;">You may re-apply after 90 days with an improved profile.</p>
    </div>`}
    ${btn(approved ? "View My Funding" : "Improve & Reapply", "https://foodramarket.com/funding")}
  `)
  await send(to, approved ? "🎉 Your Funding Application is Approved!" : "Funding Application Update", html)
}

// ─── 7. Training enrollment ───────────────────────────────────────────────────
export async function sendTrainingEnrollmentEmail(to: string, name: string, trainingTitle: string, trainingId: string) {
  const html = layout(`
    ${heading("📚", "Training Enrollment Confirmed!")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, you're officially enrolled! Get ready to learn and level up your farming skills.
    </p>
    <div style="background:linear-gradient(135deg,#1a6b2e,#2d9e4f);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;">🎓</div>
      <div style="font-size:18px;font-weight:700;color:#fff;margin-top:8px;">${trainingTitle}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">You are enrolled</div>
    </div>
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;">📅 Check the training page for dates, times, and joining instructions.</p>
    </div>
    ${btn("View Training Details", `https://foodramarket.com/training/${trainingId}`)}
  `)
  await send(to, `Enrolled: ${trainingTitle} 🎓`, html)
}

// ─── 8. Dispute submitted ─────────────────────────────────────────────────────
export async function sendDisputeSubmittedEmail(to: string, name: string, orderId: string, reason: string) {
  const html = layout(`
    ${heading("⚖️", "Dispute Submitted")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, your dispute has been received. Our team will review it within <strong>3–5 business days</strong> and contact you with the outcome.
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Order ID", `#${orderId.slice(-8).toUpperCase()}`)}
        ${infoRow("Reason", reason)}
        ${infoRow("Status", tag("Under Review", "#b45309", "#fef9c3"))}
      </table>
    </div>
    ${btn("View Order", `https://foodramarket.com/orders/${orderId}`)}
  `)
  await send(to, `Dispute Received — Order #${orderId.slice(-8).toUpperCase()} ⚖️`, html)
}

// ─── 9. Contact form confirmation ─────────────────────────────────────────────
export async function sendContactConfirmationEmail(to: string, name: string, subject: string) {
  const html = layout(`
    ${heading("✉️", "We Got Your Message!")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, thanks for reaching out! We've received your message and our team will respond within <strong>24–48 hours</strong>.
    </p>
    <div style="background:#f8faf5;border-radius:12px;padding:20px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${infoRow("Subject", subject || "General Inquiry")}
        ${infoRow("Status", tag("Received ✓", "#166534", "#dcfce7"))}
      </table>
    </div>
    ${divider()}
    <p style="font-size:13px;color:#888;text-align:center;">Need urgent help? Email us directly at <a href="mailto:support@foodramarket.com" style="color:#1a6b2e;">support@foodramarket.com</a></p>
  `)
  await send(to, "We received your message ✉️", html)
}

// ─── 10. Admin broadcast ──────────────────────────────────────────────────────
export async function sendAdminMessageEmail(to: string, name: string, message: string) {
  const html = layout(`
    ${heading("📣", "Message from Foodra")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">Hi <strong>${name}</strong>,</p>
    <div style="background:#f8faf5;border-radius:12px;padding:24px;border-left:4px solid #1a6b2e;font-size:15px;color:#333;line-height:1.8;">
      ${message}
    </div>
    ${divider()}
    <p style="font-size:13px;color:#888;text-align:center;">This message was sent by the Foodra team. Reply to <a href="mailto:support@foodramarket.com" style="color:#1a6b2e;">support@foodramarket.com</a> if you have questions.</p>
  `)
  await send(to, "📣 Message from Foodra Team", html)
}

// ─── 11. Wishlist price alert ─────────────────────────────────────────────────
export async function sendPriceAlertEmail(to: string, name: string, productName: string, oldPrice: number, newPrice: number, productId: string) {
  const saving = oldPrice - newPrice
  const pct = Math.round((saving / oldPrice) * 100)
  const html = layout(`
    ${heading("🔔", "Price Drop Alert!")}
    <p style="color:#555;font-size:15px;line-height:1.7;margin:16px 0 24px;">
      Hi <strong>${name}</strong>, great news! A product on your wishlist just dropped in price.
    </p>
    <div style="background:linear-gradient(135deg,#065f46,#059669);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <div style="font-size:14px;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;">${productName}</div>
      <div style="margin:12px 0;display:flex;align-items:center;justify-content:center;gap:12px;">
        <span style="font-size:18px;color:rgba(255,255,255,0.5);text-decoration:line-through;">₦${oldPrice.toLocaleString()}</span>
        <span style="font-size:32px;font-weight:800;color:#fff;">₦${newPrice.toLocaleString()}</span>
      </div>
      <div style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:700;">
        You save ₦${saving.toLocaleString()} (${pct}% off)
      </div>
    </div>
    ${btn("Buy Now Before Price Goes Up", `https://foodramarket.com/marketplace/${productId}`)}
  `)
  await send(to, `🔔 Price Drop: ${productName} is now ₦${newPrice.toLocaleString()}`, html)
}
