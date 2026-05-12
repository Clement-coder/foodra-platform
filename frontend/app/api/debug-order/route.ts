import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { requireAuthenticatedUser, AuthError } from '@/lib/serverAuth'

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'No admin client', env: { hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL, hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY } })

    const auth = await requireAuthenticatedUser(request)

    // Try inserting a test order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({ buyer_id: auth.user.id, total_amount: 1, status: 'Pending' })
      .select()
      .single()

    if (orderError) return NextResponse.json({ step: 'order_insert', error: orderError })

    // Try inserting a test order item
    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: '00000000-0000-0000-0000-000000000000',
        product_name: 'test',
        quantity: 1,
        price: 1,
        farmer_wallet: null,
        escrow_status: 'none',
      })

    // Clean up test order
    await supabaseAdmin.from('orders').delete().eq('id', order.id)

    if (itemError) return NextResponse.json({ step: 'items_insert', error: itemError })

    return NextResponse.json({ ok: true, userId: auth.user.id })
  } catch (e: any) {
    if (e instanceof AuthError) return NextResponse.json({ step: 'auth', error: e.message }, { status: e.status })
    return NextResponse.json({ step: 'unknown', error: e?.message, code: e?.code })
  }
}
