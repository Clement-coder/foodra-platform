import { notFound } from "next/navigation"
import UserProfileClient from "./UserProfileClient"
import { supabase } from "@/lib/supabase"
import type { User, Product } from "@/lib/types"
import { computeMembership } from "@/lib/membership"

const FOODRA_LOGO = "https://foodramarket.com/foodra_logo.jpeg"

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) notFound()

  const { data: rawUser, error: userError } = await supabase
    .from("users").select("*").eq("id", id).single()

  if (userError || !rawUser) notFound()

  const isAdmin = rawUser.role === "admin"

  const [
    { count: buyerOrdersCount },
    { count: totalProductsCount },
    { count: disputesCount },
    { data: rawProducts },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("buyer_id", id),
    // For admin: count ALL products on the platform
    isAdmin
      ? supabase.from("products").select("*", { count: "exact", head: true })
      : supabase.from("products").select("*", { count: "exact", head: true }).eq("farmer_id", id),
    // Check for disputes
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", id).eq("has_dispute", true),
    supabase.from("products").select("*")
      .eq(isAdmin ? "is_available" : "farmer_id", isAdmin ? true : id)
      .order("created_at", { ascending: false })
      .limit(12),
  ])

  const user: User = {
    id: rawUser.id,
    // Foodra admins always show as "Foodra"
    name: isAdmin ? "Foodra" : (rawUser.name || "User"),
    email: isAdmin ? "support@foodramarket.com" : (rawUser.email || ""),
    // Always use the Foodra logo for admin accounts
    avatar: isAdmin ? FOODRA_LOGO : (rawUser.avatar_url || ""),
    wallet: rawUser.wallet_address || "",
    createdAt: rawUser.created_at,
    phone: isAdmin ? "+234 800 FOODRA" : (rawUser.phone || ""),
    location: isAdmin ? "Benue State, Nigeria" : (rawUser.location || undefined),
    role: rawUser.role || "buyer",
    isVerified: true, // admin is always verified
  }

  // Admins get max membership score → Champion
  const membership = isAdmin
    ? computeMembership({
        hasName: true, hasPhone: true, hasLocation: true, hasAvatar: true,
        createdAt: rawUser.created_at,
        ordersCount: 6, // max orders points
        hasDisputes: false,
        isVerified: true,
      })
    : computeMembership({
        hasName: !!rawUser.name,
        hasPhone: !!rawUser.phone,
        hasLocation: !!rawUser.location,
        hasAvatar: !!rawUser.avatar_url,
        createdAt: rawUser.created_at,
        ordersCount: buyerOrdersCount ?? 0,
        hasDisputes: (disputesCount ?? 0) > 0,
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
    farmerName: isAdmin ? "Foodra" : user.name,
    farmerAvatar: isAdmin ? FOODRA_LOGO : user.avatar,
    farmerIsVerified: true,
    createdAt: p.created_at,
  }))

  return (
    <UserProfileClient
      user={user}
      membership={membership}
      products={products}
      ordersCount={isAdmin ? (totalProductsCount ?? 0) : (buyerOrdersCount ?? 0)}
    />
  )
}
