import type { TrackId, Weather } from '../types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 天氣→聲音對照表(PRD v2 §3.3 SSOT)。
 * 回傳「天氣自動層」各軌目標音量(0–1);用戶疊加層另計。
 * 連續參數:降水量 mm/h 內插雨聲強度、風速 km/h 內插風聲強度。
 */
export function weatherToMix(w: Weather): Partial<Record<TrackId, number>> {
  const mix: Partial<Record<TrackId, number>> = {};
  const code = w.code;

  // 風:任何天氣都按風速疊加;>20km/h 視為強風
  const windVol = w.wind > 20 ? clamp(w.wind / 50, 0.3, 1.0) : clamp(w.wind / 40, 0.08, 0.5);

  if (code === 0 || code === 1 || code === 2 || code === 3) {
    // 晴/多雲:白日鳥鳴、夜晚蟲鳴
    const cloudy = code >= 2;
    if (w.isDay) mix.birds = cloudy ? 0.3 : 0.5;
    else mix.crickets = cloudy ? 0.4 : 0.6;
    mix.wind = Math.max(windVol, cloudy ? 0.35 : 0.25);
  } else if (code === 45 || code === 48) {
    // 霧:低頻風的「悶」
    mix.wind = Math.max(windVol, 0.5);
  } else if (code >= 51 && code <= 57) {
    // 毛毛雨
    mix['rain-light'] = 0.45;
    mix.wind = Math.max(windVol, 0.2);
  } else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    // 雨:強度隨降水量連續內插;>4mm/h 疊加大雨層
    const t = clamp(w.precip / 10, 0, 1);
    mix['rain-light'] = clamp(0.4 + t * 0.4, 0.4, 0.8);
    if (w.precip > 4 || code >= 65 || code >= 81) mix['rain-heavy'] = clamp(t, 0.35, 1.0);
    mix.wind = Math.max(windVol, 0.25);
  } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    // 雪:柔和低頻風的「靜」
    mix.wind = Math.max(windVol * 0.7, 0.5);
  } else if (code >= 95) {
    // 雷雨(雷聲軌由 engine 的排程器隨機觸發,不在此表)
    mix['rain-heavy'] = 0.9;
    mix['rain-light'] = 0.5;
    mix.wind = Math.max(windVol, 0.5);
  } else {
    mix.wind = Math.max(windVol, 0.3);
  }

  return mix;
}

/** 雷雨判定 → engine 啟動隨機雷聲排程 */
export const isThunderstorm = (w: Weather) => w.code >= 95;

export const WEATHER_LABEL: (code: number) => string = (code) => {
  if (code === 0) return '晴朗';
  if (code <= 2) return '晴時多雲';
  if (code === 3) return '陰天';
  if (code <= 48) return '霧';
  if (code <= 57) return '毛毛雨';
  if (code <= 67) return '雨';
  if (code <= 77) return '雪';
  if (code <= 82) return '陣雨';
  if (code <= 86) return '陣雪';
  return '雷雨';
};

export const weatherEmoji = (code: number, isDay: boolean): string => {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 2) return isDay ? '🌤️' : '☁️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  return '⛈️';
};
