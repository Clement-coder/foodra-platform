"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, ShoppingBag, GraduationCap, DollarSign, PlusCircle } from "lucide-react"
import { motion } from "framer-motion"

const leftTabs = [
  { name: "Home", href: "/", icon: Home },
  { name: "Market", href: "/marketplace", icon: ShoppingBag },
]

const rightTabs = [
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Funding", href: "/funding", icon: DollarSign },
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border shadow-lg"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {leftTabs.map((tab) => {
          const active = isActive(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                active ? "text-[#118C4C] bg-[#118C4C]/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          )
        })}

        {/* Center List Product button */}
        <Link
          href="/listing/new"
          className={`flex flex-col items-center gap-1 -mt-5 px-3 py-2 rounded-2xl shadow-lg transition-all ${
            isActive("/listing/new")
              ? "bg-[#0d6b3a] text-white scale-105"
              : "bg-[#118C4C] text-white hover:bg-[#0d6b3a]"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold tracking-wide">LIST</span>
        </Link>

        {rightTabs.map((tab) => {
          const active = isActive(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                active ? "text-[#118C4C] bg-[#118C4C]/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
