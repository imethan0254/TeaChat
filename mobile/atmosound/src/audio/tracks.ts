import type { TrackId } from '../types';

/**
 * 內建無縫循環素材 — 全部程式合成,零授權風險(PRD v2 §3.4)。
 * 一律 WAV:AAC/m4a 有 encoder priming gap,循環接縫會「斷一下」;WAV 完全無縫。
 */
export const TRACK_SOURCES: Record<TrackId, number> = {
  'rain-mist': require('../../assets/audio/rain-mist.wav'),
  'rain-drips': require('../../assets/audio/rain-drips.wav'),
  'rain-light': require('../../assets/audio/rain-light.wav'),
  'rain-medium': require('../../assets/audio/rain-medium.wav'),
  'rain-heavy': require('../../assets/audio/rain-heavy.wav'),
  'rain-downpour': require('../../assets/audio/rain-downpour.wav'),
  wind: require('../../assets/audio/wind.wav'),
  'storm-wind': require('../../assets/audio/storm-wind.wav'),
  fire: require('../../assets/audio/fire.wav'),
  waves: require('../../assets/audio/waves.wav'),
  stream: require('../../assets/audio/stream.wav'),
  birds: require('../../assets/audio/birds.wav'),
  crickets: require('../../assets/audio/crickets.wav'),
  keyboard: require('../../assets/audio/keyboard.wav'),
};

export const THUNDER_SOURCE: number = require('../../assets/audio/thunder.wav');

/** 點擊畫面的水滴互動音(需求 8) */
export const DROP_SOURCE: number = require('../../assets/audio/drop.wav');

export const ALL_TRACKS = Object.keys(TRACK_SOURCES) as TrackId[];

/** 混音器可疊加的音軌(雨自動層以外,用戶手動控制)— label 為 i18n key */
export const MIXER_TRACKS = [
  { id: 'fire', labelKey: 'trackFire', emoji: '🔥' },
  { id: 'waves', labelKey: 'trackWaves', emoji: '🌊' },
  { id: 'stream', labelKey: 'trackStream', emoji: '💧' },
  { id: 'keyboard', labelKey: 'trackKeyboard', emoji: '⌨️' },
  { id: 'birds', labelKey: 'trackBirds', emoji: '🐦' },
  { id: 'crickets', labelKey: 'trackCrickets', emoji: '🦗' },
] as const satisfies readonly { id: TrackId; labelKey: string; emoji: string }[];
