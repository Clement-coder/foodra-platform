"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, ShoppingBag, GraduationCap, TrendingUp, Package } from "lucide-react"
import { motion } from "framer-motion"

const tabs = [
  { name: "Home",     href: "/",              icon: Home },
  { name: "Market",   href: "/marketplace",   icon: ShoppingBag },
  { name: "Orders",   href: "/orders",        icon: Package },
  { name: "Prices",   href: "/market-prices", icon: TrendingUp },
  { name: "Training", href: "/training",      icon: GraduationCap },
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
        {tabs.map((tab) => {
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
