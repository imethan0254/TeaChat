import type { TrackId, Weather } from '../types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 7 級雨勢判定(需求 4)。
 * 主依據:降水量 mm/h;輔以 WMO code 保底(陣雨/雷雨代碼即使測站雨量低也不會判太輕)、
 * 強風(>35km/h)升 1 級。回傳 0 = 無雨。
 */
export function rainLevel(w: Weather): number {
  const { precip, code, wind } = w;
  const rainy =
    precip > 0.05 ||
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code >= 95;
  if (!rainy) return 0;

  let level: number;
  if (precip < 0.5) level = 1;
  else if (precip < 2) level = 2;
  else if (precip < 5) level = 3;
  else if (precip < 10) level = 4;
  else if (precip < 20) level = 5;
  else if (precip < 40) level = 6;
  else level = 7;

  // WMO code 保底
  if (code === 55 || code === 57) level = Math.max(level, 2); // 濃毛毛雨
  if (code === 63 || code === 80) level = Math.max(level, 3);
  if (code === 65 || code === 81) level = Math.max(level, 4);
  if (code === 67 || code === 82) level = Math.max(level, 6); // 猛烈陣雨
  if (code === 95) level = Math.max(level, 5);
  if (code === 96 || code === 99) level = Math.max(level, 6);

  // 強風升級(狂暴豪雨的「風吹雨斜」感)
  if (wind > 35) level = Math.min(level + 1, 7);

  return level;
}

/**
 * 每級混音配方(需求 3:聲音分層變化)。
 * 音色階梯:mist(霧感)→ drips(滴答)→ light(沙沙)→ medium(啪嗒)
 * → heavy(轟鳴)→ downpour(白噪 roar)+ storm-wind(狂風),逐級疊加交棒。
 */
export function levelMix(level: number, w: Weather): Partial<Record<TrackId, number>> {
  const windVol = clamp(w.wind / 50, 0, 1);
  switch (level) {
    case 1:
      return { 'rain-mist': 0.5 };
    case 2:
      return { 'rain-mist': 0.25, 'rain-drips': 0.6 };
    case 3:
      return { 'rain-drips': 0.35, 'rain-light': 0.6, wind: windVol * 0.3 };
    case 4:
      return { 'rain-light': 0.35, 'rain-medium': 0.75, wind: windVol * 0.4 };
    case 5:
      return { 'rain-medium': 0.45, 'rain-heavy': 0.8, wind: Math.max(windVol * 0.5, 0.2) };
    case 6:
      return {
        'rain-heavy': 0.7,
        'rain-downpour': 0.75,
        'storm-wind': Math.max(windVol, 0.5),
      };
    case 7:
      return {
        'rain-downpour': 1.0,
        'rain-heavy': 0.55,
        'storm-wind': Math.max(windVol, 0.75),
      };
    default:
      return {}; // 無雨:天氣層靜音(混音器疊加層不受影響)
  }
}

/** 雷聲排程開關:雷雨代碼,或 L6+(狂暴豪雨常伴雷) */
export function thunderOn(level: number, w: Weather): boolean {
  return w.code >= 95 || level >= 6;
}

/**
 * 雨動畫參數(需求 3:動畫隨級數變化)。
 * dropCount/速度/傾角/霧/閃電 皆由級數驅動;RainScene 直接消費。
 */
export interface RainVisual {
  dropCount: number;
  /** 落下時間範圍 ms(越小越快) */
  fallMs: [number, number];
  dropLength: [number, number];
  dropWidth: number;
  /** 風傾角(deg,正值向左掃) */
  slant: number;
  dropOpacity: number;
  /** 霧氣 overlay 透明度(細雨的迷濛感) */
  mist: number;
  /** 閃電機率(每 6 秒觸發一次判定) */
  lightning: number;
  /** 天空加深(疊在漸層上的暗度 0-1) */
  gloom: number;
}

export function rainVisual(level: number, w: Weather): RainVisual {
  const windSlant = clamp(w.wind / 4, 0, 24);
  const presets: Record<number, RainVisual> = {
    // dropWidth 大幅調細:雨呈細線,不再粗線條(需求 2)
    0: { dropCount: 0, fallMs: [3000, 4000], dropLength: [10, 16], dropWidth: 0.6, slant: 0, dropOpacity: 0, mist: 0.06, lightning: 0, gloom: 0 },
    1: { dropCount: 26, fallMs: [4200, 6500], dropLength: [7, 13], dropWidth: 0.6, slant: 2, dropOpacity: 0.28, mist: 0.5, lightning: 0, gloom: 0.05 },
    2: { dropCount: 46, fallMs: [2800, 4200], dropLength: [11, 19], dropWidth: 0.7, slant: 4, dropOpacity: 0.4, mist: 0.3, lightning: 0, gloom: 0.1 },
    3: { dropCount: 70, fallMs: [1900, 2800], dropLength: [17, 27], dropWidth: 0.8, slant: 7, dropOpacity: 0.5, mist: 0.18, lightning: 0, gloom: 0.18 },
    4: { dropCount: 96, fallMs: [1300, 2000], dropLength: [23, 35], dropWidth: 0.9, slant: 10, dropOpacity: 0.58, mist: 0.14, lightning: 0.04, gloom: 0.28 },
    5: { dropCount: 125, fallMs: [950, 1500], dropLength: [31, 47], dropWidth: 1.0, slant: 13, dropOpacity: 0.66, mist: 0.16, lightning: 0.12, gloom: 0.38 },
    6: { dropCount: 158, fallMs: [700, 1100], dropLength: [41, 63], dropWidth: 1.15, slant: 19, dropOpacity: 0.72, mist: 0.24, lightning: 0.3, gloom: 0.5 },
    7: { dropCount: 195, fallMs: [520, 850], dropLength: [53, 82], dropWidth: 1.3, slant: 24, dropOpacity: 0.8, mist: 0.34, lightning: 0.5, gloom: 0.62 },
  };
  const v = presets[clamp(level, 0, 7)];
  // 實際風速再微調傾角
  return { ...v, slant: Math.max(v.slant, windSlant) };
}

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
