"use client"

import { User } from "@/lib/types"
import { motion } from "framer-motion"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface UserCardProps {
  user: User
}

export function UserCard({ user }: UserCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(user.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Link href={`/users/${user.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center text-center h-full cursor-pointer hover:shadow-lg transition-shadow"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-24 h-24 rounded-full mb-4 border-2 border-gray-200 dark:border-gray-700"
        />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h3>
        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
        <div className="mt-4 flex items-center space-x-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.id}
          </p>
          <button
            onClick={handleCopy}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>
      </motion.div>
    </Link>
  )
}
