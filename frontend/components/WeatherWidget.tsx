"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2, MapPin, Wind, Droplets, Sun, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

interface DayForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  code: number;
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  city: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  isExtreme: boolean;
  forecast: DayForecast[];
}

function describeWeather(code: number): { label: string; icon: string; extreme: boolean } {
  if (code === 0) return { label: "Clear sky", icon: "☀️", extreme: false };
  if (code <= 2) return { label: "Partly cloudy", icon: "⛅", extreme: false };
  if (code === 3) return { label: "Overcast", icon: "☁️", extreme: false };
  if (code <= 49) return { label: "Foggy", icon: "🌫️", extreme: false };
  if (code <= 59) return { label: "Drizzle", icon: "🌦️", extreme: false };
  if (code <= 67) return { label: "Rain", icon: "🌧️", extreme: false };
  if (code <= 69) return { label: "Freezing rain", icon: "🌨️", extreme: true };
  if (code <= 79) return { label: "Snow", icon: "❄️", extreme: true };
  if (code <= 82) return { label: "Rain showers", icon: "🌧️", extreme: false };
  if (code <= 84) return { label: "Heavy showers", icon: "⛈️", extreme: true };
  if (code <= 99) return { label: "Thunderstorm", icon: "⛈️", extreme: true };
  return { label: "Unknown", icon: "🌡️", extreme: false };
}

function cropAdvisory(code: number, uvIndex: number): string {
  if (code >= 95) return "⚠️ Thunderstorm — stay indoors, protect crops and equipment.";
  if (code >= 80) return "🌧️ Heavy showers — avoid harvesting, check drainage.";
  if (code >= 61) return "🌧️ Rainy — avoid pesticide spraying, good for irrigation.";
  if (code >= 51) return "🌦️ Drizzle — light field work okay, avoid spraying.";
  if (code >= 45) return "🌫️ Foggy — delay harvesting until visibility improves.";
  if (code === 0 && uvIndex >= 8) return "☀️ Very sunny — water crops early morning, avoid midday fieldwork.";
  if (code === 0) return "☀️ Clear sky — great day for harvesting and fieldwork.";
  if (code <= 2) return "⛅ Partly cloudy — ideal conditions for most farm activities.";
  return "🌾 Moderate conditions — normal farm activities are fine.";
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EXTREME_NOTIF_KEY = "foodra_weather_extreme_notified";

interface WeatherWidgetProps {
  userId?: string;
}

export function WeatherWidget({ userId }: WeatherWidgetProps) {
  const { getAccessToken } = usePrivy();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;

          const [geoRes, weatherRes] = await Promise.all([
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`),
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
              `&current_weather=true` +
              `&hourly=relativehumidity_2m,apparent_temperature,uv_index` +
              `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
              `&wind_speed_unit=kmh&timezone=auto&forecast_days=7`
            ),
          ]);

          const geoData = await geoRes.json();
          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            geoData.address?.suburb ||
            geoData.address?.county ||
            geoData.address?.state_district ||
            geoData.address?.state ||
            "Your location";

          const wd = await weatherRes.json();
          const { temperature, weathercode, windspeed } = wd.current_weather;
          const { label, icon, extreme } = describeWeather(weathercode);

          // Get current hour index for humidity / feels-like / UV
          const now = new Date();
          const hourIndex = now.getHours();
          const humidity = wd.hourly?.relativehumidity_2m?.[hourIndex] ?? 0;
          const feelsLike = Math.round(wd.hourly?.apparent_temperature?.[hourIndex] ?? temperature);
          const uvIndex = Math.round(wd.hourly?.uv_index?.[hourIndex] ?? 0);

          const forecast: DayForecast[] = (wd.daily?.time ?? []).map((dateStr: string, i: number) => ({
            date: dateStr,
            maxTemp: Math.round(wd.daily.temperature_2m_max[i]),
            minTemp: Math.round(wd.daily.temperature_2m_min[i]),
            code: wd.daily.weathercode[i],
          }));

          const data: WeatherData = {
            temp: Math.round(temperature),
            feelsLike,
            description: label,
            city,
            icon,
            humidity,
            windSpeed: Math.round(windspeed),
            uvIndex,
            isExtreme: extreme,
            forecast,
          };

          setWeather(data);

          // Extreme weather: browser notification + notification bar
          if (extreme) {
            const lastNotified = sessionStorage.getItem(EXTREME_NOTIF_KEY);
            if (lastNotified !== label) {
              sessionStorage.setItem(EXTREME_NOTIF_KEY, label);
              fireExtremeAlert(getAccessToken, label, icon, city, userId);
            }
          }
        } catch {
          setError("Could not load weather");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied");
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 p-3 rounded-lg border border-border bg-muted/30 w-fit">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading weather...</span>
      </div>
    );
  }

  if (error || !weather) return null;

  const advisory = cropAdvisory(
    // use today's daily code if available
    weather.forecast[0]?.code ?? 0,
    weather.uvIndex
  );

  return (
    <div className="mb-6 rounded-xl border border-[#118C4C]/20 bg-[#118C4C]/5 overflow-hidden">
      {/* Extreme weather banner */}
      {weather.isExtreme && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Extreme weather alert: {weather.description} in {weather.city}
        </div>
      )}

      {/* Main row */}
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{weather.icon}</span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">{weather.temp}°C</span>
              <span className="text-xs text-muted-foreground">Feels {weather.feelsLike}°C</span>
              <span className="text-sm text-muted-foreground">· {weather.description}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              {weather.city}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5 text-blue-400" />{weather.humidity}%</span>
          <span className="flex items-center gap-1"><Wind className="h-3.5 w-3.5 text-sky-400" />{weather.windSpeed} km/h</span>
          <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-yellow-400" />UV {weather.uvIndex}</span>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-[#118C4C] font-medium hover:underline flex-shrink-0"
        >
          {expanded ? <><ChevronUp className="h-3.5 w-3.5" />Less</> : <><ChevronDown className="h-3.5 w-3.5" />More</>}
        </button>
      </div>

      {/* Expanded: forecast + advisory */}
      {expanded && (
        <div className="border-t border-[#118C4C]/10 px-4 py-3 space-y-3">
          {/* Mobile stats */}
          <div className="flex sm:hidden items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5 text-blue-400" />{weather.humidity}%</span>
            <span className="flex items-center gap-1"><Wind className="h-3.5 w-3.5 text-sky-400" />{weather.windSpeed} km/h</span>
            <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-yellow-400" />UV {weather.uvIndex}</span>
          </div>

          {/* 7-day forecast */}
          <div className="grid grid-cols-7 gap-1">
            {weather.forecast.map((day) => {
              const d = new Date(day.date);
              const dayName = DAYS[d.getUTCDay()];
              const { icon } = describeWeather(day.code);
              return (
                <div key={day.date} className="flex flex-col items-center gap-0.5 text-center">
                  <span className="text-[10px] text-muted-foreground font-medium">{dayName}</span>
                  <span className="text-base">{icon}</span>
                  <span className="text-[10px] font-semibold text-foreground">{day.maxTemp}°</span>
                  <span className="text-[10px] text-muted-foreground">{day.minTemp}°</span>
                </div>
              );
            })}
          </div>

          {/* Crop advisory */}
          <div className="rounded-lg bg-[#118C4C]/10 px-3 py-2 text-xs text-foreground font-medium">
            {advisory}
          </div>
        </div>
      )}
    </div>
  );
}

// Fire browser notification + store in notification bar via API
async function fireExtremeAlert(getAccessToken: (() => Promise<string | null>) | undefined, label: string, icon: string, city: string, userId?: string) {
  const title = `${icon} Weather Alert: ${label}`;
  const body = `Extreme weather (${label}) detected near ${city}. Take precautions.`;

  // Browser push notification
  if ("Notification" in window) {
    const permission = Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

    if (permission === "granted") {
      new Notification(title, {
        body,
        icon: "/foodra_logo.jpeg",
        badge: "/icon-32x32.png",
      });
    }
  }

  // Store in notification bar for logged-in user
  try {
    if (!userId) return;
    await authFetch(getAccessToken, "/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        type: "system",
        title,
        message: body,
        link: "/marketplace",
      }),
    });
  } catch {
    // Silently fail — notification bar is best-effort
  }
}
