import Link from "next/link"

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

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 md:p-10 mb-8">
        <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-[#118C4C]/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-lime-100/60 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#118C4C] mb-4">
            About Foodra
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900">Built For Farmers and Buyers</h1>
          <p className="text-slate-600 mt-3 max-w-2xl">
            Foodra is a platform designed to make agricultural commerce simpler, fairer, and more connected.
          </p>
        </div>
      </div>

      <div className="space-y-4">
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

      <div className="mt-8 rounded-2xl border border-[#118C4C]/20 bg-[#118C4C]/5 p-5 md:p-6">
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
