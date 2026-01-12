"use client"

import { useState, useEffect } from "react"
import { UserCard } from "@/components/UserCard"
import { Users, Search, AlertCircle } from "lucide-react"

import { generateAvatarUrl } from "@/lib/avatarGenerator"
import { User } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users")
        if (!res.ok) throw new Error(`Error ${res.status}: Failed to fetch users`)
        const data: any[] = await res.json()

        const formattedUsers: User[] = data.map((user) => {
          interface LinkedAccount {
            type: string
            address: string
          }

          interface UserData {
            id: string
            github?: { username: string }
            discord?: { username: string }
            farcaster?: { username: string }
            linkedAccounts: LinkedAccount[]
            createdAt: Date
          }

          const emailAccount = user.linkedAccounts.find((a: LinkedAccount) => a.type === "email")
          const walletAccount = user.linkedAccounts.find((a: LinkedAccount) => a.type === "wallet")
          const linkedAccountsFormatted = user.linkedAccounts.reduce(
            (acc: Record<string, LinkedAccount>, account: LinkedAccount) => {
              acc[account.type] = account
              return acc
            },
            {} as Record<string, LinkedAccount>
          )

          const name =
            user.github?.username ||
            user.discord?.username ||
            user.farcaster?.username ||
            (emailAccount as any)?.address ||
            "Anonymous"

          return {
            id: user.id,
            name,
            email: (emailAccount as any)?.address || "No email",
            avatar: generateAvatarUrl(user.id),
            wallet: (walletAccount as any)?.address || "No wallet",
            createdAt: user.createdAt.toISOString(),
          }
        })

        setUsers(formattedUsers)
      } catch (err: any) {
        console.error(err)
        setError(err.message || "Failed to load users")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-[#118C4C]" />
          <h1 className="text-3xl font-bold text-foreground">Explore Users</h1>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="search"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#118C4C] mx-auto mb-4"></div>
            <p className="text-muted-foreground text-lg">Fetching users… please wait</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">{error}</p>
          <p className="text-muted-foreground mt-2">Try refreshing the page or check your connection.</p>
        </div>
      )}

      {/* Users Grid */}
      {!isLoading && !error && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {/* No users */}
      {!isLoading && !error && filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center text-muted-foreground">
          <Users className="h-12 w-12 mb-4 text-[#118C4C]" />
          <p className="text-lg font-semibold">
            {searchQuery
              ? `No users found for "${searchQuery}"`
              : "No users available yet"}
          </p>
          {searchQuery && <p className="mt-2">Try a different name or email to find users.</p>}
        </div>
      )}
    </div>
  )
}
