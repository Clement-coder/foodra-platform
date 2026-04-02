"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Paperclip, Loader2 } from "lucide-react"
import { useUser } from "@/lib/useUser"
import { supabase } from "@/lib/supabase"

interface SupportMessage {
  id: string
  user_id: string
  message: string
  image_url: string | null
  is_admin_reply: boolean
  created_at: string
}

export function SupportChat() {
  const { currentUser } = useUser()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !currentUser?.id) return
    fetch(`/api/support?userId=${currentUser.id}`)
      .then(r => r.json())
      .then(setMessages)
  }, [open, currentUser?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async (imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return
    if (!currentUser?.id) return
    setSending(true)
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, message: text || "📎 Image", imageUrl }),
    })
    const msg = await res.json()
    setMessages(prev => [...prev, msg])
    setText("")
    setSending(false)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser?.id) return
    setUploading(true)
    const ext = file.name.split(".").pop()
    const path = `support/${currentUser.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("product-images").upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path)
      await send(data.publicUrl)
    }
    setUploading(false)
    e.target.value = ""
  }

  if (!currentUser) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Support chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Foodra Support</p>
              <p className="text-green-100 text-xs">We typically reply within a few hours</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Send us a message and we'll get back to you!</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.is_admin_reply ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.is_admin_reply
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                    : "bg-green-600 text-white rounded-tr-sm"
                }`}>
                  {msg.image_url && (
                    <img src={msg.image_url} alt="attachment" className="rounded-xl mb-1 max-w-full max-h-40 object-cover" />
                  )}
                  <p>{msg.message !== "📎 Image" ? msg.message : ""}</p>
                  <p className={`text-xs mt-1 ${msg.is_admin_reply ? "text-gray-400" : "text-green-200"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-3 flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-gray-400 hover:text-green-600 transition-colors flex-shrink-0"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type a message…"
              className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={() => send()}
              disabled={sending || (!text.trim())}
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
