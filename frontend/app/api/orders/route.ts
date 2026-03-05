import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
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
      })) || [],
      totalAmount: o.total_amount,
      status: o.status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    })) || []

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data: order, error: orderError } = await supabase
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
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
