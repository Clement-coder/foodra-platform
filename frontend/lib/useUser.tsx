"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import type { User } from "./types"
import { generateAvatarUrl } from "./avatarGenerator"
import { getGoogleLinkedAccount, getPrivyProfilePicture } from "./privyUser"
import { authFetch } from "./authFetch"

export function useUser() {
  const { user: privyUser, authenticated, ready, getAccessToken } = usePrivy()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const privyUserAny = privyUser as any

  const getPrivyName = () =>
    getGoogleLinkedAccount(privyUser as any)?.name ||
    privyUserAny?.google?.name ||
    privyUser?.email?.address?.split("@")[0] ||
    "User"
  const getPrivyEmail = () =>
    getGoogleLinkedAccount(privyUser as any)?.email ||
    privyUserAny?.google?.email ||
    privyUser?.email?.address ||
    ""
  const getPrivyWallet = () => privyUser?.wallet?.address || ""
  const getPrivyAvatar = () => {
    const profilePicture = getPrivyProfilePicture(privyUser as any)
    if (profilePicture) return profilePicture
    return generateAvatarUrl(privyUser?.id || "")
  }

  const buildFallbackUser = (): User | null => {
    if (!privyUser) return null
    return {
      id: privyUser.id,
      name: getPrivyName(),
      email: getPrivyEmail(),
      avatar: getPrivyAvatar(),
      wallet: getPrivyWallet(),
      createdAt: new Date().toISOString(),
      phone: "",
      role: "buyer",
      location: undefined,
      linked_accounts: privyUserAny?.linkedAccounts || [],
    }
  }

  useEffect(() => {
    if (!ready) return
    setIsLoading(true)

    const syncUser = async () => {
      if (authenticated && privyUser) {
        try {
          const response = await authFetch(getAccessToken, "/api/users/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: getPrivyName(),
              email: getPrivyEmail(),
              wallet: getPrivyWallet(),
              avatar: getPrivyAvatar(),
            }),
          })

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}))
            throw new Error(errorBody?.error || "Failed to sync user in Supabase")
          }

          const syncedUser = await response.json()
          setCurrentUser({
            ...syncedUser,
            name: getPrivyName(),
            email: getPrivyEmail(),
            wallet: getPrivyWallet(),
            linked_accounts: privyUserAny?.linkedAccounts || [],
          })
        } catch (err) {
          console.error('Error syncing user:', err)
          setCurrentUser(buildFallbackUser())
        }
      } else {
        setCurrentUser(null)
      }

      setIsLoading(false)
    }

    syncUser()
  }, [privyUser, authenticated, ready])

  const updateUser = async (updates: Partial<User>) => {
    if (!currentUser || !privyUser?.id) return false

    try {
      const payload: Record<string, string> = { privyId: privyUser.id }
      if ("phone" in updates && updates.phone !== undefined) payload.phone = updates.phone
      if (updates.location !== undefined) payload.location = updates.location
      if (updates.role !== undefined) payload.role = updates.role

      if (Object.keys(payload).length === 1) return true

      const response = await authFetch(getAccessToken, "/api/users/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody?.error || "Failed to update user profile in Supabase")
      }

      const updatedUser = await response.json()
      setCurrentUser({
        ...updatedUser,
        name: getPrivyName(),
        email: getPrivyEmail(),
        wallet: getPrivyWallet(),
        linked_accounts: privyUserAny?.linkedAccounts || [],
      })
      return true
    } catch (err) {
      console.error('Error updating user:', err)
      return false
    }
  }

  return {
    currentUser,
    isLoading: isLoading || !ready,
    updateUser,
    isEmailMissing: false,
    dismissEmailMissing: () => {},
  }
}
