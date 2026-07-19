import type { DayPhase } from '../types';

/** 以 Open-Meteo 的 utc_offset_seconds 計算當地時間(不依賴裝置 Intl 時區資料) */
export function localDate(utcOffsetSeconds: number, now = Date.now()): Date {
  return new Date(now + utcOffsetSeconds * 1000);
}

/** 注意:回傳的 Date 是「位移後」的時間,一律用 getUTC* 讀取 */
export function localHour(utcOffsetSeconds: number): number {
  const d = localDate(utcOffsetSeconds);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

export function formatLocalTime(utcOffsetSeconds: number): string {
  const d = localDate(utcOffsetSeconds);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatLocalDate(utcOffsetSeconds: number, weekdays: readonly string[]): string {
  const d = localDate(utcOffsetSeconds);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${weekdays[d.getUTCDay()]}`;
}

/** PRD v2 §4:dawn 05–08 / day 08–17 / dusk 17–20 / night 20–05 */
export function dayPhase(utcOffsetSeconds: number): DayPhase {
  const h = localHour(utcOffsetSeconds);
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export interface Palette {
  /** 全螢幕氛圍漸層(上→下),疊在地圖上 */
  gradient: [string, string, string];
  /** 面板底色 */
  panel: string;
  panelBorder: string;
  text: string;
  subtext: string;
  accent: string;
  /** 控制列底色 */
  bar: string;
  statusBarStyle: 'light' | 'dark';
}

export const PALETTES: Record<DayPhase, Palette> = {
  dawn: {
    gradient: ['rgba(255,183,153,0.34)', 'rgba(255,214,170,0.10)', 'rgba(107,91,149,0.30)'],
    panel: 'rgba(255,250,245,0.82)',
    panelBorder: 'rgba(255,255,255,0.6)',
    text: '#4a3b52',
    subtext: '#8a7a90',
    accent: '#e8896a',
    bar: 'rgba(255,250,245,0.9)',
    statusBarStyle: 'dark',
  },
  day: {
    gradient: ['rgba(168,216,255,0.25)', 'rgba(255,255,255,0.0)', 'rgba(255,236,179,0.18)'],
    panel: 'rgba(255,255,255,0.82)',
    panelBorder: 'rgba(255,255,255,0.65)',
    text: '#31435a',
    subtext: '#7d8da1',
    accent: '#4a90d9',
    bar: 'rgba(255,255,255,0.9)',
    statusBarStyle: 'dark',
  },
  dusk: {
    gradient: ['rgba(74,59,110,0.42)', 'rgba(196,110,110,0.22)', 'rgba(255,166,107,0.30)'],
    panel: 'rgba(50,40,70,0.78)',
    panelBorder: 'rgba(255,255,255,0.18)',
    text: '#ffe9d6',
    subtext: '#c2aeb8',
    accent: '#ffb26b',
    bar: 'rgba(50,40,70,0.88)',
    statusBarStyle: 'light',
  },
  night: {
    gradient: ['rgba(11,16,38,0.55)', 'rgba(20,28,58,0.38)', 'rgba(11,16,38,0.55)'],
    panel: 'rgba(18,24,48,0.8)',
    panelBorder: 'rgba(140,160,255,0.22)',
    text: '#dce4ff',
    subtext: '#8f9bc4',
    accent: '#8fa8ff',
    bar: 'rgba(18,24,48,0.9)',
    statusBarStyle: 'light',
  },
};

/** i18n key per phase(文案走 strings.ts) */
export const PHASE_KEY = {
  dawn: 'phaseDawn',
  day: 'phaseDay',
  dusk: 'phaseDusk',
  night: 'phaseNight',
} as const;
