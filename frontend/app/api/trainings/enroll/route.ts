import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createNotification } from '@/lib/notify'
import { AuthError, requireAuthenticatedUser } from '@/lib/serverAuth'
import { sendTrainingEnrollmentEmail } from '@/lib/email'

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || auth.user.id
    const trainingId = searchParams.get('trainingId')
    if (userId !== auth.user.id && auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (trainingId) {
      const { data } = await supabaseAdmin
        .from('training_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('training_id', trainingId)
        .maybeSingle()
      return NextResponse.json({ enrolled: !!data })
    }

    const { count } = await supabaseAdmin
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
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const body = await request.json()

    // Use atomic enrollment with capacity check
    const { data, error } = await supabaseAdmin.rpc('enroll_with_capacity_check', {
      p_training_id: body.trainingId,
      p_user_id: auth.user.id,
      p_full_name: body.fullName || auth.user.name || 'Unknown',
      p_phone_number: body.phoneNumber || auth.user.phone || '',
      p_location: body.location || auth.user.location || '',
    })

    if (error) {
      const msg = error.message || ""
      if (msg.includes("CAPACITY_FULL")) {
        return NextResponse.json({ error: "Training is at full capacity" }, { status: 400 })
      }
      if (msg.includes("ALREADY_ENROLLED")) {
        return NextResponse.json({ error: "Already enrolled" }, { status: 400 })
      }
      console.error("Enrollment error:", error)
      throw error
    }

    let trainingTitle = 'the training'
    let trainingDetails: { date?: string; mode?: string; location?: string; instructor?: string } = {}
    if (body.trainingId) {
      const { data: t } = await supabaseAdmin.from('trainings').select('title, date, mode, location, instructor_name').eq('id', body.trainingId).single()
      if (t?.title) trainingTitle = t.title
      trainingDetails = { date: t?.date, mode: t?.mode, location: t?.location, instructor: t?.instructor_name }
    }
    
    await createNotification({
      userId: auth.user.id,
      type: 'training',
      title: 'Training Enrollment Confirmed',
      message: `You have successfully enrolled in "${trainingTitle}".`,
      link: `/training/${body.trainingId}`,
    })

    // Use email from auth or fall back to DB lookup
    const userEmail = auth.user.email || (await supabaseAdmin.from('users').select('email').eq('id', auth.user.id).single()).data?.email
    if (userEmail) {
      sendTrainingEnrollmentEmail(userEmail, auth.user.name || "Farmer", trainingTitle, body.trainingId, auth.user.id, trainingDetails).catch((e) => console.error('Enrollment email error:', e))
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Error enrolling:', error)
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
