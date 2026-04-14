"use client";

import { useEffect, useState } from "react";
import { CloudSun, Loader2, MapPin } from "lucide-react";

interface WeatherData {
  temp: number;
  description: string;
  city: string;
  icon: string;
}

// WMO weather code → label + emoji
function describeWeather(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear sky", icon: "☀️" };
  if (code <= 2) return { label: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { label: "Overcast", icon: "☁️" };
  if (code <= 49) return { label: "Foggy", icon: "🌫️" };
  if (code <= 59) return { label: "Drizzle", icon: "🌦️" };
  if (code <= 69) return { label: "Rain", icon: "🌧️" };
  if (code <= 79) return { label: "Snow", icon: "❄️" };
  if (code <= 82) return { label: "Rain showers", icon: "🌧️" };
  if (code <= 99) return { label: "Thunderstorm", icon: "⛈️" };
  return { label: "Unknown", icon: "🌡️" };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

          // Reverse geocode city name
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geoData = await geoRes.json();
          const city =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.village ||
            "Your location";

          // Fetch weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const weatherData = await weatherRes.json();
          const { temperature, weathercode } = weatherData.current_weather;
          const { label, icon } = describeWeather(weathercode);

          setWeather({ temp: Math.round(temperature), description: label, city, icon });
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

  return (
    <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg border border-[#118C4C]/20 bg-[#118C4C]/5 w-fit">
      <span className="text-2xl">{weather.icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-foreground">
          {weather.temp}°C · {weather.description}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {weather.city}
        </span>
      </div>
    </div>
  );
}
