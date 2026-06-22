import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield, Eye, Database, Lock, UserCheck, Mail, AlertCircle,
  Globe, Server, Cookie, Baby, RefreshCw, FileSearch, Smartphone,
  ShieldAlert, Banknote, Share2,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | Foodra",
  description: "How Foodra collects, uses, stores, and protects your personal data. Your rights under the Nigeria Data Protection Act 2023.",
  alternates: { canonical: "https://foodramarket.com/privacy" },
}

const sections = [
  {
    icon: Database,
    title: "1. Information We Collect",
    body: [
      "Account & Identity Data — When you register, we collect your name, email address, phone number, and profile photo to create and verify your account.",
      "Financial & Wallet Data — When using the NGN wallet we collect transaction amounts, recipient Foodra Tags, bank account numbers (for withdrawals), and wallet balance records.",
      "Marketplace Data — When you list or purchase products we collect product descriptions, pricing, order details, delivery addresses, and seller/buyer correspondence.",
      "Funding Application Data — When you apply for funding we collect farm details, declared income, financial history, business documents, and responses to the AI credit scoring questionnaire.",
      "Training Data — We record your training enrollments, attendance, and completion status.",
      "Device & Usage Data — We automatically collect your IP address, browser type, device model, operating system, pages visited, search queries, click paths, and session duration to improve the platform.",
      "Communications — When you contact our support team or use in-app messaging, we store those communications to handle your request and improve our services.",
      "Payment & Transaction Metadata — Paystack provides us with payment status, reference codes, and payment method type (card/bank transfer). We do not store full card numbers — these are handled exclusively by Paystack.",
      "Push Notification Tokens — If you enable push notifications, we store your device push token to deliver service alerts.",
      "Inferred Data — We may infer preferences, membership tier, and engagement level based on your platform activity.",
    ],
  },
  {
    icon: Eye,
    title: "2. How We Use Your Information",
    body: [
      "Account Management — To create, verify, and manage your Foodra account and authenticate your identity.",
      "Marketplace Operations — To display your listings to buyers, process orders, manage escrow, coordinate delivery, and handle disputes.",
      "Wallet Services — To process wallet top-ups, peer transfers, and bank withdrawals via Paystack on your behalf.",
      "Funding Assessment — To evaluate your funding application using our AI credit scoring engine and to share relevant data with funding partners with your consent.",
      "Training Delivery — To manage enrollments, send session reminders, and track your training progress.",
      "Platform Improvement — To analyse usage patterns, diagnose bugs, and develop new features.",
      "Communication — To send you order confirmations, transaction receipts, security alerts, account notifications, and optional marketing communications (with your consent).",
      "Legal Compliance — To comply with the Nigeria Data Protection Act 2023 (NDPA), Financial Reporting Council requirements, and other applicable regulations.",
      "Fraud Prevention & Security — To detect, investigate, and prevent fraudulent transactions, account abuse, and security incidents.",
      "AI Credit Scoring — To generate an explainable credit score (0–100) based on your submitted farm and financial data. This score is used solely for funding application support and is never sold.",
    ],
  },
  {
    icon: Share2,
    title: "3. Sharing of Your Information",
    body: [
      "We never sell, rent, or trade your personal data to any third party for their own marketing purposes.",
      "Service Providers — We share data with carefully vetted service providers who help us operate the platform: Supabase (database hosting), Privy (authentication), Paystack (payment processing), Vercel (hosting and analytics). All providers are bound by data processing agreements.",
      "Sellers & Buyers — Your delivery address is shared with the relevant seller solely to fulfil your order. Your Foodra Tag and first name are visible to users you transact with.",
      "Funding Partners — With your explicit consent at the point of application, we share your credit score, farm details, and supporting documents with the relevant funding partner.",
      "Legal & Regulatory Disclosure — We may disclose your information if required by a court order, law enforcement request, regulatory authority, or to comply with applicable Nigerian law.",
      "Business Transfers — In the event of a merger, acquisition, or sale of Foodra's assets, your data may be transferred to the acquiring entity. We will notify you before such transfer and give you the opportunity to delete your account.",
      "Aggregate & Anonymised Data — We may share non-personally identifiable, aggregated statistics about platform usage with partners, investors, or the public. This data cannot identify you.",
    ],
  },
  {
    icon: Lock,
    title: "4. Data Security",
    body: [
      "All data transmitted between your device and our servers is encrypted using TLS 1.2+ (HTTPS). We enforce HTTPS across all platform endpoints.",
      "Data at rest in our Supabase database is encrypted using AES-256 encryption.",
      "Wallet PIN — Your wallet transaction PIN is hashed using bcrypt. We never store or have access to your raw PIN.",
      "Authentication — Identity authentication is managed by Privy using industry-standard OAuth 2.0 and passkey methods. We do not store passwords.",
      "Access Controls — Access to production data is restricted to authorised Foodra personnel on a strict need-to-know basis, protected by multi-factor authentication.",
      "Row-Level Security (RLS) — Our database enforces row-level security policies, ensuring users can only access their own data and cannot query other users' records.",
      "Security Monitoring — We log access to sensitive data and monitor for anomalous activity. Suspicious events trigger automated alerts.",
      "Vulnerability Management — We conduct regular security reviews and address discovered vulnerabilities promptly.",
      "Incident Response — In the event of a data breach, we will notify affected users within 72 hours of becoming aware, as required by the NDPA.",
      "No system is 100% secure. While we take strong precautions, we encourage you to use a unique password, enable any available MFA, and never share your wallet PIN.",
    ],
  },
  {
    icon: UserCheck,
    title: "5. Your Rights Under the NDPA 2023",
    body: [
      "Right to Access — You may request a copy of all personal data we hold about you at any time.",
      "Right to Rectification — You may correct inaccurate or incomplete personal data through your profile settings or by contacting us.",
      "Right to Erasure — You may request deletion of your account and personal data. We will process this within 30 days, except where retention is required by law (e.g. financial transaction records).",
      "Right to Data Portability — You may request your data in a structured, machine-readable format.",
      "Right to Object — You may object to the processing of your data where we rely on legitimate interests as a legal basis.",
      "Right to Restrict Processing — You may request that we restrict processing of your data while a dispute about its accuracy or our use of it is resolved.",
      "Right to Withdraw Consent — Where processing is based on your consent (e.g. marketing emails), you may withdraw consent at any time without affecting the lawfulness of prior processing.",
      "Right to Lodge a Complaint — You may lodge a complaint with the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng if you believe your rights have been violated.",
      "To exercise any of these rights, email us at support@foodramarket.com with subject line 'Data Rights Request'. We will respond within 30 days.",
    ],
  },
  {
    icon: Banknote,
    title: "6. Financial Data & Paystack",
    body: [
      "Payment processing for wallet top-ups and withdrawals is handled by Paystack (paystack.com). Paystack is PCI-DSS compliant and licensed by the Central Bank of Nigeria.",
      "We do not store your card number, CVV, or bank account credentials. These are entered directly on Paystack's secure checkout page.",
      "We store only payment metadata: amount, reference code, payment status, and payment method type (e.g. 'card' or 'bank transfer').",
      "Wallet transaction records (transfers, withdrawals, purchases) are retained for a minimum of 7 years as required by Nigerian financial regulations.",
      "If a transaction error occurs, we may access Paystack's records to investigate and reverse incorrect charges.",
    ],
  },
  {
    icon: Server,
    title: "7. Data Retention",
    body: [
      "Account data is retained for the lifetime of your account plus 90 days after deletion, to allow for dispute resolution and legal compliance.",
      "Financial transaction records (wallet credits, debits, order payments) are retained for a minimum of 7 years in compliance with Nigerian financial and tax regulations.",
      "Funding application data is retained for 5 years after the application decision.",
      "Support communications are retained for 2 years.",
      "Usage and analytics data is retained in anonymised form indefinitely for product improvement.",
      "After retention periods expire, data is securely deleted or anonymised.",
    ],
  },
  {
    icon: Cookie,
    title: "8. Cookies & Tracking",
    body: [
      "Essential Cookies — Required to keep you logged in, maintain your session, and protect against CSRF attacks. These cannot be disabled without breaking core functionality.",
      "Preference Cookies — Store your language preference and UI settings across visits.",
      "Analytics Cookies — We use Vercel Analytics to understand how users navigate the platform. This collects aggregated, non-personally-identifiable page view data. No cross-site tracking is performed.",
      "We do not use third-party advertising or retargeting cookies.",
      "You can manage or disable non-essential cookies through your browser settings. Note that disabling cookies may affect some platform features.",
    ],
  },
  {
    icon: Smartphone,
    title: "9. Push Notifications",
    body: [
      "If you grant permission, we send push notifications for: order status updates, wallet transaction alerts, funding application decisions, and important security notices.",
      "You can withdraw notification permission at any time through your device or browser settings, or through your Foodra notification preferences.",
      "We store your push token to deliver notifications. Tokens are deleted when you revoke permission or delete your account.",
    ],
  },
  {
    icon: Globe,
    title: "10. International Transfers",
    body: [
      "Your data is primarily processed and stored on servers located within the European Economic Area (Supabase/Vercel infrastructure). Where data is transferred outside Nigeria, we ensure appropriate safeguards are in place including Standard Contractual Clauses.",
      "Privy (authentication) and Paystack (payments) may process data in their respective infrastructure regions. Both operate under robust data protection frameworks.",
      "By using Foodra, you consent to the transfer of your data as described in this section.",
    ],
  },
  {
    icon: Baby,
    title: "11. Children's Privacy",
    body: [
      "Foodra is not directed at, and does not knowingly collect personal data from, individuals under the age of 18.",
      "If we become aware that a minor has created an account, we will promptly suspend the account and delete all associated data.",
      "If you believe a minor is using Foodra, please notify us immediately at support@foodramarket.com.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "12. AI Credit Scoring & Automated Processing",
    body: [
      "Foodra uses a rule-based AI credit scoring engine to generate a score (0–100) for funding applicants based on declared farm and financial data.",
      "The score is explainable — you can view the breakdown of factors contributing to your score from your funding application page.",
      "The credit score is a decision-support tool for funding partners. The final funding decision is made by a human reviewer at the funding partner, not automatically by the AI system.",
      "You have the right to request a human review of any automated assessment that significantly affects you. Contact support@foodramarket.com to exercise this right.",
      "We do not use your data for any other automated decision-making that produces legal or similarly significant effects without human oversight.",
    ],
  },
  {
    icon: FileSearch,
    title: "13. Third-Party Links & Services",
    body: [
      "The platform may contain links to third-party websites, tools, or resources. Foodra is not responsible for the privacy practices or content of those third parties.",
      "Our integrations with Paystack, Privy, Supabase, and Vercel are governed by their respective privacy policies in addition to our data processing agreements.",
      "We encourage you to review the privacy policies of any third-party services you interact with through the platform.",
    ],
  },
  {
    icon: RefreshCw,
    title: "14. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes in our data practices, applicable law, or platform features.",
      "For material changes, we will provide at least 14 days' notice via email and/or an in-app notification before the new policy takes effect.",
      "The 'Effective date' at the top of this page will always reflect the date of the most recent revision.",
      "Your continued use of Foodra after the effective date of updated Terms constitutes acceptance of the revised policy.",
      "If you disagree with a revised policy, you may delete your account before the changes take effect.",
    ],
  },
  {
    icon: Mail,
    title: "15. Contact & Data Controller",
    body: [
      "Data Controller: Foodra Technologies Ltd, Benue State, Federal Republic of Nigeria.",
      "For privacy-related requests, concerns, data rights exercises, or breach notifications, email: support@foodramarket.com with subject line 'Privacy Request'.",
      "We aim to respond to all privacy requests within 30 days. For complex requests, we may extend this by a further 30 days and will notify you of the extension.",
      "To contact the Nigeria Data Protection Commission: ndpc.gov.ng.",
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
              Your privacy matters to us. This policy explains exactly what data we collect, why we collect it, how we protect it, how long we keep it, and the rights you have under the Nigeria Data Protection Act 2023.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Effective date: <strong className="text-foreground">June 22, 2026</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Applies to: <strong className="text-foreground">foodramarket.com</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Regulation: <strong className="text-foreground">NDPA 2023</strong></span>
            </div>
          </div>
        </div>

        {/* Summary banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-5 mb-8">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong>In plain terms:</strong> We collect only what we need to run the platform. We never sell your data. Your card details go directly to Paystack — we never see them. You can request access, correction, or deletion of your data at any time. For questions, email <a href="mailto:support@foodramarket.com" className="underline font-medium">support@foodramarket.com</a>.
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
            <p className="text-sm text-muted-foreground">Our team responds to all privacy requests within 30 days as required by the NDPA.</p>
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
