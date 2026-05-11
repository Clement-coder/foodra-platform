import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { requireAuthenticatedUser } from '@/lib/serverAuth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  let isOwnerOrAdmin = false
  try {
    const auth = await requireAuthenticatedUser(request)
    if (auth.user.id === id || auth.user.role === 'admin') {
      isOwnerOrAdmin = true
    }
  } catch {
    // Unauthenticated requests are allowed for public profile viewing
  }

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
      email: isOwnerOrAdmin ? (user.email || '') : undefined,
      avatar: user.avatar_url || '',
      wallet: user.wallet_address || '',
      createdAt: user.created_at,
      phone: isOwnerOrAdmin ? (user.phone || '') : undefined,
      location: user.location || undefined,
      role: user.role || 'buyer',
      isVerified: !!user.is_verified,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 404 })
  }
}
