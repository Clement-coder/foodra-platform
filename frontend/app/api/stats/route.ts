import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  const [usersRes, productsRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_available", true),
  ])

  return NextResponse.json({
    users: usersRes.count ?? 0,
    products: productsRes.count ?? 0,
  })
}
