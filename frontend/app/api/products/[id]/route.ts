import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { AuthError, requireAuthenticatedUser } from '@/lib/serverAuth'
import { notifyWishlistPriceDrop } from '@/lib/wishlistServer'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`*, users!products_farmer_id_fkey (id, name, avatar_url)`)
      .eq('id', id)
      .single()

    if (error) throw error

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
      farmerId: product.farmer_id,
      farmerName: product.users?.name || 'Unknown',
      farmerAvatar: product.users?.avatar_url || '',
      createdAt: product.created_at,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 404 })
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

    if (auth.user.role !== 'admin') {
      if (existingProduct.farmer_id !== auth.user.id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      if ('is_available' in updates && !updates.is_available) {
        const { data: activeItems } = await supabaseAdmin
          .from('order_items')
          .select('order_id, orders!inner(escrow_status, status)')
          .eq('product_id', id)
          .in('orders.escrow_status', ['locked'])
        if (activeItems && activeItems.length > 0)
          return NextResponse.json({ error: 'Cannot deactivate — this product has active escrow orders in progress.' }, { status: 409 })
      }
    }

    const { error } = await supabaseAdmin.from('products').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const nextPrice = typeof updates.price === "number" ? updates.price : null
    if (nextPrice !== null && nextPrice < Number(existingProduct.price ?? nextPrice)) {
      await notifyWishlistPriceDrop({
        productId: id,
        productName: String(updates.name || existingProduct.name || "a product"),
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

    if (auth.user.role !== 'admin') {
      const { data: product } = await supabaseAdmin.from('products').select('farmer_id').eq('id', id).single()
      if (!product || product.farmer_id !== auth.user.id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      const { data: activeItems } = await supabaseAdmin
        .from('order_items')
        .select('order_id, orders!inner(status, escrow_status)')
        .eq('product_id', id)
        .or('orders.status.in.(Pending,Processing,Shipped),orders.escrow_status.in.(locked)')
      if (activeItems && activeItems.length > 0)
        return NextResponse.json({ error: 'Cannot delete — this product has active orders that must be fulfilled first.' }, { status: 409 })
    }

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
