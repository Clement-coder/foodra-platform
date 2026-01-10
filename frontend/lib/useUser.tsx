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
    if (authenticated && privyUser) {
      // Only initialize currentUser if it's null or if the privyUser.id has changed
      if (!currentUser || currentUser.id !== privyUser.id) {
        const savedUser = loadFromLocalStorage<User | null>("foodra_user", null)
        if (savedUser && savedUser.id === privyUser.id && savedUser.email) {
          setCurrentUser(savedUser)
          setIsLoading(false)
          return
        }

        console.log("Privy user object:", privyUser)
        const mockUser: User = {
          id: privyUser.id,
          name:
            privyUser.twitter?.name ||
            privyUser.github?.name ||
            privyUser.google?.name ||
            privyUser.email?.address ||
            "User",
          phone: privyUser.phone?.number || "",
          location: "",
          avatar: generateAvatarUrl(privyUser.id),
          email:
            privyUser.github?.email ||
            privyUser.google?.email ||
            privyUser.email?.address ||
            "",
          createdAt: privyUser.createdAt.toISOString(),
          linked_accounts: privyUser.linkedAccounts,
          role: "farmer", // Default to farmer, can be updated later
        }

        if (!mockUser.email && (privyUser.github || privyUser.twitter)) {
          setIsEmailMissing(true)
        }

        console.log("Created mock user:", mockUser)
        setCurrentUser(mockUser)
        saveToLocalStorage("foodra_user", mockUser)
        setIsLoading(false)
      } else {
        setIsLoading(false)
      }
    } else if (!authenticated) {
      console.log("User not authenticated.")
      setCurrentUser(null)
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
