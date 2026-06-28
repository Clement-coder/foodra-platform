/**
 * POST /api/weather-email
 * Called by Supabase pg_cron daily at 6AM WAT.
 * Fetches weather for every user with a saved location and sends:
 *   - Immediate alert if extreme weather
 *   - Daily morning digest otherwise
 */
import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { sendWeatherEmail } from "@/lib/email"

// Open-Meteo weather code helpers (matches WeatherWidget)
function describeWeather(code: number): { label: string; icon: string; extreme: boolean } {
  if (code === 0)  return { label: "Clear sky",      icon: "☀️",  extreme: false }
  if (code <= 2)   return { label: "Partly cloudy",  icon: "⛅",  extreme: false }
  if (code === 3)  return { label: "Overcast",        icon: "☁️",  extreme: false }
  if (code <= 49)  return { label: "Foggy",           icon: "🌫️", extreme: false }
  if (code <= 59)  return { label: "Drizzle",         icon: "🌦️", extreme: false }
  if (code <= 67)  return { label: "Rain",            icon: "🌧️", extreme: false }
  if (code <= 69)  return { label: "Freezing rain",   icon: "🌨️", extreme: true  }
  if (code <= 79)  return { label: "Snow",            icon: "❄️",  extreme: true  }
  if (code <= 82)  return { label: "Rain showers",    icon: "🌧️", extreme: false }
  if (code <= 84)  return { label: "Heavy showers",   icon: "⛈️", extreme: true  }
  if (code <= 99)  return { label: "Thunderstorm",    icon: "⛈️", extreme: true  }
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

// Geocode a city/country name to lat/lon using Nominatim
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

  // Fetch all users with email + saved location
  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, location")
    .not("email", "is", null)
    .not("location", "is", null)
    .neq("location", "")

  if (!users?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  let failed = 0

  for (const user of users) {
    try {
      const coords = await geocode(user.location)
      if (!coords) continue

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${coords.lat}&longitude=${coords.lon}` +
        `&current_weather=true` +
        `&hourly=relativehumidity_2m,apparent_temperature,uv_index` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
        `&wind_speed_unit=kmh&timezone=auto&forecast_days=7`
      )
      const wd = await weatherRes.json()

      const { temperature, weathercode, windspeed } = wd.current_weather
      const hourIndex = new Date().getHours()
      const humidity   = wd.hourly?.relativehumidity_2m?.[hourIndex] ?? 0
      const feelsLike  = Math.round(wd.hourly?.apparent_temperature?.[hourIndex] ?? temperature)
      const uvIndex    = Math.round(wd.hourly?.uv_index?.[hourIndex] ?? 0)
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

      // Small delay to avoid rate-limiting Nominatim & Open-Meteo
      await new Promise(r => setTimeout(r, 300))
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: users.length })
}

export const GET  = run
export const POST = run
