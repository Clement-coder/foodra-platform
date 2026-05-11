import type { Metadata } from "next"
import Link from "next/link"
import { FileText, Shield, ShoppingBag, Ban, AlertTriangle, RefreshCw, Scale, Mail, Gavel, Users } from "lucide-react"
import { ContactSupportButton } from "@/components/ContactSupportButton"

export const metadata: Metadata = {
  title: "Terms of Service | Foodra",
  description: "Read Foodra's Terms of Service. Understand your rights and responsibilities when using our agricultural marketplace, training programs, and funding services.",
  alternates: { canonical: "https://foodramarket.com/terms" },
}

const sections = [
  {
    icon: FileText,
    title: "Acceptance of Terms",
    body: [
      "By accessing or using Foodra (foodramarket.com), you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.",
      "If you are using Foodra on behalf of a business or organisation, you represent that you have the authority to bind that entity to these Terms.",
      "If you do not agree with any part of these Terms, you must discontinue use of the platform immediately.",
      "These Terms apply to all users including farmers, buyers, administrators, and visitors.",
    ],
  },
  {
    icon: Users,
    title: "Eligibility & Account Registration",
    body: [
      "You must be at least 18 years old to create an account and use Foodra services.",
      "You agree to provide accurate, current, and complete information during registration and to keep your profile up to date.",
      "You are solely responsible for maintaining the confidentiality of your account credentials and wallet access.",
      "You must notify us immediately at support@foodramarket.com if you suspect any unauthorised access to your account.",
      "Foodra reserves the right to suspend or terminate accounts that provide false information or violate these Terms.",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Marketplace & Listings",
    body: [
      "Farmers and sellers are solely responsible for the accuracy, legality, and quality of their product listings.",
      "All listed products must be genuine agricultural goods. Misrepresentation of products is strictly prohibited.",
      "Sellers must honour confirmed orders and fulfil delivery obligations within the agreed timeframe.",
      "Foodra uses a blockchain-based escrow system (FoodraEscrow) to hold buyer payments until delivery is confirmed, protecting both parties.",
      "Buyers must confirm delivery within 7 days. If no action is taken, funds are automatically released to the seller.",
      "Foodra charges a 2.5% platform fee on completed transactions to sustain platform operations.",
    ],
  },
  {
    icon: Ban,
    title: "Prohibited Conduct",
    body: [
      "You may not use Foodra to list, sell, or purchase illegal, counterfeit, or hazardous goods.",
      "You may not engage in fraudulent activity, including fake listings, false reviews, or payment manipulation.",
      "You may not attempt to gain unauthorised access to any part of the platform, other user accounts, or our infrastructure.",
      "You may not use automated bots, scrapers, or scripts to access or extract data from Foodra without written permission.",
      "You may not harass, threaten, or abuse other users through any platform feature including support chat.",
      "Violations may result in immediate account suspension, fund withholding, and referral to relevant authorities.",
    ],
  },
  {
    icon: Scale,
    title: "Payments, Escrow & Fees",
    body: [
      "All marketplace payments are processed in USDC (a USD-pegged stablecoin) via the FoodraEscrow smart contract on the Base blockchain.",
      "Funds are held in escrow until the buyer confirms delivery or the 7-day auto-release period expires.",
      "A platform fee of 2.5% is deducted from each completed transaction and sent to the Foodra treasury wallet.",
      "Foodra does not hold fiat currency on your behalf. All wallet balances are non-custodial and managed through Privy.",
      "In the event of a dispute, Foodra administrators will review evidence from both parties and make a final resolution decision.",
    ],
  },
  {
    icon: Gavel,
    title: "Dispute Resolution",
    body: [
      "If you have a dispute with another user, you should first attempt to resolve it directly through the platform's messaging system.",
      "If unresolved, either party may raise a formal dispute through the order detail page within 7 days of the expected delivery date.",
      "Foodra's admin team will review the dispute, request evidence if needed, and issue a binding resolution within 5 business days.",
      "Foodra's decision on disputes is final. Funds will be released to the appropriate party based on the outcome.",
      "Repeated or bad-faith dispute filings may result in account restrictions.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Limitation of Liability",
    body: [
      "Foodra provides its platform on an 'as available' basis without warranties of any kind, express or implied.",
      "We do not guarantee uninterrupted access, error-free operation, or that the platform will meet your specific requirements.",
      "To the fullest extent permitted by Nigerian law, Foodra shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.",
      "Our total liability to you for any claim arising from use of Foodra shall not exceed the total fees you paid to Foodra in the 3 months preceding the claim.",
      "Nothing in these Terms limits liability for fraud, gross negligence, or any liability that cannot be excluded by law.",
    ],
  },
  {
    icon: Shield,
    title: "Intellectual Property",
    body: [
      "All content, branding, logos, software, and platform features are the intellectual property of Foodra Technologies Ltd.",
      "You may not copy, reproduce, distribute, or create derivative works from Foodra's content without prior written consent.",
      "By posting content on Foodra (listings, reviews, profile information), you grant Foodra a non-exclusive licence to display and use that content to operate the platform.",
      "You retain ownership of content you post. Foodra will not sell your content to third parties.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Changes to Terms",
    body: [
      "Foodra reserves the right to update these Terms at any time to reflect changes in our services, legal requirements, or business practices.",
      "We will notify you of material changes via email or a prominent in-app notice at least 7 days before they take effect.",
      "Your continued use of Foodra after the effective date of any changes constitutes your acceptance of the updated Terms.",
      "If you do not agree to the updated Terms, you must stop using the platform and may request account deletion.",
    ],
  },
  {
    icon: Mail,
    title: "Governing Law & Contact",
    body: [
      "These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
      "Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Benue State, Nigeria.",
      "For questions, concerns, or legal notices regarding these Terms, contact us at support@foodramarket.com.",
      "Foodra Technologies Ltd, Benue State, Nigeria.",
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
              These Terms govern your use of Foodra's marketplace, training programs, funding services, and all platform features. Please read them carefully before using the platform.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Last updated: <strong className="text-foreground">May 9, 2026</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Applies to: <strong className="text-foreground">foodramarket.com</strong></span>
            </div>
          </div>
        </div>

        {/* Summary banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-5 mb-8">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Key points:</strong> You must be 18+ to use Foodra. Sellers are responsible for their listings. Payments are held in escrow until delivery is confirmed. Disputes are resolved by Foodra admins. These Terms are governed by Nigerian law.
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
            <h3 className="font-semibold text-foreground mb-1">Questions about these Terms?</h3>
            <p className="text-sm text-muted-foreground">Our team is happy to clarify anything. We respond within 5 business days.</p>
          </div>
          <ContactSupportButton label="Contact Support" />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By using Foodra, you agree to these Terms. See also our{" "}
          <Link href="/privacy" className="text-[#118C4C] hover:underline font-medium">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
