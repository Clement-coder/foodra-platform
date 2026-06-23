import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2', {
      next: { revalidate: 86400 }, // cache 24h
    })
    if (!res.ok) throw new Error('upstream failed')
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([{ name: { common: 'Nigeria' }, cca2: 'NG' }])
  }
}
