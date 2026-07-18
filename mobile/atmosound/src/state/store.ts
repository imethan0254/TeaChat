import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { engine } from '../audio/engine';
import { DEFAULT_LOCATION, fetchWeather } from '../lib/api';
import { isThunderstorm, weatherToMix } from '../lib/soundMap';
import type { AppLocation, TrackId, Weather } from '../types';

const PERSIST_KEY = 'atmosound/v1';
/** 前景每 30 分鐘刷新(PRD v2 §3.3;行動 OS 不保證背景定時網路) */
export const REFRESH_MS = 30 * 60 * 1000;

interface MixerTrackState {
  volume: number;
  enabled: boolean;
}

interface AppState {
  location: AppLocation;
  weather: Weather | null;
  weatherError: boolean;
  isPlaying: boolean;
  master: number;
  mixer: Record<TrackId, MixerTrackState>;
  /** 絕對時間戳;null = 未設定(PRD v2 §3.5,避免 drift) */
  timerEndsAt: number | null;
  timerFading: boolean;

  setLocation: (loc: AppLocation) => Promise<void>;
  refreshWeather: (opts?: { ifStale?: boolean }) => Promise<void>;
  togglePlay: () => void;
  setMaster: (v: number) => void;
  setTrack: (id: TrackId, patch: Partial<MixerTrackState>) => void;
  setTimer: (minutes: number | null) => void;
  /** 計時器到點(App tick 呼叫) */
  onTimerExpired: () => void;
  hydrate: () => Promise<void>;
}

const defaultMixer = (): Record<TrackId, MixerTrackState> => ({
  'rain-light': { volume: 0.6, enabled: false },
  'rain-heavy': { volume: 0.6, enabled: false },
  wind: { volume: 0.5, enabled: false },
  fire: { volume: 0.6, enabled: false },
  waves: { volume: 0.6, enabled: false },
  stream: { volume: 0.6, enabled: false },
  birds: { volume: 0.5, enabled: false },
  crickets: { volume: 0.5, enabled: false },
  keyboard: { volume: 0.5, enabled: false },
});

function applyWeatherToEngine(weather: Weather | null, rampSec = 3) {
  if (!weather) return;
  engine.setWeatherMix(weatherToMix(weather), rampSec);
  engine.setThunder(isThunderstorm(weather));
}

function applyUserToEngine(mixer: Record<TrackId, MixerTrackState>) {
  for (const id of Object.keys(mixer) as TrackId[]) {
    const t = mixer[id];
    engine.setUserTrack(id, t.enabled ? t.volume : 0);
  }
}

export const useApp = create<AppState>((set, get) => ({
  location: DEFAULT_LOCATION,
  weather: null,
  weatherError: false,
  isPlaying: false,
  master: 0.9,
  mixer: defaultMixer(),
  timerEndsAt: null,
  timerFading: false,

  setLocation: async (loc) => {
    set({ location: loc });
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
        weatherError: false,
        location: { ...get().location, timezone: r.timezone, utcOffsetSeconds: r.utcOffsetSeconds },
      });
      applyWeatherToEngine(r.weather);
    } catch {
      // API 失敗:保留上次天氣(UI 顯示「更新於 X 分鐘前」),聲音不中斷
      set({ weatherError: true });
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
    // 淡出完成後同步 UI 狀態
    setTimeout(() => set({ isPlaying: false, timerFading: false }), 10_500);
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PERSIST_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      set({
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
    JSON.stringify({ location: s.location, master: s.master, mixer: s.mixer }),
  );
}
