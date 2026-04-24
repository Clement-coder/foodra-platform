"use client"

import { useState, useEffect } from "react"
import { UserCard } from "@/components/UserCard"
import { Users, Search, AlertCircle, Sparkles } from "lucide-react"
import { User } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users")
        if (!res.ok) throw new Error(`Error ${res.status}: Failed to fetch users`)
        const data = await res.json()
        setUsers(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load users")
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
      <div className="relative overflow-hidden rounded-3xl border border-[#118C4C]/20 bg-card p-6 md:p-8 mb-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#118C4C]/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-12 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#118C4C]/10 px-3 py-1 text-xs font-semibold text-[#118C4C] mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Community Directory
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Explore Users</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Discover buyers and farmers, open profiles, and explore their listed products.
            </p>
          </div>
        </div>
        <div className="relative w-full md:max-w-md mt-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="search"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
          />
        </div>
      </div>

      {/* Loading — skeleton grid */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-muted rounded-xl" />
            </div>
          ))}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
