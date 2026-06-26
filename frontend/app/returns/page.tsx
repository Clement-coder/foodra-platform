import type { Metadata } from "next"
import Link from "next/link"
import {
  RefreshCw, AlertTriangle, Clock, ShieldCheck,
  PackageX, Mail, Info, CreditCard, MessageSquare,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Returns & Refunds Policy | Foodra",
  description: "Foodra's Returns and Refunds Policy — how to raise disputes, request refunds, and resolve order issues.",
  alternates: { canonical: "https://foodramarket.com/returns" },
}

const sections = [
  {
    icon: Info,
    title: "1. Overview",
    body: [
      "Foodra is the sole merchant on this platform. All products are owned, managed, and fulfilled directly by Foodra. This Returns & Refunds Policy governs how we handle disputes, damaged goods, incorrect orders, and refund requests.",
      "Because Foodra sells fresh agricultural commodities — which are perishable by nature — returns in the traditional retail sense are generally not applicable. Instead, Foodra handles issues through a structured dispute and refund process.",
      "By placing an order on Foodra, you agree to the terms set out in this policy.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "2. Our Commitment",
    body: [
      "Foodra is committed to ensuring every buyer receives the quality of goods they ordered. We conduct quality checks before dispatch to minimise errors and spoilage.",
      "Where Foodra is responsible for a problem with your order — whether due to incorrect fulfilment, significant quality failure, or non-delivery — we will make it right through a replacement, partial refund, or full wallet credit.",
      "We aim to resolve all disputes within 5 business days of submission.",
    ],
  },
  {
    icon: PackageX,
    title: "3. Eligible Dispute Reasons",
    body: [
      "You may raise a dispute and request a refund or replacement in the following circumstances: (a) You received the wrong product(s). (b) Your order was significantly below the advertised quality (e.g. heavily spoiled, rotten, or inedible on arrival). (c) Your order quantity was materially short of what you paid for. (d) Your order was marked 'Delivered' but was never received.",
      "Minor natural variations in fresh produce (colour, size, texture) are expected and do not constitute grounds for a refund.",
      "Disputes raised due to buyer change of mind, incorrect delivery address provided by the buyer, or refusal to pay the separate delivery fee are not eligible for a refund.",
      "If you receive goods you believe are dangerous or unfit for human consumption, do not consume them and contact us immediately at support@foodramarket.com.",
    ],
  },
  {
    icon: Clock,
    title: "4. Dispute Window",
    body: [
      "All disputes must be raised within 7 days of your order being marked 'Delivered' in the app.",
      "Disputes raised after 7 days from the delivery date will not be eligible for a refund or replacement, except in exceptional circumstances at Foodra's sole discretion.",
      "If your order has been in 'Shipped' status for more than 7 days beyond the estimated delivery date without being delivered, please contact us immediately — do not wait for the 7-day window to start.",
    ],
  },
  {
    icon: MessageSquare,
    title: "5. How to Raise a Dispute",
    body: [
      "Step 1: Go to your Orders page at foodramarket.com/orders and open the affected order.",
      "Step 2: Click 'Raise a Dispute' on the order detail page.",
      "Step 3: Select the reason for your dispute from the available options and provide a clear written description of the problem.",
      "Step 4: Attach photographic evidence where applicable (e.g. photos of damaged or incorrect goods).",
      "Step 5: Submit. You will receive a confirmation notification and email. Our admin team will review your case and respond within 5 business days.",
      "Do not raise a dispute directly via email or social media — disputes must be submitted through the platform to be properly tracked and resolved.",
    ],
  },
  {
    icon: RefreshCw,
    title: "6. Refund Process",
    body: [
      "If your dispute is upheld, Foodra will issue a refund to your Foodra wallet balance. Wallet refunds are typically processed within 1–2 business days of the dispute resolution decision.",
      "Refunds are issued to your Foodra NGN wallet — not directly to your bank or card. Once in your wallet, you may use the balance for future purchases or withdraw it to your bank account via the Wallet page.",
      "In cases of partial fulfilment (e.g. you received 8 kg instead of 10 kg), a proportional wallet credit will be issued.",
      "In cases of full non-delivery or complete order error, a full wallet credit equal to the amount you paid will be issued.",
      "Delivery fees paid to the logistics partner at the point of delivery are not refundable by Foodra, as these are charged by a third-party logistics provider.",
    ],
  },
  {
    icon: CreditCard,
    title: "7. Cancellations",
    body: [
      "You may cancel an order only if it is still in 'Pending' status (i.e. before Foodra begins processing it). To cancel, contact support@foodramarket.com immediately with your order ID.",
      "Once an order moves to 'Processing' or beyond, it cannot be cancelled as goods are already being prepared for dispatch.",
      "If a cancellation is approved, your wallet will be refunded in full within 1–2 business days.",
      "Foodra reserves the right to cancel an order at any time due to stock issues, quality failures, or logistical constraints. In such cases, you will be notified and your wallet will be refunded in full.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "8. Non-Refundable Situations",
    body: [
      "Refunds will not be issued in the following situations: (a) Buyer provided an incorrect delivery address. (b) Buyer refused to accept delivery. (c) Buyer failed to raise a dispute within the 7-day window. (d) Dispute reason is buyer's change of mind. (e) Minor quality variations that are natural to fresh agricultural produce.",
      "⚠️ Delivery fees charged by the logistics partner at the point of delivery are the buyer's sole responsibility and are not refundable under any circumstances.",
    ],
  },
  {
    icon: Mail,
    title: "9. Contact & Escalation",
    body: [
      "For disputes, refund enquiries, or order issues, contact: support@foodramarket.com. Please include your order ID and a brief description of the issue.",
      "Our support team operates Monday to Friday, 9am–6pm WAT. We aim to respond within 24 business hours.",
      "If you are dissatisfied with the outcome of a dispute, you may escalate by replying to the dispute resolution email with additional evidence. Escalated cases will be reviewed by a senior team member.",
    ],
  },
]

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-8 md:p-12 mb-10">
          <div className="absolute -right-10 -top-8 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-lime-100/60 dark:bg-[#118C4C]/5 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#118C4C] mb-5">
              <RefreshCw className="h-3.5 w-3.5" /> Refunds
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Returns &amp; Refunds Policy</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              How Foodra handles disputes, damaged goods, incorrect orders, and refund requests for farm commodity purchases.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Effective: <strong className="text-foreground">June 22, 2026</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Dispute window: <strong className="text-foreground">7 days from delivery</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Refunds to: <strong className="text-foreground">Foodra wallet</strong></span>
            </div>
          </div>
        </div>

        {/* Summary banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-5 mb-8">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Key points:</strong> Disputes must be raised within 7 days of delivery via the Orders page. Approved refunds are credited to your Foodra wallet. Delivery fees are non-refundable. Fresh produce minor variations do not qualify for a refund.
          </p>
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
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
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
            <h3 className="font-semibold text-foreground mb-1">Issue with your order?</h3>
            <p className="text-sm text-muted-foreground">Raise a dispute from your Orders page or email us with your order ID. We respond within 24 business hours.</p>
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
          <Link href="/shipping" className="text-[#118C4C] hover:underline font-medium">Shipping Policy</Link>
          {" · "}
          <Link href="/terms" className="text-[#118C4C] hover:underline font-medium">Terms of Service</Link>
          {" · "}
          <Link href="/privacy" className="text-[#118C4C] hover:underline font-medium">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
