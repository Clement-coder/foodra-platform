"use client"

import { useState, useEffect } from "react"
import { Send, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { formatTimeAgo } from "@/lib/timeUtils"
import { supabase } from "@/lib/supabase"

interface Comment {
  id: string
  comment: string
  created_at: string
  user_id: string
  users: { name: string; avatar_url: string | null } | null
}

interface ProductCommentsProps {
  productId: string
  currentUserId?: string
  productOwnerId?: string
}

export function ProductComments({ productId, currentUserId, productOwnerId }: ProductCommentsProps) {
  const isOwner = currentUserId && productOwnerId && currentUserId === productOwnerId
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?productId=${productId}`)
    if (res.ok) setComments(await res.json())
  }

  useEffect(() => {
    fetchComments()
    // Realtime new comments
    const channel = supabase
      .channel(`comments:${productId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "product_comments", filter: `product_id=eq.${productId}` },
        () => fetchComments())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [productId])

  const submit = async () => {
    if (!text.trim() || !currentUserId) return
    setSubmitting(true)
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, userId: currentUserId, comment: text }),
    })
    setSubmitting(false)
    if (res.ok) {
      setText("")
      fetchComments()
    } else {
      toast.error("Failed to post comment.")
    }
  }

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[#118C4C]" />
        Comments ({comments.length})
      </h3>

      {/* Input — hidden for product owner */}
      {currentUserId && !isOwner && (
        <div className="flex gap-2 mb-5">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && submit()}
            placeholder="Add a comment…"
            className="flex-1 text-sm border border-border rounded-xl px-4 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40"
          />
          <Button onClick={submit} disabled={!text.trim() || submitting} size="sm"
            className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white px-4 rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* List */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <img
                src={c.users?.avatar_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${c.user_id}`}
                alt=""
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold">{c.users?.name || "User"}</span>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-foreground">{c.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
