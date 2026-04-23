import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { rateLimit, getClientIp } from "@/lib/rateLimit"

// POST /api/products — already exists, this adds search endpoint
// GET /api/products/search?q=tomato&category=Vegetables&minPrice=100&maxPrice=5000&location=Lagos&sort=price_asc
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  const category = searchParams.get("category") || ""
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const location = searchParams.get("location") || ""
  const sort = searchParams.get("sort") || "newest"

  // Rate limit search: 60 req/min per IP
  const ip = getClientIp(request)
  const rl = rateLimit(`search:${ip}`, { limit: 60, windowSec: 60 })
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  let query = supabaseAdmin
    .from("products")
    .select("*, users!products_farmer_id_fkey(id, name, avatar_url)")
    .eq("is_available", true)

  if (q) {
    // Use full-text search index for better performance
    query = query.textSearch("name,description,category", q, { type: "websearch" })
  }
  if (category) query = query.eq("category", category)
  if (minPrice) query = query.gte("price", Number(minPrice))
  if (maxPrice) query = query.lte("price", Number(maxPrice))
  if (location) query = query.eq("location", location)

  switch (sort) {
    case "price_asc": query = query.order("price", { ascending: true }); break
    case "price_desc": query = query.order("price", { ascending: false }); break
    case "name_asc": query = query.order("name", { ascending: true }); break
    default: query = query.order("created_at", { ascending: false })
  }

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
}
