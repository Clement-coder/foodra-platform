import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { createNotification } from '@/lib/notify'

export async function GET(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
    }
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Failed to initialize Supabase admin client' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = supabaseAdmin
      .from('funding_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: applications, error } = await query

    if (error) throw error

    const formatted = applications?.map((a) => ({
      id: a.id,
      userId: a.user_id,
      fullName: a.full_name,
      phoneNumber: a.phone_number,
      location: a.location,
      farmSize: a.farm_size,
      farmType: a.farm_type,
      yearsOfExperience: a.years_of_experience,
      amountRequested: a.amount_requested,
      expectedOutcome: a.expected_outcome,
      status: a.status,
      submittedAt: a.created_at,
    })) || []

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
    }
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Failed to initialize Supabase admin client' }, { status: 500 })
    }

    const body = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('funding_applications')
      .insert({
        user_id: body.userId,
        full_name: body.fullName,
        phone_number: body.phoneNumber,
        location: body.location,
        farm_size: body.farmSize,
        farm_type: body.farmType,
        years_of_experience: body.yearsOfExperience,
        amount_requested: body.amountRequested,
        expected_outcome: body.expectedOutcome,
      })
      .select()
      .single()

    if (error) throw error

    // Notify applicant of submission
    await createNotification({
      userId: body.userId,
      type: "funding",
      title: "Funding Application Submitted",
      message: `Your application for ₦${Number(body.amountRequested).toLocaleString()} has been received and is under review. You'll be notified of the decision within 5–7 business days.`,
      link: "/funding",
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create application', code: error?.code },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
    }
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Failed to initialize Supabase admin client' }, { status: 500 })
    }

    const body = await request.json()
    const { applicationId, status, actorPrivyId } = body as {
      applicationId?: string
      status?: "Approved" | "Rejected"
      actorPrivyId?: string
    }

    if (!applicationId || !status || !actorPrivyId) {
      return NextResponse.json({ error: 'applicationId, status and actorPrivyId are required' }, { status: 400 })
    }

    const { data: actor, error: actorError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('privy_id', actorPrivyId)
      .single()
    if (actorError || !actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update funding status' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('funding_applications')
      .update({ status })
      .eq('id', applicationId)
      .select('*')
      .single()

    if (error) throw error

    // Notify applicant
    if (data?.user_id) {
      await createNotification({
        userId: data.user_id,
        type: "funding",
        title: status === "Approved" ? "Funding Application Approved 🎉" : "Funding Application Update",
        message: status === "Approved"
          ? "Congratulations! Your funding application has been approved."
          : `Your funding application has been rejected.${body.note ? ` Reason: ${body.note}` : ""}`,
        link: "/funding",
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating application status:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update application status', code: error?.code },
      { status: 500 }
    )
  }
}
