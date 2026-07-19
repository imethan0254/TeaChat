import type { TrackId } from '../types';

/** 內建無縫循環素材 — 全部程式合成,零授權風險(PRD v2 §3.4) */
export const TRACK_SOURCES: Record<TrackId, number> = {
  'rain-mist': require('../../assets/audio/rain-mist.m4a'),
  'rain-drips': require('../../assets/audio/rain-drips.m4a'),
  'rain-light': require('../../assets/audio/rain-light.m4a'),
  'rain-medium': require('../../assets/audio/rain-medium.m4a'),
  'rain-heavy': require('../../assets/audio/rain-heavy.m4a'),
  'rain-downpour': require('../../assets/audio/rain-downpour.m4a'),
  wind: require('../../assets/audio/wind.m4a'),
  'storm-wind': require('../../assets/audio/storm-wind.m4a'),
  fire: require('../../assets/audio/fire.m4a'),
  waves: require('../../assets/audio/waves.m4a'),
  stream: require('../../assets/audio/stream.m4a'),
  birds: require('../../assets/audio/birds.m4a'),
  crickets: require('../../assets/audio/crickets.m4a'),
  keyboard: require('../../assets/audio/keyboard.m4a'),
};

export const THUNDER_SOURCE: number = require('../../assets/audio/thunder.m4a');

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
