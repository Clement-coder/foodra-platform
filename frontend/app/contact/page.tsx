import type { Metadata } from "next"
import { Mail, MapPin, Phone, Clock, Shield, MessageSquare, Handshake, AlertCircle } from "lucide-react"
import GetInTouch from "@/components/GetInTouch"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contact Foodra — Support, Partnerships & Enquiries",
  description: "Contact Foodra for platform support, partnerships, product feedback, or general enquiries. Email us at support@foodramarket.com. We're available Monday to Friday, 9am–6pm WAT. Based in Benue State, Nigeria.",
  alternates: { canonical: "https://foodramarket.com/contact" },
  openGraph: {
    title: "Contact Foodra — Support & Partnerships",
    description: "Reach Foodra's support team at support@foodramarket.com for help with orders, farmer accounts, funding applications, or partnership opportunities.",
    url: "https://foodramarket.com/contact",
    siteName: "Foodra",
    images: [{ url: "https://foodramarket.com/foodra.png", width: 1200, height: 630, alt: "Contact Foodra" }],
    locale: "en_NG",
    type: "website",
  },
}

const sections = [
  {
    icon: Mail,
    title: "Email & Phone",
    body: [
      "General support & enquiries: support@foodramarket.com",
      "Phone: +234 915 700 0181 (Mon – Fri, 9am – 6pm WAT)",
      "We aim to respond to all emails within 1–2 business days.",
      "For urgent financial or order disputes, include your order reference number in the subject line.",
    ],
  },
  {
    icon: MapPin,
    title: "Office & Location",
    body: [
      "Foodra Technologies Ltd is headquartered in Benue State, Nigeria.",
      "We operate across Nigeria and are expanding to other African markets.",
      "In-person visits are by appointment only — please email us to schedule.",
    ],
  },
  {
    icon: MessageSquare,
    title: "Platform Support",
    body: [
      "For help with your account, orders, or listings, use the contact form below.",
      "For funding application queries, include your application reference number.",
      "For wallet or transaction issues, include your wallet address and transaction hash.",
      "For training programme enquiries, include the training title and your enrolled email.",
    ],
  },
  {
    icon: Handshake,
    title: "Partnerships & Collaborations",
    body: [
      "We welcome partnerships with agricultural organisations, NGOs, and government agencies.",
      "If you represent a buyer network or cooperative, reach out to discuss bulk purchasing arrangements.",
      "For media enquiries, press coverage, or speaking opportunities, email support@foodramarket.com.",
      "We are open to collaborations that advance food security and farmer empowerment across Africa.",
    ],
  },
  {
    icon: Shield,
    title: "Trust & Security",
    body: [
      "Foodra is a registered technology company operating in Nigeria under Foodra Technologies Ltd.",
      "We handle financial transactions through blockchain-based escrow — funds are never held by us directly.",
      "We are committed to transparent, secure operations and will never ask for your wallet private key.",
      "For disputes or urgent financial concerns, email support@foodramarket.com with your order reference.",
    ],
  },
  {
    icon: Clock,
    title: "Support Hours",
    body: [
      "Our support team is available Monday to Friday, 9am – 6pm West Africa Time (WAT).",
      "We are closed on Nigerian public holidays.",
      "Outside support hours, you can still submit the contact form and we will respond the next business day.",
      "For critical platform issues, we monitor alerts 24/7 and will address urgent outages promptly.",
    ],
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-8 md:p-12 mb-10">
          <div className="absolute -right-10 -top-8 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-lime-100/60 dark:bg-[#118C4C]/5 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#118C4C] mb-5">
              <Mail className="h-3.5 w-3.5" /> Contact
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Get In Touch</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              Reach out for platform support, partnerships, product feedback, or general inquiries. We're here to help.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Response time: <strong className="text-foreground">1–2 business days</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Hours: <strong className="text-foreground">Mon – Fri, 9am – 6pm WAT</strong></span>
            </div>
          </div>
        </div>

        {/* Summary banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-5 mb-8">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong>Quick contact:</strong> Email <a href="mailto:support@foodramarket.com" className="underline font-medium">support@foodramarket.com</a> or use the form at the bottom of this page. Include your order or application reference for faster resolution.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-5">
          {sections.map((section, index) => (
            <section key={section.title} className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-muted/30">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#118C4C]/10">
                  <section.icon className="h-4 w-4 text-[#118C4C]" />
                </div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">{section.title}</h2>
                <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{index + 1}/{sections.length}</span>
              </div>
              <ul className="px-6 py-5 space-y-3">
                {section.body.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-muted-foreground leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#118C4C] shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Contact form */}
        <div className="mt-8 rounded-2xl overflow-hidden border border-border/60">
          <GetInTouch />
        </div>

        {/* Footer CTA */}
        <div className="mt-8 rounded-2xl border border-[#118C4C]/20 bg-[#118C4C]/5 dark:bg-[#118C4C]/10 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Prefer to email directly?</h3>
            <p className="text-sm text-muted-foreground">Our team responds to all enquiries within 1–2 business days.</p>
          </div>
          <a
            href="mailto:support@foodramarket.com"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#118C4C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d6d3a] transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email Support
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Learn more about us on the{" "}
          <Link href="/about" className="text-[#118C4C] hover:underline font-medium">About page</Link>
          {" "}or read our{" "}
          <Link href="/privacy" className="text-[#118C4C] hover:underline font-medium">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
