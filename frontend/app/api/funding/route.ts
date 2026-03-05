import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = supabase
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
    const body = await request.json()
    
    const { data, error } = await supabase
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

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
