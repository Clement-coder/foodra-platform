import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { assertSelfOrAdmin, AuthError, requireAuthenticatedUser } from '@/lib/serverAuth'
import { computeMembership } from '@/lib/membership'

export async function GET(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
    }
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Failed to initialize Supabase admin client' }, { status: 500 })
    }

    const auth = await requireAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId') || auth.user.id
    assertSelfOrAdmin(auth.user, requestedUserId)

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*, products(farmer_id, users!products_farmer_id_fkey(id, name, avatar_url))),
        users!orders_buyer_id_fkey(id, name, email, phone, avatar_url, wallet_address)
      `)
      .eq('buyer_id', requestedUserId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formatted = orders?.map((o) => ({
      id: o.id,
      userId: o.buyer_id,
      items: o.order_items?.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        pricePerUnit: item.price,
        quantity: item.quantity,
        image: item.image_url || '',
      })) || [],
      totalAmount: o.total_amount,
      status: o.status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      // Deduplicated farmer list from order items
      farmers: Array.from(
        new Map(
          (o.order_items || [])
            .map((item: any) => item.products?.users)
            .filter(Boolean)
            .map((u: any) => [u.id, { id: u.id, name: u.name || "", email: "", phone: "", avatar: u.avatar_url || "", location: "" }])
        ).values()
      ),
      buyerName: o.users?.name || null,
      buyerPhone: o.users?.phone || null,
      buyerEmail: o.users?.email || null,
      deliveryFullName: o.delivery_full_name || null,
      deliveryPhone: o.delivery_phone || null,
      deliveryAddress: o.delivery_address || null,
      deliveryStreet2: o.delivery_street2 || null,
      deliveryLandmark: o.delivery_landmark || null,
      deliveryCity: o.delivery_city || null,
      deliveryState: o.delivery_state || null,
      deliveryCountry: o.delivery_country || null,
      estimatedDeliveryDate: o.estimated_delivery_date || null,
      trackingNotes: o.tracking_notes || null,
      shippedAt: o.shipped_at || null,
      deliveredAt: o.delivered_at || null,
    })) || []

    return NextResponse.json(formatted)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
    }
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Failed to initialize Supabase admin client' }, { status: 500 })
    }

    const auth = await requireAuthenticatedUser(request)
    const body = await request.json()
    const buyerId = auth.user.id
    const idempotencyKey = request.headers.get('Idempotency-Key')

    // If client retries after a network drop, return the already-created order
    if (idempotencyKey) {
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('buyer_id', buyerId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (existing) return NextResponse.json(existing)
    }

    // Snapshot tier before this order so we can detect upgrades after
    const [buyerSnap, prevOrdersSnap, prevDisputesSnap] = await Promise.all([
      supabaseAdmin.from("users").select("name, phone, location, avatar_url, created_at, is_verified").eq("id", buyerId).single(),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", buyerId),
      supabaseAdmin.from("order_disputes").select("id").eq("user_id", buyerId).limit(1),
    ])
    const bu = buyerSnap.data
    const previousTier = bu ? computeMembership({
      hasName: !!bu.name, hasPhone: !!bu.phone, hasLocation: !!bu.location,
      hasAvatar: !!bu.avatar_url, createdAt: bu.created_at,
      ordersCount: prevOrdersSnap.count ?? 0,
      hasDisputes: (prevDisputesSnap.data?.length ?? 0) > 0,
      isVerified: !!bu.is_verified,
    }).tier : "Seed"
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: buyerId,
        total_amount: body.totalAmount,
        status: 'Pending',
        idempotency_key: idempotencyKey ?? null,
        delivery_full_name:  body.delivery?.fullName    || null,
        delivery_phone:      body.delivery?.phone       || null,
        delivery_address:    body.delivery?.addressLine || null,
        delivery_street2:    body.delivery?.streetLine2 || null,
        delivery_landmark:   body.delivery?.landmark    || null,
        delivery_city:       body.delivery?.city        || null,
        delivery_state:      body.delivery?.state       || null,
        delivery_country:    body.delivery?.country     || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order insert error:', JSON.stringify(orderError))
      throw orderError
    }

    const orderItems = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.pricePerUnit,
      image_url: item.image,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items insert error:', JSON.stringify(itemsError))
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      throw itemsError
    }

    // Atomically decrement product quantity and validate stock
    for (const item of body.items) {
      // Try the RPC (available after 17_order_fixes.sql), fall back to direct update
      const { data: rpcOk, error: rpcError } = await supabaseAdmin.rpc('decrement_product_stock', {
        product_id: item.productId,
        decrement_by: item.quantity,
      })

      if (rpcError) {
        // RPC not deployed yet — do it directly
        const { data: prod } = await supabaseAdmin
          .from('products').select('quantity').eq('id', item.productId).single()
        if (!prod || prod.quantity < item.quantity) {
          await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
          await supabaseAdmin.from('orders').delete().eq('id', order.id)
          return NextResponse.json({ error: `Insufficient stock for ${item.productName}` }, { status: 400 })
        }
        await supabaseAdmin.from('products').update({
          quantity: prod.quantity - item.quantity,
          is_available: (prod.quantity - item.quantity) > 0,
        }).eq('id', item.productId)
      } else if (!rpcOk) {
        await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        return NextResponse.json({ error: `Insufficient stock for ${item.productName}` }, { status: 400 })
      }
    }

    // No notifications or emails until payment is confirmed via pay-wallet
    return NextResponse.json(order)
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create order', code: error?.code },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId') || auth.user.id
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    assertSelfOrAdmin(auth.user, userId)

    // Only allow deleting own pending/unpaid orders
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_id, status, wallet_paid')
      .eq('id', orderId)
      .eq('buyer_id', userId)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.wallet_paid) return NextResponse.json({ error: 'Cannot delete a paid order' }, { status: 403 })

    // Restore stock before deleting
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId)

    for (const item of items || []) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('quantity')
        .eq('id', item.product_id)
        .single()
      if (product !== null) {
        const restored = (product?.quantity || 0) + item.quantity
        await supabaseAdmin
          .from('products')
          .update({ quantity: restored, is_available: true })
          .eq('id', item.product_id)
      }
    }

    await supabaseAdmin.from('order_items').delete().eq('order_id', orderId)
    await supabaseAdmin.from('orders').delete().eq('id', orderId)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
