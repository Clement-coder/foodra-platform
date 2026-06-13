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
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const updateUnreadCount = useCallback((notifs: Notification[]) => {
    const count = notifs.filter(n => !n.is_read).length
    setUnreadCount(count)
  }, [])

  const fetch = useCallback(async () => {
    if (!userId) return
    const res = await authFetch(getAccessToken, `/api/notifications?userId=${userId}`)
    if (res.ok) {
      const fetched = await res.json()
      setNotifications(fetched)
      updateUnreadCount(fetched)
    }
  }, [userId, getAccessToken, updateUnreadCount])

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
        const newNotif = payload.new as Notification
        setNotifications(prev => {
          const updated = [newNotif, ...prev]
          updateUnreadCount(updated)
          return updated
        })
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const updatedNotif = payload.new as Notification
        setNotifications(prev => {
          const updated = prev.map(n => n.id === updatedNotif.id ? updatedNotif : n)
          updateUnreadCount(updated)
          return updated
        })
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [userId, fetch])

  const markRead = async (notificationId?: string) => {
    if (!userId) return
    // Optimistic update
    setNotifications(prev => {
      const updated = prev.map(n =>
        !notificationId || n.id === notificationId ? { ...n, is_read: true } : n
      )
      updateUnreadCount(updated)
      return updated
    })
    await authFetch(getAccessToken, "/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, notificationId }),
    })
  }

  return { notifications, unreadCount, markRead, refetch: fetch }
}
