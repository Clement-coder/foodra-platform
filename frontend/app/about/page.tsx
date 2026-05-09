import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Users, Leaf, MapPin, FileText, Sparkles, Quote, Target, Lightbulb, Info } from "lucide-react"

export const metadata: Metadata = {
  title: "About Foodra — Nigeria's Blockchain-Powered Farm Marketplace",
  description: "Learn about Foodra Technologies Ltd, Nigeria's leading AgriTech platform. We connect smallholder farmers directly with buyers, provide agricultural training, farm loans, and blockchain-powered payments to drive food security across Africa.",
  alternates: { canonical: "https://foodramarket.com/about" },
  openGraph: {
    title: "About Foodra — Nigeria's Blockchain-Powered Farm Marketplace",
    description: "Foodra Technologies Ltd is building Africa's most trusted agricultural marketplace. Fair market access, farmer empowerment, and food security — starting with Nigeria.",
    url: "https://foodramarket.com/about",
    siteName: "Foodra",
    images: [{ url: "https://foodramarket.com/foodra.png", width: 1200, height: 630, alt: "About Foodra" }],
    locale: "en_NG",
    type: "website",
  },
}

const sections = [
  {
    icon: Target,
    title: "Our Mission",
    body: [
      "To offer value to African farmers through sustainable practices and a sustainable supply chain.",
      "We ensure fair value distribution across the agricultural supply chain, eliminating unnecessary middlemen.",
      "We empower farmers through technology, market access, and financial inclusion tools.",
      "We protect the environment by promoting sustainable farming practices across our platform.",
    ],
  },
  {
    icon: Lightbulb,
    title: "Our Vision",
    body: [
      "To contribute towards an Africa that does not depend on the outside world to feed her.",
      "Using the least available resources to maximise the capacity of African food production and supply chains.",
      "Through technology, financial support, and market availability, smallholder farmers will boost their capacity and in turn boost Africa's food capacity.",
      "We envision a future where every African farmer has the tools, funding, and market access to thrive.",
    ],
  },
  {
    icon: Leaf,
    title: "Fair Market Access",
    body: [
      "We help farmers connect directly with buyers, improving pricing visibility and reducing middleman friction.",
      "Farmers can list, manage, and sell agricultural products to a wide network of verified buyers.",
      "Our blockchain-based escrow system ensures every transaction is secure and funds are released only on confirmed delivery.",
      "Advanced search and filtering tools help buyers find exactly what they need from local farmers.",
    ],
  },
  {
    icon: Shield,
    title: "Trust and Transparency",
    body: [
      "Profiles, listings, and platform features are built to make transactions and relationships more reliable.",
      "Our AI-powered credit scoring engine provides explainable, fair assessments for funding applications.",
      "All financial transactions are recorded on the Base blockchain, providing an immutable audit trail.",
      "Dispute resolution is handled transparently by our admin team with evidence from both parties.",
    ],
  },
  {
    icon: Users,
    title: "Growth for Communities",
    body: [
      "Beyond sales, Foodra supports learning opportunities and funding pathways for agricultural growth.",
      "Our training programs connect farmers with expert instructors teaching modern farming techniques.",
      "Farmers can apply for loans and grants through our funding platform with transparent application tracking.",
      "We partner with agricultural advisors and community organisations to extend our reach to rural farmers.",
    ],
  },
  {
    icon: FileText,
    title: "Company Information",
    body: [
      "Registered Name: Foodra Technologies Ltd",
      "Registered Address: Benue State, Nigeria",
      "Industry: Agricultural Technology (AgriTech)",
      "Platform Type: Decentralised Marketplace & Financial Services",
      "Website: foodramarket.com",
    ],
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-8 md:p-12 mb-10">
          <div className="absolute -right-10 -top-8 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-lime-100/60 dark:bg-[#118C4C]/5 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#118C4C] mb-5">
              <Leaf className="h-3.5 w-3.5" /> About Foodra
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Built For Farmers and Buyers</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              Foodra is a blockchain-powered agricultural technology platform designed to make food commerce simpler, fairer, and more connected — starting with Nigeria.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="text-sm text-muted-foreground">Founded: <strong className="text-foreground">2024</strong></span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground">Headquartered in: <strong className="text-foreground">Benue State, Nigeria</strong></span>
            </div>
          </div>
        </div>

        {/* Summary banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 p-5 mb-8">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong>In short:</strong> Foodra connects smallholder farmers directly with buyers, provides agricultural training, funding access, and blockchain-powered payments — all in one platform built for Africa.
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

        {/* Founder spotlight */}
        <div className="mt-8 relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-6 md:p-8">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-lime-100/60 dark:bg-[#118C4C]/5 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-[#118C4C] to-[#0d6d3a] flex items-center justify-center shadow-lg">
                <span className="text-4xl md:text-5xl font-bold text-white select-none">A</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Aondongu Amos Tyonongo</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] self-center">
                  <Sparkles className="h-3 w-3" /> Founder & CEO
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Benue State, Nigeria · Foodra Technologies Ltd</p>
              <div className="relative mb-4">
                <Quote className="absolute -top-1 -left-1 h-5 w-5 text-[#118C4C]/30" />
                <p className="pl-5 text-base md:text-lg text-foreground font-medium leading-relaxed italic">
                  "Africa has the land, the people, and the will. What farmers need is the right technology to connect them to the world — that's exactly what Foodra is built to do."
                </p>
              </div>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                A Nigerian entrepreneur and technologist from Benue State with a deep passion for solving Africa's food security crisis through technology. Driven by firsthand experience of the challenges smallholder farmers face — from market access to financial exclusion — he founded Foodra to bridge the gap between farmers and buyers using blockchain, AI, and modern web technology.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 rounded-2xl border border-[#118C4C]/20 bg-[#118C4C]/5 dark:bg-[#118C4C]/10 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Want to partner with us?</h3>
            <p className="text-sm text-muted-foreground">We're open to partnerships, collaborations, and farmer outreach programmes across Africa.</p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#118C4C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d6d3a] transition-colors"
          >
            Get In Touch
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Learn how we handle your data in our{" "}
          <Link href="/privacy" className="text-[#118C4C] hover:underline font-medium">Privacy Policy</Link>
          {" "}and{" "}
          <Link href="/terms" className="text-[#118C4C] hover:underline font-medium">Terms of Service</Link>.
        </p>
      </div>
    </div>
  )
}
