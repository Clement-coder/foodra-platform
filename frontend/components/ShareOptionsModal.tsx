"use client"

import { useState } from "react"
import { Copy, Facebook, MessageCircle, Send, Share2 } from "lucide-react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { NotificationDiv } from "@/components/NotificationDiv"

interface ShareOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url: string
  text: string
}

export function ShareOptionsModal({ isOpen, onClose, title, url, text }: ShareOptionsModalProps) {
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)

  const openInNewTab = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer")
  }

  const handleNativeShare = async () => {
    try {
      if (!navigator.share) {
        setNotification({ type: "error", message: "Native sharing is not supported on this browser." })
        return
      }
      await navigator.share({ title, text, url })
      setNotification({ type: "success", message: "Shared successfully!" })
    } catch {
      setNotification({ type: "error", message: "Unable to share right now." })
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setNotification({ type: "success", message: "Link copied to clipboard!" })
    } catch {
      setNotification({ type: "error", message: "Failed to copy link." })
    }
  }

  return (
    <>
      {notification && (
        <NotificationDiv
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <Modal isOpen={isOpen} onClose={onClose} title="Share">
        <div className="space-y-3">
          <Button
            onClick={handleNativeShare}
            className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white justify-start gap-2"
          >
            <Share2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Share with device</span>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="justify-start gap-2 bg-transparent p-2 sm:p-3"
              onClick={() => openInNewTab(`https://wa.me/?text=${encodedText}%20${encodedUrl}`)}
            >
              <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="truncate">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2 bg-transparent p-2 sm:p-3"
              onClick={() => openInNewTab(`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`)}
            >
              <Send className="h-4 w-4 text-black dark:text-white flex-shrink-0" />
              <span className="truncate">X / Twitter</span>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2 bg-transparent p-2 sm:p-3"
              onClick={() => openInNewTab(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
            >
              <Facebook className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="truncate">Facebook</span>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2 bg-transparent p-2 sm:p-3"
              onClick={() => openInNewTab(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`)}
            >
              <Send className="h-4 w-4 text-sky-500 flex-shrink-0" />
              <span className="truncate">Telegram</span>
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-transparent"
            onClick={handleCopyLink}
          >
            <Copy className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Copy Link</span>
          </Button>

          <Button variant="ghost" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  )
}
