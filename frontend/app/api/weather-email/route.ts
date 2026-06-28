/**
 * POST /api/weather-email
 * Called by Supabase pg_cron daily at 6AM WAT.
 * Sends daily weather forecast + crop advisory to all users with a saved location.
 * Extreme weather (thunderstorm, heavy showers, etc.) gets an alert banner.
 */
import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { sendWeatherEmail } from "@/lib/email"

function describeWeather(code: number): { label: string; icon: string; extreme: boolean } {
  if (code === 0)  return { label: "Clear sky",     icon: "☀️",  extreme: false }
  if (code <= 2)   return { label: "Partly cloudy", icon: "⛅",  extreme: false }
  if (code === 3)  return { label: "Overcast",       icon: "☁️",  extreme: false }
  if (code <= 49)  return { label: "Foggy",          icon: "🌫️", extreme: false }
  if (code <= 59)  return { label: "Drizzle",        icon: "🌦️", extreme: false }
  if (code <= 67)  return { label: "Rain",           icon: "🌧️", extreme: false }
  if (code <= 69)  return { label: "Freezing rain",  icon: "🌨️", extreme: true  }
  if (code <= 79)  return { label: "Snow",           icon: "❄️",  extreme: true  }
  if (code <= 82)  return { label: "Rain showers",   icon: "🌧️", extreme: false }
  if (code <= 84)  return { label: "Heavy showers",  icon: "⛈️", extreme: true  }
  if (code <= 99)  return { label: "Thunderstorm",   icon: "⛈️", extreme: true  }
  return { label: "Unknown", icon: "🌡️", extreme: false }
}

function cropAdvisory(code: number, uvIndex: number): string {
  if (code >= 95) return "⚠️ Thunderstorm — stay indoors, protect crops and equipment."
  if (code >= 80) return "🌧️ Heavy showers — avoid harvesting, check drainage."
  if (code >= 61) return "🌧️ Rainy — avoid pesticide spraying, good for irrigation."
  if (code >= 51) return "🌦️ Drizzle — light field work okay, avoid spraying."
  if (code >= 45) return "🌫️ Foggy — delay harvesting until visibility improves."
  if (code === 0 && uvIndex >= 8) return "☀️ Very sunny — water crops early morning, avoid midday fieldwork."
  if (code === 0) return "☀️ Clear sky — great day for harvesting and fieldwork."
  if (code <= 2)  return "⛅ Partly cloudy — ideal conditions for most farm activities."
  return "🌾 Moderate conditions — normal farm activities are fine."
}

// Geocode location name → lat/lon (Nominatim, 1 req/s limit)
async function geocode(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { "User-Agent": "Foodra/1.0 (notifications@foodramarket.com)" } }
    )
    const data = await res.json()
    if (!data?.[0]) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

async function run(request: Request) {
  const secret =
    request.headers.get("x-cron-secret") ??
    new URL(request.url).searchParams.get("secret")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, location")
    .not("email", "is", null)
    .not("location", "is", null)
    .neq("location", "")

  if (!users?.length) return NextResponse.json({ sent: 0 })

  // Deduplicate geocoding — one Nominatim call per unique location string
  const uniqueLocations = [...new Set(users.map(u => u.location as string))]
  const coordsCache: Record<string, { lat: number; lon: number } | null> = {}

  for (const loc of uniqueLocations) {
    coordsCache[loc] = await geocode(loc)
    await new Promise(r => setTimeout(r, 1100)) // Nominatim: max 1 req/s
  }

  // Fetch weather once per unique location
  const weatherCache: Record<string, any> = {}
  for (const loc of uniqueLocations) {
    const coords = coordsCache[loc]
    if (!coords) continue
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${coords.lat}&longitude=${coords.lon}` +
        `&current_weather=true` +
        `&hourly=relativehumidity_2m,apparent_temperature,uv_index` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
        `&wind_speed_unit=kmh&timezone=UTC&forecast_days=7`
      )
      weatherCache[loc] = await res.json()
    } catch {
      // skip this location
    }
  }

  let sent = 0
  let failed = 0
  const utcHour = new Date().getUTCHours() // index into hourly array (hour 0–23 of today)

  for (const user of users) {
    const wd = weatherCache[user.location]
    if (!wd?.current_weather) { failed++; continue }

    try {
      const { temperature, weathercode, windspeed } = wd.current_weather
      const humidity  = wd.hourly?.relativehumidity_2m?.[utcHour] ?? 0
      const feelsLike = Math.round(wd.hourly?.apparent_temperature?.[utcHour] ?? temperature)
      const uvIndex   = Math.round(wd.hourly?.uv_index?.[utcHour] ?? 0)
      const { label, icon, extreme } = describeWeather(weathercode)
      const advisory = cropAdvisory(weathercode, uvIndex)

      const forecast = (wd.daily?.time ?? []).map((date: string, i: number) => {
        const { icon: fi, label: fl } = describeWeather(wd.daily.weathercode[i])
        return {
          date,
          maxTemp: Math.round(wd.daily.temperature_2m_max[i]),
          minTemp: Math.round(wd.daily.temperature_2m_min[i]),
          icon: fi,
          label: fl,
        }
      })

      await sendWeatherEmail(
        user.email,
        user.name || "Farmer",
        user.location,
        Math.round(temperature),
        feelsLike,
        label,
        icon,
        humidity,
        Math.round(windspeed),
        uvIndex,
        advisory,
        extreme,
        forecast
      )
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: users.length })
}

export const GET  = run
export const POST = run
