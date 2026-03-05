import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        users!products_farmer_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    const formatted = {
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
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 404 })
  }
}
