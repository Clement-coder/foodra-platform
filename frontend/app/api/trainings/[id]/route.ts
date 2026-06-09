import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [{ data: training, error }, { count }] = await Promise.all([
      supabase.from('trainings').select('*').eq('id', id).single(),
      supabase.from('training_enrollments').select('id', { count: 'exact', head: true }).eq('training_id', id),
    ])

    if (error) throw error

    return NextResponse.json({
      id: training.id,
      title: training.title,
      summary: training.summary || '',
      description: training.description || '',
      date: training.date,
      mode: training.mode,
      location: training.location || '',
      instructor: training.instructor_name || '',
      capacity: training.capacity,
      enrolled: count ?? 0,
      image: training.image_url || '',
    })
  } catch (error) {
    console.error('Error fetching training:', error)
    return NextResponse.json({ error: 'Failed to fetch training' }, { status: 404 })
  }
}
