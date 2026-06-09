"use client"

import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Handshake, Globe, Mail, ArrowRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

// ── Real brand logos (inline SVG, accurate shapes + colors) ─────────────────
function LogoBase({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 111 111" fill="none">
      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
      <path d="M55.7 80.8a25.4 25.4 0 1 0 0-50.8c-12.5 0-22.9 9-24.9 20.8h33.2v9.2H30.8c2 11.8 12.4 20.8 24.9 20.8z" fill="white" />
    </svg>
  )
}
function LogoPrivy({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="22" fill="#F03A3A" />
      <rect x="22" y="22" width="16" height="56" rx="4" fill="white" />
      <path d="M38 22h18a18 18 0 0 1 0 36H38V22z" fill="white" />
    </svg>
  )
}
function LogoSupabase({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 109 113" fill="none">
      <path d="M63.7 0.3a6 6 0 0 0-10.1 4.5v48l-37-49A6 6 0 0 0 6 7.5v97.3a6 6 0 0 0 9.6 4.8l37.2-28.8v27.5a6 6 0 0 0 10.2 4.3l43-45.2a6 6 0 0 0 0-8.5L63.7.3z" fill="#3ECF8E" />
    </svg>
  )
}
function LogoMoonPay({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="22" fill="#7B2FF7" />
      <path d="M66 22a28 28 0 1 1-35.5 35.5A21 21 0 0 0 66 22z" fill="white" />
    </svg>
  )
}

const PARTNERS = [
  {
    name: "Base",
    sub: "Coinbase L2",
    category: "Blockchain Infrastructure",
    description: "Foodra is built on Base — Coinbase's Ethereum L2 — enabling fast, low-cost USDC payments and on-chain escrow for every transaction.",
    url: "https://base.org",
    Logo: LogoBase,
    accent: "#0052FF",
    ring: 0,
    startDeg: 0,
  },
  {
    name: "Privy",
    sub: "Auth & Wallets",
    category: "Authentication",
    description: "Seamless wallet-based sign-in — no prior crypto knowledge needed. Farmers and buyers log in with a tap.",
    url: "https://privy.io",
    Logo: LogoPrivy,
    accent: "#F03A3A",
    ring: 1,
    startDeg: 90,
  },
  {
    name: "Supabase",
    sub: "PostgreSQL",
    category: "Data Infrastructure",
    description: "Secure, scalable storage for all platform data — products, orders, users — with real-time updates.",
    url: "https://supabase.com",
    Logo: LogoSupabase,
    accent: "#3ECF8E",
    ring: 0,
    startDeg: 180,
  },
  {
    name: "MoonPay",
    sub: "Fiat On-Ramp",
    category: "Finance",
    description: "Convert Naira to USDC directly inside the Foodra wallet — no exchange or bank account needed.",
    url: "https://moonpay.com",
    Logo: LogoMoonPay,
    accent: "#7B2FF7",
    ring: 1,
    startDeg: 270,
  },
]

// Two rings: inner shorter duration = faster orbit
const RINGS = [
  { r: 115, duration: "14s" },
  { r: 190, duration: "22s" },
]

const partnerTypes = [
  { icon: Globe, title: "Technology Partners", description: "Infrastructure, tools, and APIs powering the Foodra platform." },
  { icon: Handshake, title: "Agricultural Partners", description: "NGOs, cooperatives, and government bodies supporting smallholder farmers." },
  { icon: Mail, title: "Funding Partners", description: "Investors, grants, and financial institutions fuelling our growth." },
]

// Inject global keyframe once
const ORBIT_CSS = `
@keyframes orbit-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
@keyframes orbit-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
@keyframes ring-spin { from { transform: rotate(0deg) scaleX(1.06); } to { transform: rotate(360deg) scaleX(1.06); } }
@keyframes core-pulse { 0%,100% { box-shadow: 0 0 30px 6px rgba(17,140,76,.5); } 50% { box-shadow: 0 0 55px 14px rgba(17,140,76,.7); } }
@keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }
`

export default function PartnersPage() {
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="min-h-screen overflow-x-hidden">
      <style>{ORBIT_CSS}</style>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#020d05 0%,#051509 50%,#020d05 100%)" }}
      >
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#22c55e 1px,transparent 1px),linear-gradient(90deg,#22c55e 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
        {/* Radial glow centre */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 55% 55% at 72% 50%, rgba(17,140,76,.22) 0%, transparent 65%)" }} />
        {/* Scan line */}
        <div className="absolute left-0 right-0 h-[1px] pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(17,140,76,.7),transparent)", animation: "scan 7s linear infinite" }} />

        <div className="relative container mx-auto max-w-6xl flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* ── Left copy ── */}
          <motion.div className="flex-1 text-center lg:text-left z-10 order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#118C4C]/40 bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] mb-5">
              <Handshake className="h-3.5 w-3.5" /> Partners
            </span>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-white mb-5 leading-tight">
              Built Together,<br />
              <span className="bg-gradient-to-r from-[#118C4C] to-[#4ade80] bg-clip-text text-transparent">Growing Together</span>
            </h1>
            <p className="text-white/50 text-base max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
              Foodra's ecosystem is powered by world-class technology partners who share our vision for African food security.
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <button
                onClick={() => setPaused(p => !p)}
                className="inline-flex items-center gap-2 text-xs border border-[#118C4C]/40 text-[#118C4C] px-4 py-2 rounded-full hover:bg-[#118C4C]/10 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${paused ? "bg-amber-400" : "bg-[#118C4C] animate-pulse"}`} />
                {paused ? "Resume Orbits" : "Pause Orbits"}
              </button>
            </div>
          </motion.div>

          {/* ── Orbit diagram ── */}
          <div
            className="relative flex-shrink-0 order-1 lg:order-2"
            style={{ width: 420, height: 420 }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => { setPaused(false); setHovered(null) }}
          >
            {/* Orbit ring tracks */}
            {RINGS.map((ring, i) => (
              <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Static ring */}
                <div className="absolute rounded-full border border-[#118C4C]/15"
                  style={{ width: ring.r * 2, height: ring.r * 2 }} />
                {/* Spinning dashed ring */}
                <div className="absolute rounded-full"
                  style={{
                    width: ring.r * 2, height: ring.r * 2,
                    border: "1px dashed rgba(17,140,76,.3)",
                    animation: `orbit-cw ${parseInt(ring.duration) * 5}s linear infinite`,
                    animationPlayState: paused ? "paused" : "running",
                  }} />
                {/* Tick dots */}
                {Array.from({ length: 16 }).map((_, t) => {
                  const a = (t / 16) * 2 * Math.PI
                  const cx = 210 + ring.r * Math.sin(a)
                  const cy = 210 - ring.r * Math.cos(a)
                  return (
                    <div key={t} className="absolute w-1 h-1 rounded-full bg-[#118C4C]/25"
                      style={{ left: cx - 2, top: cy - 2 }} />
                  )
                })}
              </div>
            ))}

            {/* Orbiting partner nodes */}
            {PARTNERS.map((p) => {
              const ring = RINGS[p.ring]
              const isHov = hovered === p.name
              return (
                <div key={p.name}
                  className="absolute"
                  style={{
                    top: 0, left: 0, width: "100%", height: "100%",
                    transform: `rotate(${p.startDeg}deg)`,
                    animation: `orbit-cw ${ring.duration} linear infinite`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                >
                  {/* counter-rotate so logo stays upright */}
                  <div style={{
                    position: "absolute",
                    top: `calc(50% - ${ring.r}px - 24px)`,
                    left: "calc(50% - 24px)",
                    animation: `orbit-ccw ${ring.duration} linear infinite`,
                    animationPlayState: paused ? "paused" : "running",
                  }}>
                    <Link
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setHovered(p.name)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div
                        className="relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
                        style={{
                          background: "rgba(5,14,8,0.85)",
                          border: `2px solid ${isHov ? p.accent : "rgba(17,140,76,0.4)"}`,
                          boxShadow: isHov ? `0 0 20px 4px ${p.accent}55, 0 0 40px 8px ${p.accent}22` : "0 0 10px 2px rgba(17,140,76,.15)",
                          transition: "all .2s",
                          transform: isHov ? "scale(1.4)" : "scale(1)",
                        }}
                      >
                        <p.Logo size={26} />
                        {/* Tooltip */}
                        {isHov && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none z-50 whitespace-nowrap"
                            style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,.5))" }}>
                            <div className="rounded-xl px-3 py-2 text-center"
                              style={{ background: "rgba(5,14,8,.95)", border: `1px solid ${p.accent}55` }}>
                              <p className="text-white text-xs font-bold">{p.name}</p>
                              <p className="text-[10px] mt-0.5" style={{ color: p.accent }}>{p.sub}</p>
                              <p className="text-white/40 text-[9px] mt-0.5 flex items-center gap-1 justify-center">
                                Click to visit <ExternalLink size={8} />
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                </div>
              )
            })}

            {/* Centre core */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              {/* Expanding pulse rings */}
              {[0, 1, 2].map((n) => (
                <motion.div key={n} className="absolute rounded-full border border-[#118C4C]/30"
                  animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: n * 0.8, ease: "easeOut" }}
                  style={{ width: 72, height: 72 }} />
              ))}
              <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                style={{
                  background: "linear-gradient(135deg, #118C4C, #0a5c30)",
                  animation: "core-pulse 2.5s ease-in-out infinite",
                }}>
                <span className="text-white text-[8px] font-black tracking-[0.2em]">FOODRA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PARTNER TYPE CARDS ════════════════════════════════════════════════ */}
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
            {PARTNERS.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link href={p.url} target="_blank" rel="noopener noreferrer"
                  className="group block rounded-2xl border border-border bg-card p-6 hover:shadow-xl transition-all"
                  style={{ "--accent": p.accent } as React.CSSProperties}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <p.Logo size={28} />
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
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
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
