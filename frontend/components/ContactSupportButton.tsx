"use client"

import { MessageCircle } from "lucide-react"

export function ContactSupportButton({ label = "Contact Support" }: { label?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("foodra:open-support-chat"))}
      className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#118C4C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d6d3a] transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </button>
  )
}
