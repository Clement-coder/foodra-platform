import type { Metadata } from "next"
import Link from "next/link"
import {
  FileText, Shield, ShoppingBag, Ban, AlertTriangle, RefreshCw,
  Scale, Mail, Gavel, Users, CreditCard, Truck, MessageSquare,
  BookOpen, Briefcase, Globe, Lock, Eye, LifeBuoy,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service | Foodra",
  description: "Foodra's full Terms of Service covering marketplace, wallet, funding, training, data, liability, and user rights.",
  alternates: { canonical: "https://foodramarket.com/terms" },
}

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using Foodra (foodramarket.com) in any way — including browsing, creating an account, purchasing products, or applying for funding — you confirm that you have read, understood, and agree to be bound by these Terms of Service ('Terms') and our Privacy Policy.",
      "If you are accessing or using Foodra on behalf of a company, organisation, or other legal entity, you represent and warrant that you have the authority to bind that entity to these Terms, in which case 'you' refers to that entity.",
      "If you do not agree with any part of these Terms, you must immediately cease all use of the platform.",
      "These Terms apply to all users, including but not limited to farmers, buyers, sellers, training participants, funding applicants, administrators, and visitors.",
      "Use of specific features (wallet, funding, training) may be subject to additional terms presented at the point of use. In the event of a conflict, the additional terms take precedence for those features.",
    ],
  },
  {
    icon: Users,
    title: "2. Eligibility & Account Registration",
    body: [
      "You must be at least 18 years of age to create an account and use Foodra's services. By registering, you affirm you meet this requirement.",
      "You agree to provide accurate, current, complete, and truthful information during registration and to update it promptly if it changes.",
      "Each person may maintain only one personal account. Creating duplicate accounts is prohibited.",
      "You are solely responsible for maintaining the security and confidentiality of your login credentials, wallet PIN, and authentication methods.",
      "You must notify us immediately at support@foodramarket.com if you suspect any unauthorised access to your account or any security breach.",
      "Foodra reserves the right to refuse registration, suspend, or permanently terminate accounts that provide false information, violate these Terms, or are involved in fraudulent activity.",
      "Account deletion requests can be submitted at any time. We will process such requests within 30 days, subject to legal retention obligations.",
    ],
  },
  {
    icon: ShoppingBag,
    title: "3. Marketplace — Sellers",
    body: [
      "Sellers must list only genuine, legally obtainable agricultural products. Misrepresentation of quantity, quality, origin, or variety is strictly prohibited.",
      "Sellers are solely responsible for the accuracy of their listings, including description, price, stock availability, and applicable certifications.",
      "Upon order confirmation, sellers must fulfil orders within the agreed or stated delivery timeframe.",
      "Sellers must not accept payment outside the Foodra platform to circumvent platform fees. Doing so is grounds for immediate suspension.",
      "Products must comply with all applicable Nigerian food safety, agricultural, and trade laws.",
      "Foodra charges a 2.5% platform fee on each completed transaction. This fee is deducted automatically upon payment release.",
      "Sellers accept that buyer payments are held in escrow until delivery is confirmed or the 7-day auto-release window lapses.",
      "Sellers may not list prohibited items including but not limited to: counterfeit goods, stolen agricultural inputs, restricted chemicals, or any product banned under Nigerian law.",
    ],
  },
  {
    icon: Truck,
    title: "4. Marketplace — Buyers",
    body: [
      "Buyers are responsible for reviewing listing details — including product description, quantity, price, and seller profile — before placing an order.",
      "By placing an order, you enter into a binding purchase agreement with the seller subject to these Terms.",
      "⚠️ DELIVERY FEE NOTICE: Delivery fees are NOT included in the product price or the escrow payment amount. A delivery fee is charged separately by the logistics provider upon delivery. Buyers are fully responsible for paying this fee at the point of delivery.",
      "Buyers must confirm receipt of delivery within 7 days of the expected delivery date. Failure to do so will trigger automatic release of funds to the seller.",
      "If goods arrive damaged, incorrect, or not as described, buyers must raise a dispute through the order detail page within 7 days of delivery.",
      "Repeated failure to collect ordered goods or bad-faith dispute filings may result in account restrictions.",
    ],
  },
  {
    icon: CreditCard,
    title: "5. NGN Digital Wallet",
    body: [
      "Foodra provides a custodial NGN digital wallet powered by Paystack. Your wallet balance is held on Foodra's behalf and tracked per-user in our database.",
      "You may fund your wallet via Paystack using debit/credit cards or bank transfers. Minimum funding is ₦500; maximum is ₦1,000,000 per transaction.",
      "You may send NGN to other Foodra users using their Foodra Tag (e.g. FDR-XXXXXX). Transfers are instant and irreversible once confirmed.",
      "Wallet withdrawals are processed via Paystack Transfers to your nominated Nigerian bank account. Processing times are subject to bank and Paystack availability.",
      "A wallet transaction PIN is required for all outgoing transactions. You are responsible for keeping your PIN confidential.",
      "Foodra is not a bank or licensed financial institution. Wallet services are provided as a platform convenience, not as a regulated financial product.",
      "In the event of technical errors resulting in incorrect wallet credits or debits, Foodra reserves the right to correct such errors and adjust your balance accordingly, with prior notification.",
      "Foodra will not be responsible for losses arising from unauthorised transactions where such transactions resulted from your failure to secure your credentials or PIN.",
      "Wallet balances do not earn interest. Foodra does not invest or deploy your wallet funds.",
    ],
  },
  {
    icon: BookOpen,
    title: "6. Training Programs",
    body: [
      "Foodra provides access to agricultural training sessions led by expert instructors. Enrollment is subject to session capacity.",
      "Once enrolled in a training session, your place is reserved. Cancellations less than 24 hours before the session may not be eligible for a refund.",
      "Training content is provided for educational purposes only. Foodra does not guarantee specific outcomes, yields, or profits from applying training knowledge.",
      "You must not reproduce, record, redistribute, or commercially exploit any training content without the written consent of Foodra and the respective instructor.",
      "Foodra reserves the right to cancel or reschedule training sessions due to insufficient enrollment, instructor unavailability, or force majeure.",
    ],
  },
  {
    icon: Briefcase,
    title: "7. Funding Applications",
    body: [
      "Foodra facilitates access to agricultural loans and grants through third-party funding partners. Foodra itself is not a lender.",
      "By submitting a funding application, you consent to Foodra processing your farm data, financial history, and submitted documents to generate an AI credit score.",
      "The AI credit score is a decision-support tool. Final funding decisions are made by the relevant funding partner, not Foodra.",
      "You must provide truthful and complete information in all funding applications. Submission of false or misleading information constitutes fraud and may be reported to the relevant authorities.",
      "Approval of a funding application does not guarantee disbursement. Disbursement is subject to the funding partner's processes, terms, and due diligence.",
      "Foodra takes no responsibility for the terms, interest rates, or obligations attached to funding arrangements between you and a third-party funder.",
    ],
  },
  {
    icon: Ban,
    title: "8. Prohibited Conduct",
    body: [
      "You may not use Foodra to engage in any illegal activity, including fraud, money laundering, market manipulation, or trade in prohibited goods.",
      "You may not attempt to gain unauthorised access to other user accounts, platform infrastructure, databases, or admin systems.",
      "You may not use automated scripts, bots, or scrapers to access, extract, or manipulate platform data without Foodra's prior written consent.",
      "You may not post defamatory, abusive, hateful, or sexually explicit content anywhere on the platform.",
      "You may not create fake reviews, fake orders, or fake listings to manipulate platform ratings or deceive other users.",
      "You may not circumvent or attempt to circumvent platform fees, escrow processes, or payment systems.",
      "You may not impersonate Foodra staff, other users, or any third party.",
      "Violation of these prohibitions may result in immediate account suspension, permanent ban, forfeiture of wallet balance where legally permissible, and referral to law enforcement.",
    ],
  },
  {
    icon: Gavel,
    title: "9. Dispute Resolution",
    body: [
      "In the event of a dispute with another user, you must first attempt to resolve the matter directly through the platform's messaging or order system.",
      "If the dispute is unresolved within 48 hours, either party may formally escalate it through the order detail page. Disputes must be raised within 7 days of the expected delivery date.",
      "Foodra's admin team will review the dispute, examine evidence submitted by both parties, and issue a binding resolution within 5 business days.",
      "Foodra's dispute resolution decision is final and binding on both parties. Funds held in escrow will be released in accordance with the decision.",
      "Foodra reserves the right to extend the review period for complex disputes and to request additional evidence from either party.",
      "Repeated or bad-faith dispute filings, including those designed to delay legitimate fund releases, may result in account restrictions or suspension.",
      "Nothing in this section prevents either party from pursuing legal remedies in a competent court of law.",
    ],
  },
  {
    icon: MessageSquare,
    title: "10. User Content & Reviews",
    body: [
      "You may post reviews, product listings, profile content, and messages on the platform ('User Content').",
      "By posting User Content, you grant Foodra a non-exclusive, worldwide, royalty-free licence to use, display, reproduce, and distribute that content to operate and promote the platform.",
      "You retain full ownership of your User Content. Foodra will not sell your content to third parties.",
      "You are solely responsible for your User Content. It must be accurate, lawful, non-defamatory, and must not infringe any third party's intellectual property rights.",
      "Foodra reserves the right to remove User Content that violates these Terms or applicable law, without notice.",
    ],
  },
  {
    icon: Scale,
    title: "11. Limitation of Liability",
    body: [
      "Foodra provides its platform on an 'as is' and 'as available' basis without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or uninterrupted access.",
      "Foodra does not verify the identity, qualifications, or claims of sellers, buyers, instructors, or funding partners beyond standard onboarding checks.",
      "To the fullest extent permitted by applicable Nigerian law, Foodra shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of revenue, loss of data, loss of profit, or loss of opportunity.",
      "Our total aggregate liability to you for any claim arising out of or relating to your use of Foodra shall not exceed the total fees you paid to Foodra in the 12 months immediately preceding the claim.",
      "Nothing in these Terms limits or excludes liability for fraud, wilful misconduct, gross negligence, personal injury, death caused by negligence, or any other liability that cannot be excluded under Nigerian law.",
    ],
  },
  {
    icon: Shield,
    title: "12. Intellectual Property",
    body: [
      "All platform content, branding, logos, software code, designs, data compilations, and features ('Foodra IP') are the exclusive property of Foodra Technologies Ltd or its licensors.",
      "You may not copy, modify, reverse-engineer, disassemble, distribute, sublicense, or create derivative works from any Foodra IP without prior written consent.",
      "The Foodra name, logo, and 'FDR-' tag format are protected trademarks. Unauthorised use is strictly prohibited.",
      "If you believe any content on the platform infringes your intellectual property rights, please contact us at support@foodramarket.com with full details.",
    ],
  },
  {
    icon: Eye,
    title: "13. Privacy & Data Protection",
    body: [
      "Your use of Foodra is subject to our Privacy Policy, which is incorporated into these Terms by reference.",
      "We collect and process your personal data in accordance with Nigerian data protection laws including the Nigeria Data Protection Act 2023 (NDPA).",
      "You have rights over your data including the right to access, correct, delete, and object to processing. See our Privacy Policy for full details.",
      "By using Foodra, you consent to the collection and processing of your data as described in the Privacy Policy.",
    ],
  },
  {
    icon: Globe,
    title: "14. Third-Party Services",
    body: [
      "Foodra integrates third-party services including Supabase (database), Privy (authentication), Paystack (payments), and Vercel (hosting). Use of these services is subject to their respective terms and privacy policies.",
      "Foodra is not responsible for the availability, accuracy, or conduct of third-party services.",
      "Links to third-party websites or services are provided for convenience only. Foodra does not endorse and is not responsible for third-party content.",
    ],
  },
  {
    icon: LifeBuoy,
    title: "15. Termination & Suspension",
    body: [
      "Foodra may suspend or terminate your account at any time, with or without notice, if you breach these Terms, engage in fraudulent activity, or if required by law.",
      "You may close your account at any time by contacting support@foodramarket.com. Outstanding wallet balances will be transferred to your nominated bank account within 14 business days, subject to identity verification.",
      "Upon termination, your right to use the platform ceases immediately. Provisions of these Terms that by their nature should survive termination (including intellectual property, liability, and dispute resolution) will continue to apply.",
    ],
  },
  {
    icon: Lock,
    title: "16. Force Majeure",
    body: [
      "Foodra shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including but not limited to: acts of God, natural disasters, war, civil unrest, government action, internet outages, or failure of third-party services.",
      "In the event of a force majeure, Foodra will notify users as promptly as possible and resume services once normal conditions are restored.",
    ],
  },
  {
    icon: RefreshCw,
    title: "17. Changes to Terms",
    body: [
      "Foodra reserves the right to update these Terms at any time to reflect changes in our services, legal requirements, or business practices.",
      "For material changes, we will provide at least 14 days' notice via email and/or a prominent in-app banner before the changes take effect.",
      "For minor or non-material changes (such as grammar corrections or clarifications), we may update the Terms without specific notice.",
      "Your continued use of Foodra after the effective date of any updated Terms constitutes your acceptance of the changes.",
      "If you do not accept the updated Terms, you must stop using the platform and may request account deletion by contacting support.",
    ],
  },
  {
    icon: Mail,
    title: "18. Governing Law & Jurisdiction",
    body: [
      "These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
      "Any dispute, controversy, or claim arising out of or in connection with these Terms shall first be submitted to mediation. If mediation fails within 30 days, the dispute shall be referred to arbitration under the Arbitration and Conciliation Act, Cap A18, Laws of the Federation of Nigeria.",
      "The seat of arbitration shall be Abuja, Nigeria, and proceedings shall be conducted in English.",
      "Nothing in this clause prevents either party from seeking urgent injunctive relief from a competent court.",
      "For all legal notices and formal communications, contact: Foodra Technologies Ltd, Benue State, Nigeria — support@foodramarket.com.",
    ],
  },
]

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-8 md:p-12 mb-10">
          <div className="absolute -right-10 -top-8 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-lime-100/60 dark:bg-[#118C4C]/5 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#118C4C] mb-5">
              <Gavel className="h-3.5 w-3.5" /> Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              These Terms govern your use of Foodra's marketplace, digital wallet, training programs, funding services, and all platform features. Please read them carefully.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Effective date: <strong className="text-foreground">June 22, 2026</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Applies to: <strong className="text-foreground">foodramarket.com</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Jurisdiction: <strong className="text-foreground">Federal Republic of Nigeria</strong></span>
            </div>
          </div>
        </div>

        {/* Summary banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-5 mb-8">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Key highlights:</strong> You must be 18+ to use Foodra. Sellers are responsible for their listings. Wallet funds are custodial NGN balances powered by Paystack. <strong>Delivery fees are charged separately upon arrival and are the buyer's responsibility.</strong> Disputes are resolved by Foodra admins with final, binding decisions. These Terms are governed by Nigerian law.
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
            <h3 className="font-semibold text-foreground mb-1">Questions about these Terms?</h3>
            <p className="text-sm text-muted-foreground">Our team is happy to clarify anything. We respond within 5 business days.</p>
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
          By using Foodra, you agree to these Terms. See also our{" "}
          <Link href="/privacy" className="text-[#118C4C] hover:underline font-medium">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
