import type { Metadata } from "next"
import Link from "next/link"
import {
  Truck, MapPin, Clock, AlertTriangle, Package,
  PhoneCall, Mail, ShieldCheck, Info, CheckCircle,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Shipping Policy | Foodra",
  description: "Foodra ships farm commodities directly to buyers across Nigeria. Learn about our delivery coverage, processing timelines, delivery fees, and fulfilment process. Foodra is the sole merchant — no third-party vendors.",
  alternates: { canonical: "https://foodramarket.com/shipping" },
}

const sections = [
  {
    icon: Info,
    title: "1. Overview",
    body: [
      "Foodra is the sole merchant on this platform. All agricultural commodities listed are owned and managed by Foodra. When you place an order, Foodra ships the goods directly to you — there are no third-party sellers or vendors involved in fulfilment.",
      "This Shipping Policy applies to all orders placed on foodramarket.com and governs how your order is processed, dispatched, and delivered.",
      "By placing an order on Foodra, you agree to the terms set out in this Shipping Policy.",
    ],
  },
  {
    icon: MapPin,
    title: "2. Delivery Coverage",
    body: [
      "Foodra currently delivers to locations across Nigeria. Delivery availability may vary by state and local government area depending on logistics partner coverage.",
      "During checkout, you will be asked to provide your full delivery address. If your location falls outside our current delivery zone, you will be notified before payment is processed.",
      "We are actively expanding our delivery coverage. If your area is not currently covered, please contact support@foodramarket.com to express interest and be notified when coverage is extended.",
      "International shipping is not currently available.",
    ],
  },
  {
    icon: Clock,
    title: "3. Processing & Delivery Timelines",
    body: [
      "Orders are processed within 1–2 business days of confirmed payment. You will receive an in-app notification and email confirmation once your order is dispatched.",
      "Estimated delivery timelines from dispatch are: Lagos — 1–2 business days; South-West Nigeria — 2–3 business days; South-East & South-South — 3–5 business days; North-Central, North-West & North-East — 4–6 business days.",
      "Timelines are estimates and may be affected by logistics partner capacity, weather, public holidays, or other circumstances beyond Foodra's control.",
      "You will receive real-time order status updates (Pending → Processing → Shipped → Delivered) via in-app notifications and email.",
      "If your order has not been delivered within the estimated window, please contact support@foodramarket.com with your order ID.",
    ],
  },
  {
    icon: Package,
    title: "4. Delivery Fees",
    body: [
      "⚠️ Delivery fees are NOT included in the product price displayed on the platform, nor are they included in the wallet payment amount charged at checkout.",
      "Delivery fees are charged separately by our logistics partner at the point of delivery. You will be informed of the applicable delivery fee before your item arrives.",
      "Delivery fees vary based on your location, the weight and volume of your order, and the logistics partner assigned to your delivery.",
      "Foodra is not responsible for any disputes arising from delivery fee amounts charged by the logistics partner. For concerns, contact support@foodramarket.com.",
    ],
  },
  {
    icon: Truck,
    title: "5. Fulfilment Process",
    body: [
      "Once your wallet payment is confirmed, your order status moves to 'Pending'. Foodra staff then review, pack, and prepare your goods for dispatch.",
      "Orders are dispatched once quality checks are completed. You will be notified by email and in-app notification when your order is marked 'Shipped' and tracking information (if available) will be provided.",
      "Foodra takes care in packing all agricultural commodities to minimise damage, spoilage, and quality loss in transit. However, fresh produce is perishable in nature and minor condition variations may occur.",
      "If your delivery address is inaccessible or if the courier cannot reach you at the time of delivery, a re-delivery attempt will be made. After two failed attempts, the order may be cancelled and your wallet credited.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "6. Order Tracking",
    body: [
      "You can track your order status at any time from your Orders page at foodramarket.com/orders.",
      "Order statuses are: Pending (payment confirmed, order being prepared), Processing (order packed, awaiting dispatch), Shipped (order handed to logistics partner), Delivered (order received by buyer).",
      "For orders with courier tracking numbers, the tracking reference will be shared via email and in-app notification once available.",
      "If your order status has not updated for more than 3 business days after being marked 'Shipped', please contact us immediately.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "7. Damaged or Incorrect Goods",
    body: [
      "If your order arrives damaged, spoiled beyond reasonable expectation, or does not match what you ordered, you must raise a dispute through your order detail page within 7 days of delivery.",
      "Please provide clear photographs and a written description of the issue when raising a dispute. This helps us resolve your case as quickly as possible.",
      "Foodra will review the dispute and, where valid, offer a replacement, partial refund, or full wallet credit as appropriate.",
      "Disputes raised after 7 days of delivery may not be eligible for a remedy.",
    ],
  },
  {
    icon: PhoneCall,
    title: "8. Contact & Support",
    body: [
      "For all shipping-related queries, please contact our support team at support@foodramarket.com with your order ID and a brief description of your issue.",
      "Our support team operates Monday to Friday, 9am–6pm WAT. We aim to respond to all enquiries within 24 business hours.",
    ],
  },
]

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-8 md:p-12 mb-10">
          <div className="absolute -right-10 -top-8 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-lime-100/60 dark:bg-[#118C4C]/5 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#118C4C] mb-5">
              <Truck className="h-3.5 w-3.5" /> Delivery
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Shipping Policy</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              Everything you need to know about how Foodra processes, ships, and delivers your farm commodity orders across Nigeria.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Effective: <strong className="text-foreground">June 22, 2026</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Coverage: <strong className="text-foreground">Nigeria</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Merchant: <strong className="text-foreground">Foodra (direct fulfilment)</strong></span>
            </div>
          </div>
        </div>

        {/* Delivery fee warning */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-5 mb-8">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Important:</strong> Delivery fees are <strong>not included</strong> in your order total or wallet payment. They are charged separately by the logistics partner upon delivery and are the buyer's responsibility.
          </p>
        </div>

        {/* Quick facts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Clock, label: "Processing", value: "1–2 business days" },
            { icon: Truck, label: "Delivery", value: "1–6 business days" },
            { icon: MapPin, label: "Coverage", value: "Nationwide (NG)" },
            { icon: CheckCircle, label: "Fulfilment", value: "Direct by Foodra" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-border/60 bg-card p-4 text-center">
              <Icon className="h-5 w-5 text-[#118C4C] mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Table of Contents */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Table of Contents</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 list-none">
            {sections.map((s) => (
              <li key={s.title}>
                <a href={`#${s.title.replace(/\s+/g, "-").toLowerCase()}`} className="text-sm text-[#118C4C] hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-5">
          {sections.map((section, index) => (
            <section
              key={section.title}
              id={section.title.replace(/\s+/g, "-").toLowerCase()}
              className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-muted/30">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#118C4C]/10">
                  <section.icon className="h-4 w-4 text-[#118C4C]" />
                </div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">{section.title}</h2>
                <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{index + 1}/{sections.length}</span>
              </div>
              <ul className="px-6 py-5 space-y-3">
                {section.body.map((point, i) => {
                  const isWarning = point.startsWith("⚠️")
                  const text = isWarning ? point.replace("⚠️ ", "") : point
                  if (isWarning) {
                    return (
                      <li key={i} className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
                        <span className="text-base flex-shrink-0">🚚</span>
                        <span className="text-sm md:text-base text-amber-800 dark:text-amber-300 leading-relaxed font-medium">{text}</span>
                      </li>
                    )
                  }
                  return (
                    <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-muted-foreground leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#118C4C] shrink-0" />
                      {point}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-10 rounded-2xl border border-[#118C4C]/20 bg-[#118C4C]/5 dark:bg-[#118C4C]/10 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Shipping question?</h3>
            <p className="text-sm text-muted-foreground">Contact our support team with your order ID. We respond within 24 business hours.</p>
          </div>
          <a
            href="mailto:support@foodramarket.com"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#118C4C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d6d3a] transition-colors"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          See also:{" "}
          <Link href="/returns" className="text-[#118C4C] hover:underline font-medium">Returns Policy</Link>
          {" · "}
          <Link href="/terms" className="text-[#118C4C] hover:underline font-medium">Terms of Service</Link>
          {" · "}
          <Link href="/privacy" className="text-[#118C4C] hover:underline font-medium">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
