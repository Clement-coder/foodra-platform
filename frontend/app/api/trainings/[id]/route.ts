import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { data: training, error } = await supabase
      .from('trainings')
      .select(`
        *,
        training_enrollments(count)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    const formatted = {
      id: training.id,
      title: training.title,
      summary: training.summary || '',
      description: training.description || '',
      date: training.date,
      mode: training.mode,
      location: training.location || '',
      instructor: training.instructor_name || '',
      capacity: training.capacity,
      enrolled: training.training_enrollments?.[0]?.count || 0,
      image: training.image_url || '',
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching training:', error)
    return NextResponse.json({ error: 'Failed to fetch training' }, { status: 404 })
  }
}
