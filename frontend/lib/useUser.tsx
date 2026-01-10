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
  const [isEmailMissing, setIsEmailMissing] = useState(false)

  useEffect(() => {
    console.log("useUser effect triggered. Authenticated:", authenticated)

    // Guard clause to wait for a valid privyUser object
    if (!privyUser || !privyUser.id) {
      setIsLoading(true)
      return
    }

    if (authenticated && privyUser) {
      // Only initialize currentUser if it's null or if the privyUser.id has changed
      if (!currentUser || currentUser.id !== privyUser.id) {
        // Load saved user data from local storage.
        const savedUser = loadFromLocalStorage<User | null>("foodra_user", null)

        // Combine the saved user data with the latest from Privy in a non-destructive way.
        // Data manually entered by the user (in savedUser) is preserved.
        const combinedUser: User = {
          // Start with defaults for a new user
          id: privyUser.id,
          name: "User",
          phone: "",
          location: "",
          avatar: generateAvatarUrl(privyUser.id),
          email: "",
          createdAt: privyUser.createdAt.toISOString(),
          linked_accounts: privyUser.linkedAccounts,
          role: "farmer",

          // Layer the saved user's data on top (if it exists and matches the ID)
          ...(savedUser && savedUser.id === privyUser.id ? savedUser : {}),

          // Finally, layer the latest privy data on top, as it's the ultimate source of truth for these fields.
          id: privyUser.id,
          name:
            privyUser.twitter?.name ||
            privyUser.github?.name ||
            privyUser.google?.name ||
            privyUser.email?.address ||
            (savedUser?.name) || // Fallback to saved name
            "User",
          phone: privyUser.phone?.number || (savedUser?.phone) || "", // Prioritize privy, then saved
          email:
            privyUser.github?.email ||
            privyUser.google?.email ||
            privyUser.email?.address ||
            (savedUser?.email) || // Fallback to saved email
            "",
          createdAt: privyUser.createdAt.toISOString(),
          linked_accounts: privyUser.linkedAccounts,
        }

        if (!combinedUser.email && (privyUser.github || privyUser.twitter)) {
          setIsEmailMissing(true)
        }

        console.log("Created combined user:", combinedUser)
        setCurrentUser(combinedUser)
        saveToLocalStorage("foodra_user", combinedUser)
        setIsLoading(false)
      }
    } else if (!authenticated) {
      console.log("User not authenticated.")
      // setCurrentUser(null) // This line is causing a race condition on auth refresh
      setIsLoading(false)
    }
  }, [authenticated, privyUser]) // Removed currentUser from dependencies

  const updateUser = (newUserData: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...newUserData }
      setCurrentUser(updatedUser)
      saveToLocalStorage("foodra_user", updatedUser)
      if (updatedUser.email) {
        setIsEmailMissing(false)
      }
      console.log("Updated user data:", updatedUser)
    }
  }

  const dismissEmailMissing = () => {
    setIsEmailMissing(false)
  }

  return { currentUser, isLoading, updateUser, isEmailMissing, dismissEmailMissing }
}
