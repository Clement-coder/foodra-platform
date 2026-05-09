import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Eye, Database, Lock, UserCheck, Mail, AlertCircle, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | Foodra",
  description: "Learn how Foodra collects, uses, and protects your personal data. We are committed to transparency and your privacy rights.",
  alternates: { canonical: "https://foodramarket.com/privacy" },
}

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    body: [
      "When you create an account, we collect your name, email address, phone number, and wallet address to identify you on the platform.",
      "When you list or purchase products, we collect listing details, transaction records, delivery addresses, and order history.",
      "We automatically collect usage data such as pages visited, search queries, device type, browser, and IP address to improve platform performance.",
      "If you apply for funding, we collect farm details, financial history, and supporting documents to process your application.",
    ],
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    body: [
      "To create and manage your Foodra account and verify your identity.",
      "To display your product listings to buyers and process marketplace transactions securely.",
      "To evaluate funding applications using our AI credit scoring engine.",
      "To send you important service notifications, order updates, and platform announcements.",
      "To improve our platform features, fix bugs, and personalise your experience.",
      "To comply with applicable Nigerian laws and financial regulations.",
    ],
  },
  {
    icon: Globe,
    title: "Sharing of Information",
    body: [
      "We do not sell, rent, or trade your personal data to third parties.",
      "We share data with trusted service providers (Supabase, Privy, Vercel) solely to operate the platform under strict data processing agreements.",
      "Buyer delivery addresses are shared with the relevant seller only to fulfil your order.",
      "We may disclose information if required by Nigerian law, court order, or to protect the safety of our users.",
    ],
  },
  {
    icon: Lock,
    title: "Data Security",
    body: [
      "All data is encrypted in transit using TLS/HTTPS and at rest using industry-standard encryption.",
      "Wallet authentication is handled by Privy, a non-custodial system — we never store your private keys.",
      "Access to sensitive data is restricted to authorised Foodra personnel only.",
      "We conduct regular security reviews and promptly address any vulnerabilities.",
      "While we apply strong safeguards, no internet system is completely risk-free. We encourage you to use a strong password and keep your wallet secure.",
    ],
  },
  {
    icon: UserCheck,
    title: "Your Rights & Choices",
    body: [
      "You may update your profile information at any time from your account settings.",
      "You may request a copy of the personal data we hold about you by contacting support.",
      "You may request deletion of your account and associated data, subject to legal retention requirements.",
      "You may opt out of non-essential communications by updating your notification preferences.",
      "You have the right to object to processing of your data where we rely on legitimate interests.",
    ],
  },
  {
    icon: AlertCircle,
    title: "Cookies & Tracking",
    body: [
      "We use essential cookies to keep you logged in and maintain your session securely.",
      "We use analytics cookies (Vercel Analytics) to understand how users interact with the platform. No personally identifiable data is shared with analytics providers.",
      "You can disable cookies in your browser settings, though some platform features may not function correctly without them.",
    ],
  },
  {
    icon: Shield,
    title: "Children's Privacy",
    body: [
      "Foodra is not intended for users under the age of 18. We do not knowingly collect personal data from minors.",
      "If you believe a minor has created an account, please contact us immediately at support@foodramarket.com and we will remove the account promptly.",
    ],
  },
  {
    icon: Mail,
    title: "Contact & Updates",
    body: [
      "For any privacy-related requests, questions, or concerns, email us at support@foodramarket.com.",
      "We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice.",
      "Continued use of Foodra after updates constitutes acceptance of the revised policy.",
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-8 md:p-12 mb-10">
          <div className="absolute -right-10 -top-8 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-lime-100/60 dark:bg-[#118C4C]/5 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#118C4C] mb-5">
              <Shield className="h-3.5 w-3.5" /> Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              At Foodra, your privacy matters. This policy explains exactly what data we collect, why we collect it, how we protect it, and the rights you have over your information.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Last updated: <strong className="text-foreground">May 9, 2026</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Applies to: <strong className="text-foreground">foodramarket.com</strong></span>
            </div>
          </div>
        </div>

        {/* Quick summary banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-5 mb-8">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong>Summary:</strong> We collect only what we need to run the platform. We never sell your data. You can request deletion at any time. For questions, email <a href="mailto:support@foodramarket.com" className="underline font-medium">support@foodramarket.com</a>.
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

        {/* Footer CTA */}
        <div className="mt-10 rounded-2xl border border-[#118C4C]/20 bg-[#118C4C]/5 dark:bg-[#118C4C]/10 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Have a privacy concern?</h3>
            <p className="text-sm text-muted-foreground">Our team responds to all privacy requests within 5 business days.</p>
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
          By using Foodra, you agree to this Privacy Policy. See also our{" "}
          <Link href="/terms" className="text-[#118C4C] hover:underline font-medium">Terms of Service</Link>.
        </p>
      </div>
    </div>
  )
}
