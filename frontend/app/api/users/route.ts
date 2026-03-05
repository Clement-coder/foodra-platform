import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formatted = users?.map((u) => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      avatar: u.avatar_url || '',
      wallet: u.wallet_address || '',
      createdAt: u.created_at,
      phone: u.phone || "",
      location: u.location || undefined,
      role: u.role || "buyer",
    })) || []

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
