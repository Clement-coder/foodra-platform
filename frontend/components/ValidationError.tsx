"use client"

import { motion } from "framer-motion"

interface ValidationErrorProps {
  message?: string
}

export function ValidationError({ message }: ValidationErrorProps) {
  if (!message) return null

  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-red-600 dark:text-red-400 mt-1"
      role="alert"
    >
      {message}
    </motion.p>
  )
}
