"use client"

import { useState, useRef } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { ChevronDown, ChevronUp, Send, Paperclip, Loader2, CheckCircle } from "lucide-react"
import type { AdminData } from "@/app/admin/page"
import { useToast } from "@/lib/toast"
import { authFetch } from "@/lib/authFetch"

export function getUnreadSupportCount(supportMessages: any[]): number {
  const byUser: Record<string, any[]> = {}
  for (const msg of supportMessages) {
    if (!byUser[msg.user_id]) byUser[msg.user_id] = []
    byUser[msg.user_id].push(msg)
  }
  return Object.values(byUser).filter(msgs => {
    const last = msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).at(-1)
    return last && !last.is_admin_reply
  }).length
}

export default function AdminSupport({ data, privyId, onRefresh }: {
  data: AdminData; privyId?: string; onRefresh: () => void
}) {
  const { toast, confirm } = useToast()
  const { getAccessToken } = usePrivy()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const activeUserId = useRef<string | null>(null)

  const byUser: Record<string, any[]> = {}
  for (const msg of [...data.supportMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())) {
    if (!byUser[msg.user_id]) byUser[msg.user_id] = []
    byUser[msg.user_id].push(msg)
  }

  const sortedUserIds = Object.keys(byUser).sort((a, b) => {
    const lastA = byUser[a][byUser[a].length - 1]?.created_at || ""
    const lastB = byUser[b][byUser[b].length - 1]?.created_at || ""
    return new Date(lastB).getTime() - new Date(lastA).getTime()
  })

  const sendReply = async (userId: string, imageBase64?: string) => {
    const text = replyText[userId]?.trim()
    if (!text && !imageBase64) return
    setSending(true)
    await authFetch(getAccessToken, "/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message: text || "📎 Image", imageBase64: imageBase64 || null, isAdminReply: true }),
    })
    setReplyText(prev => ({ ...prev, [userId]: "" }))
    setSending(false)
    onRefresh()
  }

  const resolve = async (userId: string) => {
    const ok = await confirm({ title: "Resolve Conversation", message: "Mark as resolved and clear all messages for this user?", confirmLabel: "Resolve", danger: true })
    if (!ok) return
    const res = await authFetch(getAccessToken, "/api/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) { toast.success("Conversation resolved."); setExpanded(null); onRefresh() }
    else toast.error("Failed to resolve conversation.")
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const userId = activeUserId.current
    if (!file || !userId) return
    setUploading(true)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    await sendReply(userId, base64)
    setUploading(false)
    e.target.value = ""
  }

  if (sortedUserIds.length === 0) return (
    <div className="p-12 text-center text-muted-foreground">
      <p className="font-medium">No support messages yet</p>
    </div>
  )

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {sortedUserIds.map(userId => {
          const messages = byUser[userId]
          const user = data.users.find((u: any) => u.id === userId)
          const isOpen = expanded === userId
          const lastMsg = messages[messages.length - 1]
          const unanswered = !lastMsg?.is_admin_reply

          return (
            <div key={userId}>
              <button onClick={() => setExpanded(isOpen ? null : userId)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted dark:hover:bg-gray-800/50 text-left transition-colors">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">{(user?.name || "U")[0].toUpperCase()}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{user?.name || "Unknown User"}</span>
                    <span className="text-xs text-muted-foreground ml-2">{new Date(lastMsg?.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{lastMsg?.is_admin_reply ? "You: " : ""}{lastMsg?.message}</p>
                    {unanswered && <span className="ml-2 flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" />}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-border dark:border-border bg-muted bg-card/30">
                  <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
                    {messages.map((msg: any) => (
                      <div key={msg.id} className={`flex items-end gap-2 ${msg.is_admin_reply ? "flex-row-reverse" : "flex-row"}`}>
                        {!msg.is_admin_reply && (
                          user?.avatar_url
                            ? <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mb-1" />
                            : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1">{(user?.name || "U")[0].toUpperCase()}</div>
                        )}
                        <div className={`max-w-[75%] flex flex-col ${msg.is_admin_reply ? "items-end" : "items-start"}`}>
                          <div className={`rounded-2xl px-4 py-2.5 text-sm ${msg.is_admin_reply ? "bg-green-600 text-white rounded-br-sm" : "bg-card bg-card text-foreground text-foreground border border-border dark:border-border rounded-bl-sm shadow-sm"}`}>
                            {msg.image_url && <a href={msg.image_url} target="_blank" rel="noopener noreferrer"><img src={msg.image_url} alt="attachment" className="rounded-xl mb-2 max-w-full max-h-48 object-cover" /></a>}
                            {msg.message !== "📎 Image" && <p>{msg.message}</p>}
                          </div>
                          <span className="text-[10px] mt-1 text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 pb-3 flex items-center gap-2">
                    <button onClick={() => { activeUserId.current = userId; fileRef.current?.click() }} disabled={uploading}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-card bg-card border border-border dark:border-border text-muted-foreground hover:text-green-600 transition-colors flex-shrink-0">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                    <input value={replyText[userId] || ""} onChange={e => setReplyText(prev => ({ ...prev, [userId]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply(userId)}
                      placeholder="Reply to user…"
                      className="flex-1 text-sm bg-card bg-card border border-border dark:border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <button onClick={() => sendReply(userId)} disabled={sending || !replyText[userId]?.trim()}
                      className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                    <button onClick={() => resolve(userId)} title="Mark as resolved"
                      className="w-9 h-9 bg-gray-200 bg-card hover:bg-green-100 dark:hover:bg-green-900/30 text-muted-foreground hover:text-green-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
