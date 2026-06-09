import { notFound } from "next/navigation"
import UserProfileClient from "./UserProfileClient"
import { supabase } from "@/lib/supabase"
import type { User, Product } from "@/lib/types"
import { computeMembership } from "@/lib/membership"

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) notFound()

  const { data: rawUser, error: userError } = await supabase
    .from("users").select("*").eq("id", id).single()

  if (userError || !rawUser) notFound()

  const [
    { count: ordersCount },
    { data: rawProducts },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("buyer_id", id),
    supabase.from("products").select("*").eq("farmer_id", id).eq("is_available", true).order("created_at", { ascending: false }).limit(12),
  ])

  const user: User = {
    id: rawUser.id,
    name: rawUser.name || "Foodra",
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
    hasDisputes: false,
    isVerified: !!rawUser.is_verified,
  })

  const products: Product[] = (rawProducts || []).map((p: any) => ({
    id: p.id,
    productName: p.name || p.product_name || "",
    category: p.category || "",
    quantity: p.quantity ?? 0,
    unit: p.unit || "kg",
    pricePerUnit: Number(p.price_per_unit ?? p.price ?? 0),
    description: p.description || "",
    image: p.image_url || "",
    location: p.location || "",
    farmerId: p.farmer_id || id,
    farmerName: user.name,
    farmerAvatar: user.avatar,
    farmerIsVerified: user.isVerified,
    createdAt: p.created_at,
  }))

  return <UserProfileClient user={user} membership={membership} products={products} ordersCount={ordersCount ?? 0} />
}
