import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { AuthError, requireAuthenticatedUser } from '@/lib/serverAuth'
import { notifyWishlistPriceDrop } from '@/lib/wishlistServer'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`*, users!products_farmer_id_fkey (id, name, avatar_url, role, is_verified)`)
      .eq('id', id)
      .single()

    if (error || !product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })

    return NextResponse.json({
      id: product.id,
      productName: product.name,
      category: product.category,
      quantity: product.quantity,
      unit: product.unit || 'unit',
      pricePerUnit: product.price,
      description: product.description || '',
      image: product.image_url || '',
      location: product.location || '',
      farmerId: product.farmer_id || product.users?.id || null,
      farmerName: product.users?.name || 'Foodra',
      farmerAvatar: product.users?.avatar_url || '/foodra_logo.jpeg',
      farmerIsVerified: product.users?.is_verified ?? true,
      createdAt: product.created_at,
    })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// Farmer or admin: update product (toggle availability, edit fields)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const body = await request.json()
    const { actorPrivyId, ...updates } = body
    void actorPrivyId

    const { data: existingProduct } = await supabaseAdmin.from('products').select('farmer_id, price, name').eq('id', id).single()
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    if (!['admin', 'owner'].includes(auth.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Remap frontend field names to DB column names
    const { image, productName, pricePerUnit, ...rest } = updates
    const dbUpdates: Record<string, unknown> = { ...rest }
    if (image !== undefined) dbUpdates.image_url = image
    if (productName !== undefined) dbUpdates.name = productName
    if (pricePerUnit !== undefined) dbUpdates.price = pricePerUnit

    const { error } = await supabaseAdmin.from('products').update(dbUpdates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const nextPrice = typeof dbUpdates.price === "number" ? dbUpdates.price : null
    if (nextPrice !== null && nextPrice < Number(existingProduct.price ?? nextPrice)) {
      await notifyWishlistPriceDrop({
        productId: id,
        productName: String(dbUpdates.name || existingProduct.name || "a product"),
        currentPrice: nextPrice,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)

    if (!['admin', 'owner'].includes(auth.user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
