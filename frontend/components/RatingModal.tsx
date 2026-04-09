"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  farmerId: string
  farmerName: string
  buyerId: string
}

export function RatingModal({ isOpen, onClose, orderId, farmerId, farmerName, buyerId }: RatingModalProps) {
  const { toast } = useToast()
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!stars) return
    setSubmitting(true)
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerId, farmerId, orderId, stars }),
    })
    setSubmitting(false)
    if (res.ok) {
      toast.success("Rating submitted! Thank you.")
      onClose()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Failed to submit rating.")
    }
  }

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Your Seller">
      <div className="space-y-6 text-center">
        <div>
          <p className="text-muted-foreground text-sm">How was your experience with</p>
          <p className="font-bold text-lg mt-1">{farmerName}</p>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(n)}
              className="transition-transform hover:scale-110 active:scale-95">
              <Star className={`h-10 w-10 transition-colors ${
                n <= (hovered || stars)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-muted-foreground"
              }`} />
            </button>
          ))}
        </div>

        {(hovered || stars) > 0 && (
          <p className="text-sm font-semibold text-[#118C4C]">{labels[hovered || stars]}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Skip</Button>
          <Button
            onClick={submit}
            disabled={!stars || submitting}
            className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
            {submitting ? "Submitting…" : "Submit Rating"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
