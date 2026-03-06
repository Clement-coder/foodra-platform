export default function TermsOfServicePage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      body: "By using Foodra Platform, you agree to these Terms and applicable laws. If you do not agree, you should stop using the platform.",
    },
    {
      title: "Accounts and Access",
      body: "You are responsible for safeguarding your account and keeping your information accurate. We may suspend accounts involved in abuse, fraud, or policy violations.",
    },
    {
      title: "Marketplace Listings",
      body: "Sellers are responsible for listing accuracy, pricing, legal compliance, product quality, and order fulfillment obligations.",
    },
    {
      title: "Prohibited Conduct",
      body: "You may not misuse the platform, submit illegal or harmful content, attempt unauthorized access, or interfere with normal service operation.",
    },
    {
      title: "Limitation of Liability",
      body: "Foodra services are provided on an as-available basis. To the fullest extent permitted by law, Foodra is not liable for indirect or consequential damages.",
    },
    {
      title: "Changes to Terms",
      body: "We may update these Terms from time to time. Continued platform use after updates means you accept the revised Terms.",
    },
  ]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 md:p-10 mb-8">
        <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-[#118C4C]/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-lime-100/60 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#118C4C] mb-4">
            Legal
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-slate-600 mt-3 max-w-2xl">
            Rules and responsibilities for using Foodra marketplace and platform services.
          </p>
          <p className="text-sm text-slate-500 mt-5">Last updated: March 6, 2026</p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#118C4C]/10 text-xs font-semibold text-[#118C4C]">
                {index + 1}
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">{section.title}</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{section.body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-[#118C4C]/20 bg-[#118C4C]/5 p-5 md:p-6">
        <p className="text-sm text-foreground">
          Questions about these terms? Reach out through official Foodra support channels.
        </p>
      </div>
    </div>
  )
}
