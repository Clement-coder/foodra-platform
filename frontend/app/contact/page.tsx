import { Mail, MapPin, Phone, Clock, Shield } from "lucide-react"
import GetInTouch from "@/components/GetInTouch"

const contactItems = [
  {
    title: "Email",
    value: "support@foodra.app",
    icon: Mail,
    href: "mailto:support@foodra.app",
  },
  {
    title: "Phone",
    value: "+234 800 000 0000",
    icon: Phone,
    href: "tel:+2348000000000",
  },
  {
    title: "Office Address",
    value: "Lagos, Nigeria",
    icon: MapPin,
    href: null,
  },
  {
    title: "Support Hours",
    value: "Mon – Fri, 9am – 6pm WAT",
    icon: Clock,
    href: null,
  },
]

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-[#118C4C]/10 dark:via-card dark:to-card p-6 md:p-10 mb-8">
        <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-[#118C4C]/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-lime-100/60 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#118C4C] mb-4">
            Contact
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">Get In Touch</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Reach out for platform support, partnerships, product feedback, or general inquiries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {contactItems.map((item) => (
          <div key={item.title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <item.icon className="h-5 w-5 text-[#118C4C] mb-3" />
            <p className="text-sm text-muted-foreground">{item.title}</p>
            {item.href ? (
              <a href={item.href} className="text-foreground font-semibold mt-1 hover:text-[#118C4C] transition-colors block">
                {item.value}
              </a>
            ) : (
              <p className="text-foreground font-semibold mt-1">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Trust note for financial platform */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#118C4C]/20 bg-[#118C4C]/5 p-4 mb-8 text-sm text-muted-foreground">
        <Shield className="h-5 w-5 text-[#118C4C] shrink-0 mt-0.5" />
        <p>
          Foodra is a registered technology company operating in Nigeria. We handle financial transactions through blockchain-based escrow and are committed to transparent, secure operations. For disputes or urgent financial concerns, email{" "}
          <a href="mailto:support@foodra.app" className="text-[#118C4C] font-medium hover:underline">
            support@foodra.app
          </a>{" "}
          with your order reference.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border/60">
        <GetInTouch />
      </div>
    </div>
  )
}
