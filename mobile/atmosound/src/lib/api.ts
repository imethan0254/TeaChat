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

export async function searchCities(
  query: string,
  lang: 'en' | 'zh-Hant' = 'en',
): Promise<GeoResult[]> {
  const url = `${GEOCODE}?name=${encodeURIComponent(query)}&count=8&language=${lang === 'zh-Hant' ? 'zh' : 'en'}&format=json`;
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

export async function reverseGeocode(
  lat: number,
  lon: number,
  lang: 'en' | 'zh-Hant' = 'en',
): Promise<{ name: string; countryCode: string | null }> {
  try {
    const url = `${REVERSE}?latitude=${lat}&longitude=${lon}&localityLanguage=${lang === 'zh-Hant' ? 'zh-Hant' : 'en'}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('reverse failed');
    const j = await res.json();
    const name = j.city || j.locality || j.principalSubdivision || j.countryName;
    if (name) return { name: name as string, countryCode: (j.countryCode as string) || null };
  } catch {
    // fall through to coordinates
  }
  return { name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, countryCode: null };
}

/** 批次查多點即時天氣(找雨引擎用)— Open-Meteo 支援逗號分隔多座標一次回傳 */
export async function fetchWeatherBatch(
  points: { lat: number; lon: number }[],
): Promise<Weather[]> {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.lat.toFixed(3)).join(',');
  const lons = points.map((p) => p.lon.toFixed(3)).join(',');
  const url =
    `${FORECAST}?latitude=${lats}&longitude=${lons}` +
    '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather batch http ${res.status}`);
  const j = await res.json();
  const arr = Array.isArray(j) ? j : [j];
  return arr.map((entry: any) => {
    const c = entry.current;
    return {
      code: c.weather_code,
      isDay: c.is_day === 1,
      temp: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      precip: c.precipitation,
      fetchedAt: Date.now(),
    };
  });
}

/** 未授權定位時的預設唯美城市(PRD:台灣新竹) */
export const DEFAULT_LOCATION: AppLocation = {
  lat: 24.8138,
  lon: 120.9675,
  name: '新竹',
  timezone: 'Asia/Taipei',
  utcOffsetSeconds: 8 * 3600,
};
