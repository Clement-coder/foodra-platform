import { Mail, MapPin, Phone } from "lucide-react"
import GetInTouch from "@/components/GetInTouch"

const contactItems = [
  {
    title: "Email",
    value: "support@foodra.app",
    icon: Mail,
  },
  {
    title: "Phone",
    value: "+234 800 000 0000",
    icon: Phone,
  },
  {
    title: "Location",
    value: "Lagos, Nigeria",
    icon: MapPin,
  },
]

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 md:p-10 mb-8">
        <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-[#118C4C]/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-10 h-36 w-36 rounded-full bg-lime-100/60 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#118C4C] mb-4">
            Contact
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900">Get In Touch</h1>
          <p className="text-slate-600 mt-3 max-w-2xl">
            Reach out for platform support, partnerships, product feedback, or general inquiries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {contactItems.map((item) => (
          <div key={item.title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <item.icon className="h-5 w-5 text-[#118C4C] mb-3" />
            <p className="text-sm text-muted-foreground">{item.title}</p>
            <p className="text-foreground font-semibold mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden border border-border/60">
        <GetInTouch />
      </div>
    </div>
  )
}
