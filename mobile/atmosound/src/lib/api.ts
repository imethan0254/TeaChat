import type { AppLocation, GeoResult, Weather } from '../types';

/**
 * 天氣 / 地理 API — 全部免金鑰、免註冊(PRD v2 §5.2):
 * - 天氣 + 時區:Open-Meteo Forecast(timezone=auto 一次回傳)
 * - 城市搜尋:Open-Meteo Geocoding(支援中文)
 * - 反查地名:BigDataCloud reverse-geocode-client(免 key);失敗 fallback 顯示座標
 */

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export async function fetchWeather(
  lat: number,
  lon: number,
): Promise<{ weather: Weather; timezone: string; utcOffsetSeconds: number }> {
  const url =
    `${FORECAST}?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day' +
    '&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather http ${res.status}`);
  const j = await res.json();
  const c = j.current;
  return {
    weather: {
      code: c.weather_code,
      isDay: c.is_day === 1,
      temp: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      precip: c.precipitation,
      fetchedAt: Date.now(),
    },
    timezone: j.timezone,
    utcOffsetSeconds: j.utc_offset_seconds,
  };
}

export async function searchCities(query: string): Promise<GeoResult[]> {
  const url = `${GEOCODE}?name=${encodeURIComponent(query)}&count=8&language=zh&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocode http ${res.status}`);
  const j = await res.json();
  return (j.results ?? []).map((r: any) => ({
    name: r.name,
    country: r.country ?? '',
    admin1: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone ?? 'UTC',
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `${REVERSE}?latitude=${lat}&longitude=${lon}&localityLanguage=zh-Hant`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('reverse failed');
    const j = await res.json();
    const name = j.city || j.locality || j.principalSubdivision || j.countryName;
    if (name) return name as string;
  } catch {
    // fall through to coordinates
  }
  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
}

/** 未授權定位時的預設唯美城市(PRD:台灣新竹) */
export const DEFAULT_LOCATION: AppLocation = {
  lat: 24.8138,
  lon: 120.9675,
  name: '新竹',
  timezone: 'Asia/Taipei',
  utcOffsetSeconds: 8 * 3600,
};
