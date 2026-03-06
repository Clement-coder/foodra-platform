export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Information We Collect",
      body: "We collect the details needed to run your account and the platform, including profile data, contact details, wallet information, listing content, and basic usage activity.",
    },
    {
      title: "How We Use Information",
      body: "Your data is used to manage accounts, display marketplace listings, process transactions, improve product performance, and send essential service communications.",
    },
    {
      title: "Sharing of Information",
      body: "We do not sell personal data. Data may be processed by trusted providers that support authentication, hosting, storage, analytics, and platform operations.",
    },
    {
      title: "Data Security",
      body: "We apply reasonable technical and operational safeguards to protect your information. No internet system is fully risk-free, so we continuously improve controls.",
    },
    {
      title: "Your Rights and Choices",
      body: "You can update profile details from your account. For additional data requests, contact support through official platform channels.",
    },
    {
      title: "Contact",
      body: "For privacy requests or concerns, reach us via support channels available in the platform.",
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
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-slate-600 mt-3 max-w-2xl">
            How Foodra collects, uses, and protects your information while you use marketplace and platform services.
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
          Need help? Contact support through Foodra platform channels for privacy requests and account-related issues.
        </p>
      </div>
    </div>
  )
}
