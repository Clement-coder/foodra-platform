"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { User } from "./types" // Our custom User type
import { generateAvatarUrl } from "./avatarGenerator"
import { loadFromLocalStorage, saveToLocalStorage } from "./localStorage"

export function useUser() {
  const { user: privyUser, authenticated, ready } = usePrivy()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEmailMissing, setIsEmailMissing] = useState(false)

  useEffect(() => {
    console.log("useUser effect triggered. Ready:", ready, "Authenticated:", authenticated)

    // Wait for Privy to be ready before doing anything
    if (!ready) {
      setIsLoading(true)
      return
    }

    // If not authenticated, clear user and stop loading
    if (!authenticated) {
      console.log("User not authenticated.")
      setCurrentUser(null)
      setIsLoading(false)
      return
    }

    // Guard clause to wait for a valid privyUser object
    if (!privyUser || !privyUser.id) {
      console.log("Waiting for privyUser data...")
      setIsLoading(true)
      return
    }

    // User is authenticated and privyUser is available
    if (authenticated && privyUser) {
      // Only initialize currentUser if it's null or if the privyUser.id has changed
      if (!currentUser || currentUser.id !== privyUser.id) {
        console.log("Initializing user data for:", privyUser.id)
        
        // Load saved user data from local storage
        const savedUser = loadFromLocalStorage<User | null>("foodra_user", null)

        // Combine the saved user data with the latest from Privy in a non-destructive way
        // Data manually entered by the user (in savedUser) is preserved
        const combinedUser: User = {
          // Start with defaults for a new user
          id: privyUser.id,
          location: "",
          avatar: generateAvatarUrl(privyUser.id),
          role: "farmer",

          // Layer the saved user's data on top (if it exists and matches the ID)
          ...(savedUser && savedUser.id === privyUser.id ? savedUser : {}),

          // Finally, layer the latest privy data on top, as it's the ultimate source of truth for these fields
          name:
            privyUser.twitter?.name ||
            privyUser.github?.name ||
            privyUser.google?.name ||
            privyUser.email?.address?.split("@")[0] ||
            savedUser?.name || // Fallback to saved name
            "User",
          phone: privyUser.phone?.number || savedUser?.phone || "", // Prioritize privy, then saved
          email:
            privyUser.github?.email ||
            privyUser.google?.email ||
            privyUser.email?.address ||
            savedUser?.email || // Fallback to saved email
            "",
          createdAt: privyUser.createdAt ? privyUser.createdAt.toISOString() : new Date().toISOString(),
          linked_accounts: privyUser.linkedAccounts || [],
        }

        // Check if email is missing for GitHub/Twitter logins
        if (!combinedUser.email && (privyUser.github || privyUser.twitter)) {
          console.log("Email is missing for social login")
          setIsEmailMissing(true)
        } else {
          setIsEmailMissing(false)
        }

        console.log("Created combined user:", combinedUser)
        setCurrentUser(combinedUser)
        saveToLocalStorage("foodra_user", combinedUser)
        setIsLoading(false)
      } else {
        // User already loaded, just ensure loading is false
        setIsLoading(false)
      }
    }
  }, [ready, authenticated, privyUser]) // Removed currentUser from dependencies to prevent loops

  const updateUser = (newUserData: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...newUserData }
      setCurrentUser(updatedUser)
      saveToLocalStorage("foodra_user", updatedUser)
      
      // Clear email missing flag if email is now provided
      if (updatedUser.email && isEmailMissing) {
        setIsEmailMissing(false)
      }
      
      console.log("Updated user data:", updatedUser)
    }
  }

  const dismissEmailMissing = () => {
    setIsEmailMissing(false)
  }

  // Helper function to check if profile is complete
  const isProfileComplete = () => {
    if (!currentUser) return false
    return !!(
      currentUser.name &&
      currentUser.email &&
      currentUser.phone &&
      currentUser.location &&
      currentUser.role
    )
  }

  return {
    currentUser,
    isLoading,
    updateUser,
    isEmailMissing,
    dismissEmailMissing,
    isProfileComplete: isProfileComplete(),
  }
}