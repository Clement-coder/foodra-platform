import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET /api/products/[id]/related — returns up to 6 products in same category
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { data: product } = await supabase
      .from("products")
      .select("category")
      .eq("id", id)
      .single()

    if (!product) return NextResponse.json([])

    const { data } = await supabase
      .from("products")
      .select("*, users!products_farmer_id_fkey(id, name, avatar_url)")
      .eq("category", product.category)
      .eq("is_available", true)
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(6)

    const formatted = (data || []).map((p: any) => ({
      id: p.id,
      productName: p.name,
      category: p.category,
      quantity: p.quantity,
      unit: p.unit || "unit",
      pricePerUnit: p.price,
      description: p.description || "",
      image: p.image_url || "",
      location: p.location || "",
      farmerId: p.farmer_id,
      farmerName: p.users?.name || "Unknown",
      farmerAvatar: p.users?.avatar_url || "",
      createdAt: p.created_at,
    }))

    return NextResponse.json(formatted)
  } catch {
    return NextResponse.json([])
  }
}
