import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { AuthError, requireAdminUser } from '@/lib/serverAuth'

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
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })
    await requireAdminUser(request)

    const body = await request.json()
    const { actorPrivyId, ...fields } = body
    void actorPrivyId

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
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Failed to create training' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })
    await requireAdminUser(request)

    const body = await request.json()
    const { actorPrivyId, id, ...fields } = body
    void actorPrivyId

    const { error } = await supabaseAdmin.from('trainings').update({
      title: fields.title,
      summary: fields.summary,
      description: fields.description,
      date: fields.date,
      mode: fields.mode,
      location: fields.location,
      instructor_name: fields.instructor,
      capacity: fields.capacity,
      image_url: fields.image_url ?? undefined,
    }).eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Failed to update training' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 })
    await requireAdminUser(request)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { error } = await supabaseAdmin.from('trainings').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Failed to delete training' }, { status: 500 })
  }
}
