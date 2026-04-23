import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createNotification } from '@/lib/notify'
import { AuthError, requireAuthenticatedUser } from '@/lib/serverAuth'

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || auth.user.id
    const trainingId = searchParams.get('trainingId')
    if (userId !== auth.user.id && auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (trainingId) {
      const { data } = await supabase
        .from('training_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('training_id', trainingId)
        .maybeSingle()
      return NextResponse.json({ enrolled: !!data })
    }

    const { count } = await supabase
      .from('training_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    return NextResponse.json({ count: count ?? 0 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('training_enrollments')
      .insert({
        training_id: body.trainingId,
        user_id: auth.user.id,
        full_name: body.fullName,
        phone_number: body.phoneNumber,
        location: body.location,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })
      }
      throw error
    }

    // Notify user of successful enrollment
    if (auth.user.id) {
      const supabaseAdmin = getSupabaseAdminClient()
      let trainingTitle = "the training"
      if (supabaseAdmin && body.trainingId) {
        const { data: t } = await supabaseAdmin.from("trainings").select("title").eq("id", body.trainingId).single()
        if (t?.title) trainingTitle = t.title
      }
      await createNotification({
        userId: auth.user.id,
        type: "training",
        title: "Training Enrollment Confirmed",
        message: `You have successfully enrolled in "${trainingTitle}".`,
        link: `/training/${body.trainingId}`,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Error enrolling:', error)
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
