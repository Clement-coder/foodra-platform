"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Handshake, Globe, Mail, Zap, Database, Wallet, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const partners = [
  {
    name: "Base",
    sub: "Coinbase L2",
    category: "Blockchain",
    description: "Fast, low-cost USDC payments and escrow built on Ethereum L2.",
    url: "https://base.org",
    icon: Zap,
    color: "from-blue-500 to-blue-700",
    glow: "shadow-blue-500/30",
  },
  {
    name: "Privy",
    sub: "Auth & Wallets",
    category: "Authentication",
    description: "Seamless wallet-based sign-in — no crypto knowledge needed.",
    url: "https://privy.io",
    icon: Wallet,
    color: "from-violet-500 to-violet-700",
    glow: "shadow-violet-500/30",
  },
  {
    name: "Supabase",
    sub: "PostgreSQL",
    category: "Data Infrastructure",
    description: "Secure, scalable storage for all platform data and real-time updates.",
    url: "https://supabase.com",
    icon: Database,
    color: "from-emerald-500 to-emerald-700",
    glow: "shadow-emerald-500/30",
  },
  {
    name: "MoonPay",
    sub: "Fiat On-Ramp",
    category: "Finance",
    description: "Convert Naira to USDC directly — no exchange or bank needed.",
    url: "https://moonpay.com",
    icon: Globe,
    color: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/30",
  },
]

const ORBIT_CONFIGS = [
  { r: 110, duration: 18, items: [0, 2] },
  { r: 175, duration: 28, items: [1, 3] },
]

const partnerTypes = [
  { icon: Globe, title: "Technology Partners", description: "Infrastructure, tools, and APIs powering the Foodra platform." },
  { icon: Handshake, title: "Agricultural Partners", description: "NGOs, cooperatives, and government bodies supporting smallholder farmers." },
  { icon: Mail, title: "Funding Partners", description: "Investors, grants, and financial institutions fuelling growth." },
]

export default function PartnersPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── Futuristic Hero ── */}
      <section className="relative py-24 px-4 bg-[#050e0a] overflow-hidden">
        {/* Animated grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(#118C4C 1px, transparent 1px), linear-gradient(90deg, #118C4C 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-radial-[ellipse_60%_50%_at_50%_50%] from-[#118C4C]/20 to-transparent" />

        <div className="relative container mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-16">
          {/* Left text */}
          <div className="flex-1 text-center lg:text-left z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#118C4C]/40 bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] mb-5">
                <Handshake className="h-3.5 w-3.5" /> Partners
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
                Built Together,<br />
                <span className="text-[#118C4C]">Growing Together</span>
              </h1>
              <p className="text-white/60 text-base max-w-md mx-auto lg:mx-0 leading-relaxed">
                Foodra's ecosystem is powered by world-class technology providers and impact partners who share our vision for African food security.
              </p>
            </motion.div>
          </div>

          {/* Orbit diagram */}
          <div className="relative flex-shrink-0 w-[380px] h-[380px]">
            {/* Centre */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-full bg-[#118C4C] shadow-[0_0_40px_8px_rgba(17,140,76,0.5)] flex items-center justify-center"
              >
                <span className="text-white text-xs font-bold tracking-tight">FOODRA</span>
              </motion.div>
            </div>

            {/* Orbit rings + nodes */}
            {ORBIT_CONFIGS.map((orbit, oi) => (
              <div key={oi} className="absolute inset-0 flex items-center justify-center">
                {/* Ring */}
                <div
                  className="absolute rounded-full border border-[#118C4C]/20"
                  style={{ width: orbit.r * 2, height: orbit.r * 2 }}
                />
                {/* Orbiting nodes */}
                {orbit.items.map((pi, ni) => {
                  const p = partners[pi]
                  const Icon = p.icon
                  const startAngle = (ni / orbit.items.length) * 360
                  return (
                    <motion.div
                      key={pi}
                      className="absolute"
                      style={{ width: orbit.r * 2, height: orbit.r * 2 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: orbit.duration, repeat: Infinity, ease: "linear" }}
                    >
                      <motion.div
                        className="absolute"
                        style={{
                          top: 0,
                          left: "50%",
                          transform: `translateX(-50%) translateY(-50%) rotate(${startAngle}deg)`,
                          transformOrigin: `0 ${orbit.r}px`,
                        }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: orbit.duration, repeat: Infinity, ease: "linear" }}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.color} shadow-lg ${p.glow} flex items-center justify-center`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </div>
            ))}

            {/* Floating labels */}
            {partners.map((p, i) => {
              const positions = [
                { top: "8%", left: "68%" },
                { top: "42%", left: "88%" },
                { top: "75%", left: "60%" },
                { top: "42%", left: "-4%" },
              ]
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className="absolute text-center pointer-events-none"
                  style={positions[i]}
                >
                  <p className="text-white text-[10px] font-semibold leading-tight">{p.name}</p>
                  <p className="text-white/40 text-[9px]">{p.sub}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Partner type cards ── */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {partnerTypes.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-[#118C4C]/20 bg-card p-6 hover:border-[#118C4C]/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[#118C4C]/10 flex items-center justify-center mb-4">
                  <p.icon className="h-6 w-6 text-[#118C4C]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Partner cards */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Our Current Partners</h2>
            <p className="text-muted-foreground">The platforms and protocols that make Foodra possible.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {partners.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group rounded-2xl border border-border bg-card p-6 hover:border-[#118C4C]/50 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-foreground">{p.name}</h3>
                        <Link href={p.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-[#118C4C] flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Globe className="h-3 w-3" /> Visit <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <span className="text-xs text-[#118C4C] font-medium bg-[#118C4C]/10 px-2 py-0.5 rounded-full">{p.category}</span>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Become a partner CTA ── */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="rounded-2xl bg-gradient-to-br from-[#118C4C] to-[#0d6d3a] p-10 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
            <Handshake className="h-10 w-10 text-white/80 mx-auto mb-4 relative z-10" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 relative z-10">Become a Partner</h2>
            <p className="text-white/85 mb-6 max-w-lg mx-auto text-sm leading-relaxed relative z-10">
              Are you an organisation, investor, or technology provider aligned with our mission? We'd love to explore how we can grow together.
            </p>
            <Link href="/contact" className="relative z-10 inline-block">
              <Button variant="white">Get in Touch</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
