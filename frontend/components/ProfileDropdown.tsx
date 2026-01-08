"use client"

import { User } from "@/lib/types"
import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Home, ShoppingBag, GraduationCap, DollarSign, User as UserIcon, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProfileDropdownProps {
  user: User
}

const dropdownLinks = [
  { name: "Profile", href: "/profile", icon: UserIcon },
  { name: "Home", href: "/", icon: Home },
  { name: "Market", href: "/marketplace", icon: ShoppingBag },
  { name: "Training", href: "/training", icon: GraduationCap },
  { name: "Funding", href: "/funding", icon: DollarSign },
]

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
  }

  return (
    <div
      className="relative hidden md:block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Button variant="outline" size="sm" className="gap-2 bg-transparent hover:bg-accent transition-colors">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt="User Avatar"
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <UserIcon className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          Profile
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={dropdownVariants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute right-0 mt-2 w-56 bg-card/80 backdrop-blur-lg border border-border/50 rounded-lg shadow-2xl z-40 overflow-hidden"
          >
            <div className="p-2">
              {dropdownLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 p-3 text-sm text-muted-foreground rounded-md hover:bg-accent/50 hover:text-foreground transition-colors duration-150"
                >
                  <link.icon className="h-5 w-5 text-[#118C4C]" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}