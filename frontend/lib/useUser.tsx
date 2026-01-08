"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { User } from "./types" // Our custom User type
import { generateAvatarUrl } from "./avatarGenerator"
import { loadFromLocalStorage } from "./localStorage"

export function useUser() {
  const { user: privyUser, authenticated } = usePrivy()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("useUser effect triggered. Authenticated:", authenticated)
    if (authenticated && privyUser) {
      console.log("Privy user object:", privyUser)
      // In a real application, you would fetch the user data from your backend
      // using privyUser.id as the identifier.
      // For now, we'll mock a user with an avatar.
      const mockUser: User = {
        id: privyUser.id,
        name: privyUser.email?.address || "User",
        phone: privyUser.phone?.number || "",
        location: loadFromLocalStorage<string>("user_location", "Unknown"), // Use localStorage for location
        avatar: generateAvatarUrl(privyUser.id), // Generate avatar based on user ID
        email: privyUser.email?.address || "",
        role: loadFromLocalStorage<"farmer" | "buyer">("account_type", "farmer"), // Use localStorage for role
      }
      console.log("Created mock user:", mockUser)
      setCurrentUser(mockUser)
      setIsLoading(false)
    } else if (!authenticated) {
      console.log("User not authenticated.")
      setCurrentUser(null)
      setIsLoading(false)
    }
  }, [authenticated, privyUser])

  return { currentUser, isLoading }
}
