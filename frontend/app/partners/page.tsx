"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { motion, useAnimationControls } from "framer-motion"
import { Handshake, Globe, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// ── Partner brand logos as inline SVG ──────────────────────────────────────
const PartnerLogos: Record<string, React.FC<{ size?: number }>> = {
  Base: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 111 111" fill="none">
      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
      <path d="M55.7 80.8a25.4 25.4 0 1 0 0-50.8c-12.5 0-22.9 9-24.9 20.8h33.2v9.2H30.8c2 11.8 12.4 20.8 24.9 20.8z" fill="white" />
    </svg>
  ),
  Privy: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#FF6B6B" />
      <path d="M12 28V14h9a7 7 0 0 1 0 14H12z" fill="white" />
      <rect x="12" y="23" width="5" height="5" fill="#FF6B6B" />
    </svg>
  ),
  Supabase: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 109 113" fill="none">
      <path d="M63.7 0.3a6 6 0 0 0-10.1 4.5v48l-37-49A6 6 0 0 0 6 7.5v97.3a6 6 0 0 0 9.6 4.8l37.2-28.8v27.5a6 6 0 0 0 10.2 4.3l43-45.2a6 6 0 0 0 0-8.5L63.7.3z" fill="#3ECF8E" />
    </svg>
  ),
  MoonPay: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#7B2FF7" />
      <path d="M26.5 10a12 12 0 1 1-14.8 14.8A8.5 8.5 0 0 0 26.5 10z" fill="white" />
    </svg>
  ),
}

const partners = [
  { name: "Base", sub: "Coinbase L2", category: "Blockchain Infrastructure", description: "Foodra is built on Base — Coinbase's Ethereum L2 — enabling fast, low-cost USDC payments and on-chain escrow.", url: "https://base.org", ring: 0, angle: 0 },
  { name: "Privy", sub: "Auth & Wallets", category: "Authentication", description: "Seamless wallet-based sign-in — no prior crypto knowledge needed for farmers and buyers.", url: "https://privy.io", ring: 1, angle: 60 },
  { name: "Supabase", sub: "PostgreSQL", category: "Data Infrastructure", description: "Secure, scalable storage for all platform data — products, orders, users — with real-time updates.", url: "https://supabase.com", ring: 0, angle: 180 },
  { name: "MoonPay", sub: "Fiat On-Ramp", category: "Finance", description: "Convert Naira to USDC directly inside the Foodra wallet — no exchange or bank account needed.", url: "https://moonpay.com", ring: 1, angle: 240 },
]

const RINGS = [
  { radius: 120, duration: 16 },
  { radius: 195, duration: 26 },
]

function OrbitNode({ partner, ringRadius, ringDuration, startAngle, paused }: {
  partner: typeof partners[0]
  ringRadius: number
  ringDuration: number
  startAngle: number
  paused: boolean
}) {
  const Logo = PartnerLogos[partner.name]
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={{ rotate: paused ? undefined : 360 }}
      transition={{ duration: ringDuration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
      style={{ rotate: startAngle }}
    >
      <motion.div
        style={{ y: -ringRadius }}
        animate={{ rotate: paused ? undefined : -360 }}
        transition={{ duration: ringDuration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
      >
        <Link href={partner.url} target="_blank" rel="noopener noreferrer">
          <motion.div
            whileHover={{ scale: 1.25 }}
            className="w-12 h-12 rounded-full bg-background dark:bg-[#0d1a12] border-2 border-[#118C4C]/40 dark:border-[#118C4C]/60 shadow-lg shadow-[#118C4C]/10 flex items-center justify-center cursor-pointer relative group"
          >
            <Logo size={28} />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              <div className="bg-[#050e0a] dark:bg-[#0d1a12] border border-[#118C4C]/40 rounded-lg px-3 py-1.5 text-center shadow-xl">
                <p className="text-white text-xs font-bold">{partner.name}</p>
                <p className="text-[#118C4C] text-[10px]">{partner.sub}</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    </motion.div>
  )
}

const partnerTypes = [
  { icon: Globe, title: "Technology Partners", description: "Infrastructure, tools, and APIs powering the Foodra platform." },
  { icon: Handshake, title: "Agricultural Partners", description: "NGOs, cooperatives, and government bodies supporting smallholder farmers." },
  { icon: Mail, title: "Funding Partners", description: "Investors, grants, and financial institutions fuelling our growth." },
]

export default function PartnersPage() {
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── Futuristic Hero ── */}
      <section className="relative py-20 px-4 bg-[#030c06] dark:bg-[#030c06] overflow-hidden">
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(#118C4C 1px,transparent 1px),linear-gradient(90deg,#118C4C 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        {/* Radial glow */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(17,140,76,0.18) 0%, transparent 70%)" }} />
        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#118C4C]/60 to-transparent"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative container mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left */}
          <motion.div className="flex-1 text-center lg:text-left z-10" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#118C4C]/40 bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] mb-5">
              <Handshake className="h-3.5 w-3.5" /> Partners
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
              Built Together,<br />
              <span className="bg-gradient-to-r from-[#118C4C] to-[#4ade80] bg-clip-text text-transparent">Growing Together</span>
            </h1>
            <p className="text-white/50 text-base max-w-md mx-auto lg:mx-0 leading-relaxed mb-6">
              Foodra's ecosystem is powered by world-class technology partners who share our vision for African food security.
            </p>
            <button
              onClick={() => setPaused(p => !p)}
              className="text-xs border border-[#118C4C]/40 text-[#118C4C] px-4 py-2 rounded-full hover:bg-[#118C4C]/10 transition-colors"
            >
              {paused ? "▶ Resume Orbits" : "⏸ Pause Orbits"}
            </button>
          </motion.div>

          {/* Orbit diagram */}
          <div
            className="relative flex-shrink-0"
            style={{ width: 430, height: 430 }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Outer decorative ring glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[395px] h-[395px] rounded-full border border-[#118C4C]/10 shadow-[0_0_60px_4px_rgba(17,140,76,0.08)]" />
            </div>

            {/* Orbit rings */}
            {RINGS.map((ring, i) => (
              <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="rounded-full border border-dashed border-[#118C4C]/25"
                  style={{ width: ring.radius * 2, height: ring.radius * 2 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: ring.duration * 4, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ))}

            {/* Tick marks on rings */}
            {RINGS.map((ring, ri) =>
              Array.from({ length: 12 }).map((_, ti) => {
                const a = (ti / 12) * 360
                const rad = (a * Math.PI) / 180
                const cx = 215 + ring.radius * Math.sin(rad)
                const cy = 215 - ring.radius * Math.cos(rad)
                return (
                  <div
                    key={`${ri}-${ti}`}
                    className="absolute w-1 h-1 rounded-full bg-[#118C4C]/30 pointer-events-none"
                    style={{ left: cx - 2, top: cy - 2 }}
                  />
                )
              })
            )}

            {/* Centre core */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Pulse rings */}
                {[1, 2, 3].map((n) => (
                  <motion.div
                    key={n}
                    className="absolute rounded-full border border-[#118C4C]/20"
                    style={{ inset: -n * 12 }}
                    animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: n * 0.5, ease: "easeOut" }}
                  />
                ))}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#118C4C] to-[#0a5c30] shadow-[0_0_50px_10px_rgba(17,140,76,0.4)] flex items-center justify-center z-10 relative">
                  <span className="text-white text-[9px] font-bold tracking-widest">FOODRA</span>
                </div>
              </motion.div>
            </div>

            {/* Orbiting partner nodes */}
            <div className="absolute inset-0">
              {partners.map((p) => {
                const ring = RINGS[p.ring]
                return (
                  <OrbitNode
                    key={p.name}
                    partner={p}
                    ringRadius={ring.radius}
                    ringDuration={paused ? 999999 : ring.duration}
                    startAngle={p.angle}
                    paused={paused}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner type cards ── */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            {partnerTypes.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-[#118C4C]/20 bg-card p-6 hover:border-[#118C4C]/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#118C4C]/10 flex items-center justify-center mb-4">
                  <p.icon className="h-6 w-6 text-[#118C4C]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Our Current Partners</h2>
            <p className="text-muted-foreground">The platforms and protocols that make Foodra possible.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {partners.map((p, i) => {
              const Logo = PartnerLogos[p.name]
              return (
                <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link href={p.url} target="_blank" rel="noopener noreferrer" className="group block rounded-2xl border border-border bg-card p-6 hover:border-[#118C4C]/60 hover:shadow-xl hover:shadow-[#118C4C]/5 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Logo size={28} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-foreground group-hover:text-[#118C4C] transition-colors">{p.name}</h3>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#118C4C]">
                            Visit <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                        <span className="text-xs text-[#118C4C] font-medium bg-[#118C4C]/10 px-2 py-0.5 rounded-full">{p.category}</span>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="rounded-2xl bg-gradient-to-br from-[#118C4C] to-[#0d6d3a] p-10 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
            <Handshake className="h-10 w-10 text-white/80 mx-auto mb-4 relative z-10" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 relative z-10">Become a Partner</h2>
            <p className="text-white/85 mb-6 max-w-lg mx-auto text-sm leading-relaxed relative z-10">
              Are you an organisation, investor, or technology provider aligned with our mission? We'd love to grow together.
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
