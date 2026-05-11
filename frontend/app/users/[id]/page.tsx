import { notFound } from "next/navigation"
import UserProfileClient from "./UserProfileClient"
import { supabase } from "@/lib/supabase"
import type { User } from "@/lib/types"
import { computeMembership } from "@/lib/membership"

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) notFound()

  const { data: rawUser, error: userError } = await supabase
    .from("users").select("*").eq("id", id).single()

  if (userError || !rawUser) notFound()

  // Fetch orders count and disputes for membership score
  const [{ count: ordersCount }, { count: disputesCount }] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", id),
    supabase.from("disputes").select("*", { count: "exact", head: true }).eq("user_id", id),
  ])

  const user: User = {
    id: rawUser.id,
    name: rawUser.name || "Unknown User",
    email: rawUser.email || "",
    avatar: rawUser.avatar_url || "",
    wallet: rawUser.wallet_address || "",
    createdAt: rawUser.created_at,
    phone: rawUser.phone || "",
    location: rawUser.location || undefined,
    role: rawUser.role || "buyer",
    isVerified: !!rawUser.is_verified,
  }

  const membership = computeMembership({
    hasName: !!rawUser.name,
    hasPhone: !!rawUser.phone,
    hasLocation: !!rawUser.location,
    hasAvatar: !!rawUser.avatar_url,
    createdAt: rawUser.created_at,
    ordersCount: ordersCount ?? 0,
    hasDisputes: (disputesCount ?? 0) > 0,
    isVerified: !!rawUser.is_verified,
  })

  return <UserProfileClient user={user} membership={membership} />
}
