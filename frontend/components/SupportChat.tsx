"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MessageCircle, X, Send, Paperclip, Loader2, Bot } from "lucide-react"
import { useUser } from "@/lib/useUser"

interface SupportMessage {
  id: string
  user_id: string
  message: string
  image_url: string | null
  is_admin_reply: boolean
  created_at: string
}

const BTN_SIZE = 56

export function SupportChat() {
  const { currentUser } = useUser()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const prevCountRef = useRef(0)

  // Draggable — stored as { right, bottom } to avoid overflow
  const [side, setSide] = useState<"left" | "right">("right")
  const [yPos, setYPos] = useState(24) // distance from bottom
  const dragging = useRef(false)
  const hasDragged = useRef(false)
  const startPointer = useRef({ x: 0, y: 0 })

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    hasDragged.current = false
    startPointer.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = Math.abs(e.clientX - startPointer.current.x)
    const dy = Math.abs(e.clientY - startPointer.current.y)
    if (dx > 4 || dy > 4) hasDragged.current = true
    if (!hasDragged.current) return

    // Clamp Y so button stays on screen
    const newBottom = window.innerHeight - e.clientY - BTN_SIZE / 2
    setYPos(Math.max(8, Math.min(newBottom, window.innerHeight - BTN_SIZE - 8)))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false
    if (!hasDragged.current) {
      setOpen(o => !o)
    } else {
      // Snap to left or right side
      setSide(e.clientX < window.innerWidth / 2 ? "left" : "right")
    }
  }

  const fetchMessages = useCallback(async () => {
    if (!currentUser?.id) return
    const res = await fetch(`/api/support?userId=${currentUser.id}`)
    if (res.ok) setMessages(await res.json())
  }, [currentUser?.id])

  useEffect(() => {
    if (!open || !currentUser?.id) return
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 4000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [open, currentUser?.id, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return
    if (!currentUser?.id) return
    setSending(true)
    const optimistic: SupportMessage = {
      id: `tmp-${Date.now()}`,
      user_id: currentUser.id,
      message: text || "📎 Image",
      image_url: null,
      is_admin_reply: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    const sentText = text
    setText("")
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, message: sentText || "📎 Image", imageBase64, isAdminReply: false }),
    })
    if (res.ok) {
      const saved = await res.json()
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m))
    }
    setSending(false)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    await send(base64)
    setUploading(false)
    e.target.value = ""
  }

  if (!currentUser) return null

  const unreadSupport = messages.filter(m => m.is_admin_reply).length > prevCountRef.current
    ? messages.filter(m => m.is_admin_reply && !open).length
    : 0
  // Count unread admin replies (messages user hasn't seen yet — proxy: admin replies when chat is closed)
  const adminReplies = messages.filter(m => m.is_admin_reply).length
  const unreadCount = open ? 0 : Math.max(0, adminReplies - prevCountRef.current)

  // Track seen count when opened
  if (open && adminReplies > prevCountRef.current) {
    prevCountRef.current = adminReplies
  }

  const btnStyle: React.CSSProperties = {
    position: "fixed",
    bottom: yPos,
    [side]: 16,
  }

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    bottom: yPos + BTN_SIZE + 8,
    [side]: 16,
  }

  return (
    <>
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={btnStyle}
        className="relative z-50 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
        aria-label="Support chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={panelStyle} className="z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-card dark:bg-card rounded-2xl shadow-2xl border border-border dark:border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-card/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Foodra Support</p>
              <p className="text-green-100 text-xs">We typically reply within a few hours</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Send us a message and we'll get back to you!</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.is_admin_reply ? "justify-start" : "justify-end"}`}>
                {/* Support bot avatar */}
                {msg.is_admin_reply && (
                  <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  msg.is_admin_reply
                    ? "bg-muted dark:bg-gray-800 text-foreground dark:text-gray-200 rounded-tl-sm"
                    : "bg-green-600 text-white rounded-tr-sm"
                }`}>
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={msg.image_url} alt="attachment" className="rounded-xl mb-1 max-w-full max-h-40 object-cover" />
                    </a>
                  )}
                  {msg.message !== "📎 Image" && <p>{msg.message}</p>}
                  <p className={`text-xs mt-1 ${msg.is_admin_reply ? "text-muted-foreground" : "text-green-200"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {/* User avatar */}
                {!msg.is_admin_reply && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-green-300">
                    {currentUser.avatar
                      ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      : <div className="w-full h-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                          {(currentUser.name || "U")[0].toUpperCase()}
                        </div>
                    }
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border dark:border-border p-3 flex items-center gap-2 flex-shrink-0">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || sending}
              className="text-muted-foreground hover:text-green-600 transition-colors flex-shrink-0 disabled:opacity-40"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && !sending && send()}
              placeholder="Type a message…"
              className="flex-1 text-sm bg-muted dark:bg-gray-800 border border-border dark:border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground dark:text-white placeholder-gray-400"
            />
            <button
              onClick={() => send()}
              disabled={sending || uploading || !text.trim()}
              className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
