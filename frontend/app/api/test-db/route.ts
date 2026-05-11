import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAdminUser } from "@/lib/serverAuth"

export async function GET(request: Request) {
  try {
    await requireAdminUser(request)
    
    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }
    // Test basic connection
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .limit(5)

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name")
      .limit(5)

    const { data: wishlists, error: wishlistsError } = await supabase
      .from("wishlists")
      .select("id")
      .limit(5)

    return NextResponse.json({
      status: "ok",
      tables: {
        products: { count: products?.length || 0, error: productsError?.message },
        users: { count: users?.length || 0, error: usersError?.message },
        wishlists: { count: wishlists?.length || 0, error: wishlistsError?.message },
      }
    })
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
