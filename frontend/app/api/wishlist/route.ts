import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

    const { data, error } = await supabase
      .from("wishlists")
      .select(`
        id,
        product_id,
        alert_price,
        created_at,
        products!inner(id, name, price, image_url)
      `)
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json((data || []).map((row: any) => ({
      productId: row.product_id,
      productName: row.products?.name || "",
      image: row.products?.image_url || "",
      priceAtAdd: Number(row.products?.price || 0),
      currentPrice: Number(row.products?.price || 0),
      alertPrice: row.alert_price == null ? null : Number(row.alert_price),
      addedAt: row.created_at,
    })))
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

    const body = await request.json()
    const { productId, alertPrice } = body

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("wishlists")
      .upsert({
        user_id: auth.user.id,
        product_id: productId,
        alert_price: alertPrice ?? null,
      }, { onConflict: "user_id,product_id" })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to save wishlist item" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

    const body = await request.json()
    const { productId, alertPrice } = body

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("wishlists")
      .update({ alert_price: alertPrice ?? null })
      .eq("user_id", auth.user.id)
      .eq("product_id", productId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to update wishlist alert" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("product_id", productId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to delete wishlist item" }, { status: 500 })
  }
}
