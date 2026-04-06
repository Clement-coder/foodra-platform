"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
import { useToast } from "@/lib/toast"

interface SignOutModalProps {
  isOpen: boolean
  onClose: () => void
  logout: () => Promise<void>
}

export function SignOutModal({ isOpen, onClose, logout }: SignOutModalProps) {
  const router = useRouter()
  const { toast } = useToast()
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
      toast.error("Failed to sign out. Please try again.")
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
                <div key="logging-out" className="relative w-16 h-16 mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full"
                  >
                    <div className="w-full h-full rounded-full border-4 border-transparent border-t-[#118C4C] border-r-[#118C4C]" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#118C4C] rounded-full opacity-20"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 text-[#118C4C] animate-spin" />
                  </div>
                </div>
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
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleConfirmSignOut}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-base py-3"
                >
                  Confirm Sign Out
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full text-base py-3"
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
