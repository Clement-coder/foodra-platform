"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, ShoppingBag, GraduationCap, DollarSign, Plus } from "lucide-react"
import { motion } from "framer-motion"

const tabs = [
  { name: "Home", href: "/", icon: Home },
  { name: "Market", href: "/marketplace", icon: ShoppingBag },
  null, // center slot for List button
  { name: "Funding", href: "/funding", icon: DollarSign },
  { name: "Training", href: "/training", icon: GraduationCap },
]

export function BottomTabBar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href))

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border shadow-lg pwa-bottom-nav"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-1 py-2">
        {tabs.map((tab, i) => {
          if (tab === null) {
            // Center "List" button — raised prominent CTA
            return (
              <Link
                key="list"
                href="/listing/new"
                className="relative -top-5 flex flex-col items-center gap-0.5"
              >
                <span className="flex items-center justify-center h-14 w-14 rounded-full bg-[#118C4C] shadow-lg shadow-[#118C4C]/40 border-4 border-card">
                  <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-semibold text-[#118C4C]">List</span>
              </Link>
            )
          }

          const active = isActive(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                active
                  ? "text-[#118C4C] bg-[#118C4C]/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
