import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Map database fields to frontend User type
    const formatted = users?.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      location: u.location,
      avatar: u.avatar_url,
      wallet: u.wallet_address,
      role: u.role,
      isVerified: !!u.is_verified,
      createdAt: u.created_at,
    })) || []

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: body.id,
        name: body.name,
        email: body.email,
        phone: body.phone,
        location: body.location,
        avatar_url: body.avatar,
        wallet_address: body.wallet,
        role: body.role,
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}
