"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { supabase } from "./supabase"
import { authFetch } from "./authFetch"

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications(userId: string | undefined) {
  const { getAccessToken } = usePrivy()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) return
    const res = await authFetch(getAccessToken, `/api/notifications?userId=${userId}`)
    if (res.ok) setNotifications(await res.json())
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetch()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => prev.map(n => n.id === (payload.new as Notification).id ? payload.new as Notification : n))
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [userId, fetch])

  const markRead = async (notificationId?: string) => {
    if (!userId) return
    // Optimistic update
    setNotifications(prev => prev.map(n =>
      !notificationId || n.id === notificationId ? { ...n, is_read: true } : n
    ))
    await authFetch(getAccessToken, "/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, notificationId }),
    })
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return { notifications, unreadCount, markRead, refetch: fetch }
}
