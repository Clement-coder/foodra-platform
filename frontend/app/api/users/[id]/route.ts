import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 })

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, wallet_address, created_at, phone, location, role, is_verified')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar_url || '',
      wallet: user.wallet_address || '',
      createdAt: user.created_at,
      phone: user.phone || '',
      location: user.location || undefined,
      role: user.role || 'buyer',
      isVerified: !!user.is_verified,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 404 })
  }
}
