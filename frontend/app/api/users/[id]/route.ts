import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    const formatted = {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar_url || '',
      wallet: user.wallet_address || '',
      createdAt: user.created_at,
      phone: user.phone || "",
      location: user.location || undefined,
      role: user.role || "buyer",
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 404 })
  }
}
