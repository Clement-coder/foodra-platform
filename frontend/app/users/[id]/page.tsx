import { notFound } from "next/navigation"
import UserProfileClient from "./UserProfileClient"
import { supabase } from "@/lib/supabase"
import type { Product, User } from "@/lib/types"

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  const { data: rawUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (userError || !rawUser) {
    notFound()
  }

  const user: User = {
    id: rawUser.id,
    name: rawUser.name || "Unknown User",
    email: rawUser.email || "N/A",
    avatar: rawUser.avatar_url || "",
    wallet: rawUser.wallet_address || "",
    createdAt: rawUser.created_at,
    phone: rawUser.phone || "",
    location: rawUser.location || undefined,
    role: rawUser.role || "buyer",
    isVerified: !!rawUser.is_verified,
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("farmer_id", id)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  if (productsError) {
    console.error("Error loading user products:", productsError)
  }

  const userProducts: Product[] = (products || []).map((p) => ({
    id: p.id,
    productName: p.name,
    category: p.category,
    quantity: p.quantity,
    unit: p.unit || 'unit',
    pricePerUnit: p.price,
    description: p.description || "",
    image: p.image_url || "",
    location: p.location || "",
    farmerId: p.farmer_id,
    farmerName: user.name,
    farmerAvatar: user.avatar,
    createdAt: p.created_at,
  }))

  return <UserProfileClient user={user} userProducts={userProducts} />
}
