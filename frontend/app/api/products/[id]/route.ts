import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'

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
  const { id } = await params
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const body = await request.json()
  const { actorPrivyId, ...updates } = body

  const { data: actor } = await supabaseAdmin.from('users').select('id, role').eq('privy_id', actorPrivyId).single()
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Admin can update any product; farmer can only update their own
  if (actor.role !== 'admin') {
    const { data: product } = await supabaseAdmin.from('products').select('farmer_id').eq('id', id).single()
    if (!product || product.farmer_id !== actor.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Farmers cannot deactivate if there are locked escrow orders for this product
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
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const actorPrivyId = searchParams.get('actorPrivyId')

  const { data: actor } = await supabaseAdmin.from('users').select('id, role').eq('privy_id', actorPrivyId || '').single()
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Admin can delete any; farmer can only delete their own
  if (actor.role !== 'admin') {
    const { data: product } = await supabaseAdmin.from('products').select('farmer_id').eq('id', id).single()
    if (!product || product.farmer_id !== actor.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Farmers cannot delete if there are any active orders (Pending/Processing/Shipped or locked escrow)
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
}
