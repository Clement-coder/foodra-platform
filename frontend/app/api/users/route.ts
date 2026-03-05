import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
