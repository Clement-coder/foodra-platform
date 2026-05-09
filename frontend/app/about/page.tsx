import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Users, Leaf, MapPin, FileText, Sparkles, Quote } from "lucide-react"

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

const pillars = [
  {
    title: "Fair Market Access",
    text: "We help farmers connect directly with buyers, improve pricing visibility, and reduce middleman friction.",
  },
  {
    title: "Trust and Transparency",
    text: "Profiles, listings, and platform features are built to make transactions and relationships more reliable.",
  },
  {
    title: "Growth for Communities",
    text: "Beyond sales, Foodra supports learning opportunities and funding pathways for agricultural growth.",
  },
]

const team = [
  { name: "Aondongu Amos Tyonongo", role: "Founder & CEO" },
  { name: "Agricultural Advisors", role: "Domain Expertise" },
  { name: "Community Partners", role: "Farmer Outreach" },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-6 md:p-10 mb-8">
        <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-[#118C4C]/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-lime-100/60 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#118C4C] mb-4">
            About Foodra
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">Built For Farmers and Buyers</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Foodra is a blockchain-powered agricultural technology platform designed to make food commerce simpler, fairer, and more connected — starting with Nigeria.
          </p>
        </div>
      </div>

      {/* Mission pillars */}
      <div className="space-y-4 mb-10">
        {pillars.map((pillar, index) => (
          <section key={pillar.title} className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#118C4C]/10 text-xs font-semibold text-[#118C4C]">
                {index + 1}
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">{pillar.title}</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{pillar.text}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Founder Spotlight */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="h-5 w-5 text-[#118C4C]" />
          <h2 className="text-xl font-semibold text-foreground">Meet the Founder</h2>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-6 md:p-8">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-lime-100/60 dark:bg-[#118C4C]/5 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-[#118C4C] to-[#0d6d3a] flex items-center justify-center shadow-lg">
                <span className="text-4xl md:text-5xl font-bold text-white select-none">A</span>
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">Aondongu Amos Tyonongo</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] self-center">
                  <Sparkles className="h-3 w-3" /> Founder & CEO
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Benue State, Nigeria · Foodra Technologies Ltd</p>

              {/* Quote */}
              <div className="relative mb-4">
                <Quote className="absolute -top-1 -left-1 h-5 w-5 text-[#118C4C]/30" />
                <p className="pl-5 text-base md:text-lg text-foreground font-medium leading-relaxed italic">
                  "Africa has the land, the people, and the will. What farmers need is the right technology to connect them to the world — that's exactly what Foodra is built to do."
                </p>
              </div>

              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Aondongu Amos Tyonongo is a Nigerian entrepreneur and technologist from Benue State with a deep passion for solving Africa's food security crisis through technology. Driven by firsthand experience of the challenges smallholder farmers face — from market access to financial exclusion — he founded Foodra to bridge the gap between farmers and buyers using blockchain, AI, and modern web technology. His vision is a self-sufficient Africa where every farmer has the tools, funding, and market access to thrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-[#118C4C]" />
          <h2 className="text-xl font-semibold text-foreground">Our Team</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {team.map((member) => (
            <div key={member.name} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm text-center">
              <div className="w-12 h-12 rounded-full bg-[#118C4C]/10 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-[#118C4C]" />
              </div>
              <p className="font-semibold text-foreground">{member.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Company info */}
      <section className="mb-8 rounded-2xl border border-border/60 bg-card p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-[#118C4C]" />
          <h2 className="text-xl font-semibold text-foreground">Company Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-[#118C4C] mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Registered Name</p>
              <p className="text-muted-foreground">Foodra Technologies Ltd</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-[#118C4C] mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Registered Address</p>
              <p className="text-muted-foreground">Benue State, Nigeria</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Leaf className="h-4 w-4 text-[#118C4C] mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Industry</p>
              <p className="text-muted-foreground">Agricultural Technology (AgriTech)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-[#118C4C] mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Platform Type</p>
              <p className="text-muted-foreground">Decentralised Marketplace & Financial Services</p>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-[#118C4C]/20 bg-[#118C4C]/5 p-5 md:p-6">
        <p className="text-sm text-foreground">
          Want to partner with us or learn more? Visit the{" "}
          <Link href="/contact" className="font-semibold text-[#118C4C] hover:underline">
            Contact page
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
