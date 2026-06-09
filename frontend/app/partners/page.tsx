import type { Metadata } from "next"
import Link from "next/link"
import { Handshake, Globe, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Partners | Foodra",
  description: "Meet the organisations and institutions partnering with Foodra to transform African agriculture through technology, funding, and market access.",
  alternates: { canonical: "https://foodramarket.com/partners" },
}

const partners = [
  {
    name: "Base (Coinbase)",
    category: "Blockchain Infrastructure",
    description: "Foodra is built on Base — Coinbase's Ethereum L2 network — enabling fast, low-cost USDC payments and escrow for every transaction.",
    logo: null,
    url: "https://base.org",
  },
  {
    name: "Privy",
    category: "Authentication & Wallets",
    description: "Privy powers our seamless wallet-based authentication, letting farmers and buyers sign in without needing prior crypto knowledge.",
    logo: null,
    url: "https://privy.io",
  },
  {
    name: "Supabase",
    category: "Data Infrastructure",
    description: "Our platform data — products, orders, users, and more — is securely stored and managed on Supabase's PostgreSQL infrastructure.",
    logo: null,
    url: "https://supabase.com",
  },
  {
    name: "MoonPay",
    category: "Fiat On-Ramp",
    description: "MoonPay enables Nigerian farmers and buyers to convert Naira to USDC directly within the Foodra wallet — no exchange needed.",
    logo: null,
    url: "https://moonpay.com",
  },
]

const partnerTypes = [
  {
    icon: Globe,
    title: "Technology Partners",
    description: "Companies providing the infrastructure, tools, and APIs that power the Foodra platform.",
  },
  {
    icon: Handshake,
    title: "Agricultural Partners",
    description: "NGOs, cooperatives, and government bodies helping us reach and support smallholder farmers across Nigeria.",
  },
  {
    icon: Mail,
    title: "Funding Partners",
    description: "Investors, grant providers, and financial institutions that fund both Foodra's growth and farmer loan programs.",
  },
]

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#EAF5ED] to-white dark:from-[#118C4C]/10 dark:to-background py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] mb-4">
            <Handshake className="h-3.5 w-3.5" /> Partners
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Built Together, Growing Together</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Foodra's mission is powered by a network of world-class technology providers, agricultural organisations, and impact investors who share our vision for African food security.
          </p>
        </div>
      </section>

      {/* Partner types */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {partnerTypes.map((p) => (
              <Card key={p.title} className="border-[#118C4C]/20">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-[#118C4C]/10 flex items-center justify-center mb-4">
                    <p.icon className="h-6 w-6 text-[#118C4C]" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Current partners */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Our Current Partners</h2>
            <p className="text-muted-foreground">The platforms and protocols that make Foodra possible.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {partners.map((p) => (
              <Card key={p.name} className="border-[#118C4C]/20 hover:border-[#118C4C]/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-bold text-foreground">{p.name}</h3>
                      <span className="text-xs text-[#118C4C] font-medium bg-[#118C4C]/10 px-2 py-0.5 rounded-full">{p.category}</span>
                    </div>
                    <Link href={p.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-[#118C4C] transition-colors flex items-center gap-1 flex-shrink-0">
                      <Globe className="h-3.5 w-3.5" /> Visit
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Become a partner CTA */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="rounded-2xl bg-gradient-to-br from-[#118C4C] to-[#0d6d3a] p-10">
            <Handshake className="h-10 w-10 text-white/80 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Become a Partner</h2>
            <p className="text-white/85 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
              Are you an organisation, investor, or technology provider aligned with our mission? We'd love to explore how we can grow together.
            </p>
            <Link href="/contact">
              <Button variant="white">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
