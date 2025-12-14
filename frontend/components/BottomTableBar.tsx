"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, ShoppingBag, GraduationCap, DollarSign, User } from "lucide-react"
import { motion } from "framer-motion"

const tabs = [
  { name: "Home", href: "/", icon: Home },
  { name: "Market", href: "/marketplace", icon: ShoppingBag },
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Funding", href: "/funding", icon: DollarSign },
  { name: "Profile", href: "/profile", icon: User },
]

export function BottomTabBar() {
  const pathname = usePathname()

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
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))
          const Icon = tab.icon

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-[#118C4C] bg-[#118C4C]/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              aria-label={tab.name}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
