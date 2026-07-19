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

export async function findRain(
  userLat: number,
  userLon: number,
  countryCode: string | null,
): Promise<RainSpot | null> {
  const byDistance = (list: City[]) =>
    [...list].sort(
      (a, b) =>
        haversineKm(userLat, userLon, a.lat, a.lon) - haversineKm(userLat, userLon, b.lat, b.lon),
    );

  const domestic = countryCode ? CITIES.filter((c) => c.cc === countryCode) : [];
  const foreign = byDistance(CITIES.filter((c) => !countryCode || c.cc !== countryCode)).slice(0, 40);

  const probed: { city: City; weather: Weather }[] = [];

  // 第 1 輪:國內
  if (domestic.length > 0) {
    const weathers = await fetchWeatherBatch(domestic);
    domestic.forEach((city, i) => probed.push({ city, weather: weathers[i] }));
    const hit = pickNearestRainy(probed, userLat, userLon);
    if (hit) return hit;
  }

  // 第 2 輪:鄰近海外
  const weathers = await fetchWeatherBatch(foreign);
  foreign.forEach((city, i) => probed.push({ city, weather: weathers[i] }));
  const hit = pickNearestRainy(probed, userLat, userLon);
  if (hit) return hit;

  // fallback:取降水量最大者
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
