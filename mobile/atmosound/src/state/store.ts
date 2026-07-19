import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { engine } from '../audio/engine';
import type { Lang } from '../i18n/strings';
import { DEFAULT_LOCATION, fetchWeather } from '../lib/api';
import { findRain } from '../lib/rainFinder';
import { levelMix, rainLevel, thunderOn } from '../lib/rainLevels';
import type { AppLocation, TrackId, Weather } from '../types';

const PERSIST_KEY = 'rainland/v1';
/** 前景每 30 分鐘刷新(PRD v2 §3.3;行動 OS 不保證背景定時網路) */
export const REFRESH_MS = 30 * 60 * 1000;

interface MixerTrackState {
  volume: number;
  enabled: boolean;
}

/** 找雨結果的 UI 提示 */
export type RainSearchNote = 'found' | 'fallback' | null;

interface AppState {
  lang: Lang;
  /** 預設雨景動畫,floating button 切地圖(需求 3) */
  view: 'rain' | 'map';
  location: AppLocation;
  weather: Weather | null;
  weatherError: boolean;
  /** 目前 7 級雨勢(0 = 無雨),由 weather 推導後存起供 UI/動畫直接用 */
  level: number;
  isPlaying: boolean;
  master: number;
  mixer: Record<TrackId, MixerTrackState>;
  timerEndsAt: number | null;
  timerFading: boolean;
  findingRain: boolean;
  rainSearchNote: RainSearchNote;
  /** 使用者實體位置(找雨的距離基準;null = 未授權定位) */
  userPos: { lat: number; lon: number; countryCode: string | null } | null;

  setLang: (l: Lang) => void;
  setView: (v: 'rain' | 'map') => void;
  setUserPos: (p: { lat: number; lon: number; countryCode: string | null }) => void;
  setLocation: (loc: AppLocation) => Promise<void>;
  refreshWeather: (opts?: { ifStale?: boolean }) => Promise<void>;
  /** 需求 1:找到(最近的)正在下雨的地方並切換過去 */
  runRainFinder: () => Promise<void>;
  togglePlay: () => void;
  setMaster: (v: number) => void;
  setTrack: (id: TrackId, patch: Partial<MixerTrackState>) => void;
  setTimer: (minutes: number | null) => void;
  onTimerExpired: () => void;
  hydrate: () => Promise<void>;
}

const defaultMixer = (): Record<TrackId, MixerTrackState> => ({
  'rain-mist': { volume: 0.5, enabled: false },
  'rain-drips': { volume: 0.5, enabled: false },
  'rain-light': { volume: 0.6, enabled: false },
  'rain-medium': { volume: 0.6, enabled: false },
  'rain-heavy': { volume: 0.6, enabled: false },
  'rain-downpour': { volume: 0.6, enabled: false },
  wind: { volume: 0.5, enabled: false },
  'storm-wind': { volume: 0.5, enabled: false },
  fire: { volume: 0.6, enabled: false },
  waves: { volume: 0.6, enabled: false },
  stream: { volume: 0.6, enabled: false },
  birds: { volume: 0.5, enabled: false },
  crickets: { volume: 0.5, enabled: false },
  keyboard: { volume: 0.5, enabled: false },
});

function applyWeatherToEngine(weather: Weather | null, rampSec = 3) {
  if (!weather) return;
  const lv = rainLevel(weather);
  engine.setWeatherMix(levelMix(lv, weather), rampSec);
  engine.setThunder(thunderOn(lv, weather));
}

function applyUserToEngine(mixer: Record<TrackId, MixerTrackState>) {
  for (const id of Object.keys(mixer) as TrackId[]) {
    const t = mixer[id];
    engine.setUserTrack(id, t.enabled ? t.volume : 0);
  }
}

export const useApp = create<AppState>((set, get) => ({
  lang: 'en', // 需求 2:預設英文
  view: 'rain', // 需求 3:預設雨景
  location: DEFAULT_LOCATION,
  weather: null,
  weatherError: false,
  level: 0,
  isPlaying: false,
  master: 0.9,
  mixer: defaultMixer(),
  timerEndsAt: null,
  timerFading: false,
  findingRain: false,
  rainSearchNote: null,
  userPos: null,

  setLang: (l) => {
    set({ lang: l });
    persist(get());
  },

  setView: (v) => set({ view: v }),

  setUserPos: (p) => set({ userPos: p }),

  setLocation: async (loc) => {
    set({ location: loc, rainSearchNote: null });
    persist(get());
    await get().refreshWeather();
  },

  refreshWeather: async (opts) => {
    const { location, weather } = get();
    if (opts?.ifStale && weather && Date.now() - weather.fetchedAt < 5 * 60 * 1000) return;
    try {
      const r = await fetchWeather(location.lat, location.lon);
      set({
        weather: r.weather,
        level: rainLevel(r.weather),
        weatherError: false,
        location: { ...get().location, timezone: r.timezone, utcOffsetSeconds: r.utcOffsetSeconds },
      });
      applyWeatherToEngine(r.weather);
    } catch {
      // API 失敗:保留上次天氣(UI 顯示「更新於 X 分鐘前」),聲音不中斷
      set({ weatherError: true });
    }
  },

  runRainFinder: async () => {
    const { userPos, location, lang } = get();
    const baseLat = userPos?.lat ?? location.lat;
    const baseLon = userPos?.lon ?? location.lon;
    const cc = userPos?.countryCode ?? 'TW';
    set({ findingRain: true });
    try {
      const spot = await findRain(baseLat, baseLon, cc);
      if (spot) {
        const name = lang === 'zh-Hant' ? spot.city.zh : spot.city.en;
        set({
          location: {
            lat: spot.city.lat,
            lon: spot.city.lon,
            name,
            timezone: get().location.timezone,
            utcOffsetSeconds: get().location.utcOffsetSeconds,
          },
          weather: spot.weather,
          level: spot.level,
          rainSearchNote: spot.fallback ? 'fallback' : 'found',
        });
        applyWeatherToEngine(spot.weather);
        persist(get());
        // 補抓正確時區(單點 API 會回 timezone)
        await get().refreshWeather();
      }
    } catch {
      set({ weatherError: true });
    } finally {
      set({ findingRain: false });
    }
  },

  togglePlay: () => {
    const next = !get().isPlaying;
    set({ isPlaying: next, timerFading: false });
    if (next) {
      engine.setMaster(get().master);
      applyWeatherToEngine(get().weather);
      applyUserToEngine(get().mixer);
      void engine.play();
    } else {
      engine.pause();
    }
  },

  setMaster: (v) => {
    set({ master: v });
    engine.setMaster(v);
    persist(get());
  },

  setTrack: (id, patch) => {
    const mixer = { ...get().mixer, [id]: { ...get().mixer[id], ...patch } };
    set({ mixer });
    applyUserToEngine(mixer);
    persist(get());
  },

  setTimer: (minutes) => {
    if (minutes === null) {
      set({ timerEndsAt: null, timerFading: false });
      return;
    }
    set({ timerEndsAt: Date.now() + minutes * 60 * 1000, timerFading: false });
  },

  onTimerExpired: () => {
    if (get().timerFading) return;
    set({ timerFading: true, timerEndsAt: null });
    engine.fadeOutAndStop(10);
    setTimeout(() => set({ isPlaying: false, timerFading: false }), 10_500);
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PERSIST_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      set({
        lang: s.lang === 'zh-Hant' ? 'zh-Hant' : 'en',
        location: s.location ?? DEFAULT_LOCATION,
        master: s.master ?? 0.9,
        mixer: { ...defaultMixer(), ...(s.mixer ?? {}) },
      });
    } catch {
      // 壞資料就用預設值
    }
  },
}));

function persist(s: AppState) {
  void AsyncStorage.setItem(
    PERSIST_KEY,
    JSON.stringify({ lang: s.lang, location: s.location, master: s.master, mixer: s.mixer }),
  );
}
