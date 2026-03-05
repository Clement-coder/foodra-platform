import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: trainings, error } = await supabase
      .from('trainings')
      .select(`
        *,
        training_enrollments(count)
      `)
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
    console.error('Error fetching trainings:', error)
    return NextResponse.json({ error: 'Failed to fetch trainings' }, { status: 500 })
  }
}
