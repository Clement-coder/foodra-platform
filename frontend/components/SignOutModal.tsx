"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"

interface SignOutModalProps {
  isOpen: boolean
  onClose: () => void
  logout: () => Promise<void>
}

export function SignOutModal({ isOpen, onClose, logout }: SignOutModalProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSignedOut, setIsSignedOut] = useState(false)

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    try {
      // Simulate a short delay for the animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      await logout()
      setIsSignedOut(true)
      // Wait for the checkmark animation to show
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      // Optionally, show an error message in the modal
      setIsSigningOut(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Sign Out">
      <div className="text-center">
        <AnimatePresence mode="wait">
          {isSigningOut ? (
            <motion.div
              key="signing-out"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center space-y-4 min-h-[150px]"
            >
              {isSignedOut ? (
                <motion.div
                  key="signed-out"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                >
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="logging-out"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360, transition: { duration: 1, repeat: Infinity, ease: "linear" } }}
                >
                  <LogOut className="h-16 w-16 text-[#118C4C]" />
                </motion.div>
              )}
              <p className="text-lg font-medium text-muted-foreground">
                {isSignedOut ? "Signed Out Successfully" : "Signing you out..."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-muted-foreground mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleConfirmSignOut}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-colors w-full"
                >
                  Confirm Sign Out
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 w-full hover:bg-accent transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
