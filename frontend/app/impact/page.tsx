import type { Metadata } from "next"
import { Sprout, Users, TrendingUp, Globe, Leaf, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Our Impact | Foodra",
  description: "See how Foodra is transforming African agriculture — empowering farmers, reducing food waste, and building food security across Nigeria.",
  alternates: { canonical: "https://foodramarket.com/impact" },
}

const stats = [
  { icon: Users, value: "10,000+", label: "Farmers & Buyers Connected", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
  { icon: Sprout, value: "50+", label: "Agricultural Products Available", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
  { icon: TrendingUp, value: "94%", label: "Farmer Satisfaction Rate", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
  { icon: Globe, value: "36", label: "Nigerian States Reached", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
]

const stories = [
  {
    name: "Amina Yusuf",
    location: "Kano State",
    story: "Before Foodra, I sold my tomatoes at the local market for whatever price they offered. Now I list them online and buyers come to me. My income has doubled in 6 months.",
    crop: "Tomatoes & Peppers",
  },
  {
    name: "Chukwuemeka Obi",
    location: "Enugu State",
    story: "The training programs helped me learn drip irrigation. My yam yield increased by 40% this season. I also got approved for a grant through the funding feature.",
    crop: "Yam & Cassava",
  },
  {
    name: "Fatima Bello",
    location: "Kaduna State",
    story: "I was skeptical about crypto payments at first, but the escrow system gave me confidence. I know my money is safe until I confirm delivery. It just works.",
    crop: "Groundnuts & Soybeans",
  },
]

const pillars = [
  {
    icon: Leaf,
    title: "Environmental Sustainability",
    description: "We promote farming practices that protect soil health, reduce chemical use, and preserve Nigeria's agricultural land for future generations.",
  },
  {
    icon: Heart,
    title: "Community Empowerment",
    description: "By cutting out middlemen, farmers earn fairer prices. Every transaction on Foodra puts more money directly into rural farming communities.",
  },
  {
    icon: Globe,
    title: "Food Security",
    description: "Our mission is an Africa that feeds itself. By connecting supply with demand efficiently, we reduce post-harvest losses and improve food availability.",
  },
]

export default function ImpactPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#EAF5ED] to-white dark:from-[#118C4C]/10 dark:to-background py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] mb-4">
            <Sprout className="h-3.5 w-3.5" /> Our Impact
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Growing Africa, One Farm at a Time</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Foodra is more than a marketplace — it's a movement to build food security, empower smallholder farmers, and create a fairer agricultural economy across Africa.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <Card key={s.label} className="border-[#118C4C]/20 text-center">
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-6 w-6 ${s.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">What We Stand For</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Three pillars guide everything we build at Foodra.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((p) => (
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
        </div>
      </section>

      {/* Stories */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">Farmer Stories</h2>
            <p className="text-muted-foreground">Real people, real change.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stories.map((s) => (
              <Card key={s.name} className="border-[#118C4C]/20">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{s.story}"</p>
                  <div className="border-t border-border pt-4">
                    <p className="font-semibold text-foreground text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.location} · {s.crop}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
