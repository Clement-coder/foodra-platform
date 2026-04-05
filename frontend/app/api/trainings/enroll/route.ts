import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createNotification } from '@/lib/notify'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('training_enrollments')
      .insert({
        training_id: body.trainingId,
        user_id: body.userId,
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
    if (body.userId) {
      const supabaseAdmin = getSupabaseAdminClient()
      let trainingTitle = "the training"
      if (supabaseAdmin && body.trainingId) {
        const { data: t } = await supabaseAdmin.from("trainings").select("title").eq("id", body.trainingId).single()
        if (t?.title) trainingTitle = t.title
      }
      await createNotification({
        userId: body.userId,
        type: "training",
        title: "Training Enrollment Confirmed",
        message: `You have successfully enrolled in "${trainingTitle}".`,
        link: `/training/${body.trainingId}`,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error enrolling:', error)
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}
