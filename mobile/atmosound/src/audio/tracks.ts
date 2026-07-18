import type { TrackId } from '../types';

/** 內建無縫循環素材 — 全部程式合成,零授權風險(PRD v2 §3.4) */
export const TRACK_SOURCES: Record<TrackId, number> = {
  'rain-light': require('../../assets/audio/rain-light.m4a'),
  'rain-heavy': require('../../assets/audio/rain-heavy.m4a'),
  wind: require('../../assets/audio/wind.m4a'),
  fire: require('../../assets/audio/fire.m4a'),
  waves: require('../../assets/audio/waves.m4a'),
  stream: require('../../assets/audio/stream.m4a'),
  birds: require('../../assets/audio/birds.m4a'),
  crickets: require('../../assets/audio/crickets.m4a'),
  keyboard: require('../../assets/audio/keyboard.m4a'),
};

export const THUNDER_SOURCE: number = require('../../assets/audio/thunder.m4a');

export const ALL_TRACKS = Object.keys(TRACK_SOURCES) as TrackId[];

/** 混音器可疊加的音軌(天氣層以外,用戶手動控制) */
export const MIXER_TRACKS: { id: TrackId; label: string; emoji: string }[] = [
  { id: 'fire', label: '柴火', emoji: '🔥' },
  { id: 'waves', label: '海浪', emoji: '🌊' },
  { id: 'stream', label: '溪流', emoji: '💧' },
  { id: 'keyboard', label: '鍵盤敲擊', emoji: '⌨️' },
  { id: 'birds', label: '鳥鳴', emoji: '🐦' },
  { id: 'crickets', label: '蟲鳴', emoji: '🦗' },
];
