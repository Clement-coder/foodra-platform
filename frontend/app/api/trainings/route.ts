import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const { data: trainings, error } = await supabase
      .from('trainings')
      .select(`*, training_enrollments(count)`)
      .order('date', { ascending: true })

    if (error) throw error

    const formatted = trainings?.map((t) => ({
      id: t.id,
      title: t.title,
      summary: t.summary || '',
      description: t.description || '',
      date: t.date,
      mode: t.mode,
      location: t.location || '',
      instructor: t.instructor_name || '',
      capacity: t.capacity,
      enrolled: t.training_enrollments?.[0]?.count || 0,
      image: t.image_url || '',
    })) || []

    return NextResponse.json(formatted)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trainings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const body = await request.json()
  const { actorPrivyId, ...fields } = body

  const { data: actor } = await supabaseAdmin.from('users').select('role').eq('privy_id', actorPrivyId).single()
  if (!actor || actor.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin.from('trainings').insert({
    title: fields.title,
    summary: fields.summary,
    description: fields.description,
    date: fields.date,
    mode: fields.mode,
    location: fields.location,
    instructor_name: fields.instructor,
    capacity: fields.capacity,
    image_url: fields.image || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const body = await request.json()
  const { actorPrivyId, id, ...fields } = body

  const { data: actor } = await supabaseAdmin.from('users').select('role').eq('privy_id', actorPrivyId).single()
  if (!actor || actor.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabaseAdmin.from('trainings').update({
    title: fields.title,
    summary: fields.summary,
    description: fields.description,
    date: fields.date,
    mode: fields.mode,
    location: fields.location,
    instructor_name: fields.instructor,
    capacity: fields.capacity,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const actorPrivyId = searchParams.get('actorPrivyId')

  const { data: actor } = await supabaseAdmin.from('users').select('role').eq('privy_id', actorPrivyId || '').single()
  if (!actor || actor.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabaseAdmin.from('trainings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
