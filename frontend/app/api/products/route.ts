import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createNotification } from '@/lib/notify'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')

    let query = supabase
      .from('products')
      .select(`*, users!products_farmer_id_fkey (id, name, avatar_url)`)
      .order('created_at', { ascending: false })

    if (farmerId) {
      query = query.eq('farmer_id', farmerId)
    } else {
      query = query.eq('is_available', true)
    }

    const { data: products, error } = await query
    if (error) throw error

    const formatted = products?.map((p) => ({
      id: p.id,
      productName: p.name,
      category: p.category,
      quantity: p.quantity,
      unit: p.unit || 'unit',
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
        unit: body.unit || 'unit',
        price: body.pricePerUnit,
        description: body.description,
        image_url: body.image,
        location: body.location,
      })
      .select()
      .single()

    if (error) throw error

    // Notify farmer of successful listing
    await createNotification({
      userId: body.farmerId,
      type: "system",
      title: "Product Listed Successfully ✅",
      message: `"${body.productName}" is now live on the marketplace.`,
      link: `/marketplace/${data.id}`,
    })

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
