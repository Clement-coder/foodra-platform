"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { User } from "./types" // Our custom User type
import { generateAvatarUrl } from "./avatarGenerator"
import { loadFromLocalStorage, saveToLocalStorage } from "./localStorage"

export function useUser() {
  const { user: privyUser, authenticated } = usePrivy()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("useUser effect triggered. Authenticated:", authenticated)
    if (authenticated && privyUser) {
      const savedUser = loadFromLocalStorage<User | null>("foodra_user", null)
      if (savedUser && savedUser.id === privyUser.id) {
        setCurrentUser(savedUser)
        setIsLoading(false)
        return
      }

      console.log("Privy user object:", privyUser)
      // In a real application, you would fetch the user data from your backend
      // using privyUser.id as the identifier.
      // For now, we'll mock a user with an avatar.
      const mockUser: User = {
        id: privyUser.id,
        name: privyUser.github?.name || privyUser.google?.name || privyUser.email?.address || "User",
        phone: privyUser.phone?.number || "",
        location: loadFromLocalStorage<string>("user_location", "Unknown"), // Use localStorage for location
        avatar: generateAvatarUrl(privyUser.id), // Generate avatar based on user ID
        email: privyUser.github?.email || privyUser.google?.email || privyUser.email?.address || "",
        createdAt: privyUser.createdAt.toISOString(),
        linked_accounts: privyUser.linkedAccounts,
        role: (loadFromLocalStorage<"farmer" | "buyer">("account_type", "farmer") === "farmer" ? "farmer" : "farmer"), // Use localStorage for role
      }
      console.log("Created mock user:", mockUser)
      setCurrentUser(mockUser)
      saveToLocalStorage("foodra_user", mockUser)
      setIsLoading(false)
    } else if (!authenticated) {
      console.log("User not authenticated.")
      setCurrentUser(null)
      setIsLoading(false)
    }
  }, [authenticated, privyUser])

  const updateUser = (newUserData: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...newUserData }
      setCurrentUser(updatedUser)
      saveToLocalStorage("foodra_user", updatedUser)
      // In a real app, you'd also save this to your backend
      console.log("Updated user data:", updatedUser)
    }
  }

  return { currentUser, isLoading, updateUser }
}
