import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        users!products_farmer_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formatted = products?.map((p) => ({
      id: p.id,
      productName: p.name,
      category: p.category,
      quantity: p.quantity,
      pricePerUnit: p.price,
      description: p.description || '',
      image: p.image_url || '',
      location: p.location || '',
      farmerId: p.farmer_id,
      farmerName: p.users?.name || 'Unknown',
      farmerAvatar: p.users?.avatar_url || '',
      createdAt: p.created_at,
    })) || []

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Failed to initialize Supabase admin client' },
        { status: 500 }
      )
    }

    const body = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        farmer_id: body.farmerId,
        name: body.productName,
        category: body.category,
        quantity: body.quantity,
        price: body.pricePerUnit,
        description: body.description,
        image_url: body.image,
        location: body.location,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating product:', error)
    const hint =
      error?.code === '42501'
        ? 'Permission denied. Ensure SUPABASE_SERVICE_ROLE_KEY is set and server restarted.'
        : undefined
    return NextResponse.json(
      { error: error?.message || 'Failed to create product', code: error?.code, hint },
      { status: 500 }
    )
  }
}
