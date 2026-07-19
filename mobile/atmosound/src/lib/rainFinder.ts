import type { Lang } from '../i18n/strings';
import type { Weather } from '../types';
import { fetchWeatherBatch } from './api';
import { CITIES, type City } from './cities';
import { rainLevel } from './rainLevels';

/**
 * 找雨引擎(需求 1):
 * 1. 先查使用者所在國家的候選城市,有雨 → 取離使用者最近者
 * 2. 國內無雨 → 依距離查最近的 40 個海外城市,取最近的下雨處
 * 3. 全部無雨(罕見)→ fallback 取查過城市中降水量最大者
 */

export interface RainSpot {
  city: City;
  weather: Weather;
  level: number;
  /** 是否為「附近皆無雨,取最濕處」的 fallback */
  fallback: boolean;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 批次探測(chunk 60 城/請求,避免 URL 過長) */
export async function probeCities(list: City[]): Promise<{ city: City; weather: Weather }[]> {
  const out: { city: City; weather: Weather }[] = [];
  for (let i = 0; i < list.length; i += 60) {
    const chunk = list.slice(i, i + 60);
    const weathers = await fetchWeatherBatch(chunk);
    chunk.forEach((city, j) => out.push({ city, weather: weathers[j] }));
  }
  return out;
}

export async function findRain(
  userLat: number,
  userLon: number,
  countryCode: string | null,
  mode: 'nearest' | 'random' = 'nearest',
): Promise<RainSpot | null> {
  const byDistance = (list: City[]) =>
    [...list].sort(
      (a, b) =>
        haversineKm(userLat, userLon, a.lat, a.lon) - haversineKm(userLat, userLon, b.lat, b.lon),
    );

  // 隨機模式(需求 7:find rain 按鈕):掃全球候選,隨機挑一個正在下雨處
  if (mode === 'random') {
    const probed = await probeCities(CITIES);
    const rainy = probed
      .map((p) => ({ ...p, level: rainLevel(p.weather) }))
      .filter(
        (p) => p.level > 0 && haversineKm(userLat, userLon, p.city.lat, p.city.lon) > 5, // 排除目前地點
      );
    if (rainy.length > 0) {
      const pick = rainy[Math.floor(Math.random() * rainy.length)];
      return { city: pick.city, weather: pick.weather, level: pick.level, fallback: false };
    }
    return wettestFallback(probed);
  }

  // 最近模式(需求 7:重新定位):先國內,無雨再擴鄰近海外
  const domestic = countryCode ? CITIES.filter((c) => c.cc === countryCode) : [];
  const foreign = byDistance(CITIES.filter((c) => !countryCode || c.cc !== countryCode)).slice(0, 40);

  const probed: { city: City; weather: Weather }[] = [];

  if (domestic.length > 0) {
    probed.push(...(await probeCities(domestic)));
    const hit = pickNearestRainy(probed, userLat, userLon);
    if (hit) return hit;
  }

  probed.push(...(await probeCities(foreign)));
  const hit = pickNearestRainy(probed, userLat, userLon);
  if (hit) return hit;

  return wettestFallback(probed);
}

function wettestFallback(probed: { city: City; weather: Weather }[]): RainSpot | null {
  if (probed.length === 0) return null;
  const wettest = probed.reduce((a, b) => (b.weather.precip > a.weather.precip ? b : a));
  return {
    city: wettest.city,
    weather: wettest.weather,
    level: Math.max(rainLevel(wettest.weather), 1),
    fallback: true,
  };
}

function pickNearestRainy(
  probed: { city: City; weather: Weather }[],
  userLat: number,
  userLon: number,
): RainSpot | null {
  const rainy = probed
    .map((p) => ({ ...p, level: rainLevel(p.weather) }))
    .filter((p) => p.level > 0)
    .sort(
      (a, b) =>
        haversineKm(userLat, userLon, a.city.lat, a.city.lon) -
        haversineKm(userLat, userLon, b.city.lat, b.city.lon),
    );
  if (rainy.length === 0) return null;
  const best = rainy[0];
  return { city: best.city, weather: best.weather, level: best.level, fallback: false };
}

export const cityName = (c: City, lang: Lang) => (lang === 'zh-Hant' ? c.zh : c.en);
