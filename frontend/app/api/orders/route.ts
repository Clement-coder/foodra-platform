import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createNotification } from '@/lib/notify'

export async function GET(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
    }
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Failed to initialize Supabase admin client' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(*, products(farmer_id, users!products_farmer_id_fkey(id, name, avatar_url))),
        users!orders_buyer_id_fkey(id, name, email, phone, avatar_url, wallet_address)
      `)
      .eq('buyer_id', userId)
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
        escrowOrderId: item.escrow_order_id || null,
        farmerWallet: item.farmer_wallet || null,
        escrowStatus: item.escrow_status || 'none',
      })) || [],
      totalAmount: o.total_amount,
      status: o.status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      escrowTxHash: o.escrow_tx_hash || null,
      escrowStatus: o.escrow_status || 'none',
      usdcAmount: o.usdc_amount || null,
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
    })) || []

    return NextResponse.json(formatted)
  } catch (error) {
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

    const body = await request.json()
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: body.userId,
        total_amount: body.totalAmount,
        status: 'Pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.pricePerUnit,
      image_url: item.image,
      farmer_wallet: item.farmerWallet || null,
      escrow_status: 'none',
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Decrement product quantity and mark unavailable if stock hits 0
    for (const item of body.items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('quantity')
        .eq('id', item.productId)
        .single()

      if (product) {
        const newQty = Math.max(0, product.quantity - item.quantity)
        await supabaseAdmin
          .from('products')
          .update({ quantity: newQty, is_available: newQty > 0 })
          .eq('id', item.productId)
      }
    }

    // Notify buyer of order placement
    if (body.userId) {
      await createNotification({
        userId: body.userId,
        type: "order",
        title: "Order Placed Successfully",
        message: `Your order of ₦${Number(body.totalAmount).toLocaleString()} has been placed and is being processed.`,
        link: `/orders/${order.id}`,
      })
    }

    return NextResponse.json(order)
  } catch (error: any) {
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

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const userId = searchParams.get('userId')

    if (!orderId || !userId) return NextResponse.json({ error: 'orderId and userId required' }, { status: 400 })

    // Only allow deleting own pending orders with no escrow
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_id, status, escrow_status')
      .eq('id', orderId)
      .eq('buyer_id', userId)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.escrow_status === 'locked') return NextResponse.json({ error: 'Cannot delete locked escrow order' }, { status: 403 })

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
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
