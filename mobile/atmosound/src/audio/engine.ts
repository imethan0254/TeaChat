import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { TrackId } from '../types';
import { ALL_TRACKS, THUNDER_SOURCE, TRACK_SOURCES } from './tracks';

/**
 * 音訊引擎(PRD v2 §5.4)
 * - 每軌一個 loop player;「天氣自動層」與「用戶疊加層」音量分離,取 max 後乘總音量
 * - 所有音量變化走 ramp(指數趨近),天氣切換 crossfade ≥3s、停止淡出 ≥10s
 * - 雷聲:獨立 one-shot player,隨機 8–25s 間隔觸發
 */
class SoundEngine {
  private players = new Map<TrackId, AudioPlayer>();
  private thunderPlayer: AudioPlayer | null = null;

  /** 天氣自動層目標音量 */
  private weatherTargets = new Map<TrackId, number>();
  /** 用戶疊加層目標音量 */
  private userTargets = new Map<TrackId, number>();
  /** 目前實際音量(ramp 中間值) */
  private current = new Map<TrackId, number>();

  private master = 1;
  private playing = false;
  private rampSec = 3;
  private tick: ReturnType<typeof setInterval> | null = null;
  private thunderTimer: ReturnType<typeof setTimeout> | null = null;
  private thunderOn = false;
  private ready = false;

  async init() {
    if (this.ready) return;
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
    });
    for (const id of ALL_TRACKS) {
      const p = createAudioPlayer(TRACK_SOURCES[id]);
      p.loop = true;
      p.volume = 0;
      this.players.set(id, p);
      this.current.set(id, 0);
    }
    this.thunderPlayer = createAudioPlayer(THUNDER_SOURCE);
    this.thunderPlayer.volume = 0.8;
    this.ready = true;
  }

  setMaster(v: number) {
    this.master = v;
  }

  /** 天氣變化 → 自動層 crossfade(其餘軌淡出至 0) */
  setWeatherMix(mix: Partial<Record<TrackId, number>>, rampSec = 3) {
    this.rampSec = rampSec;
    for (const id of ALL_TRACKS) this.weatherTargets.set(id, mix[id] ?? 0);
  }

  /** 用戶混音器滑桿 */
  setUserTrack(id: TrackId, volume: number) {
    this.userTargets.set(id, volume);
  }

  setThunder(on: boolean) {
    if (on === this.thunderOn) return;
    this.thunderOn = on;
    if (on) this.scheduleThunder(2000);
    else if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }
  }

  private scheduleThunder(delayMs?: number) {
    const delay = delayMs ?? (8 + Math.random() * 17) * 1000; // 8–25s
    this.thunderTimer = setTimeout(() => {
      if (this.playing && this.thunderOn && this.thunderPlayer) {
        this.thunderPlayer.seekTo(0);
        this.thunderPlayer.volume = (0.5 + Math.random() * 0.5) * this.master;
        this.thunderPlayer.play();
      }
      if (this.thunderOn) this.scheduleThunder();
    }, delay);
  }

  async play() {
    await this.init();
    this.playing = true;
    if (!this.tick) this.tick = setInterval(() => this.step(), 80);
  }

  /** 立即暫停(UI 播放鍵,短淡出避免爆音) */
  pause() {
    this.playing = false;
    // step() 會把音量 ramp 到 0 後 pause 各 player
  }

  /** 計時器到點:長淡出後停止 */
  fadeOutAndStop(seconds = 10) {
    this.rampSec = seconds;
    this.playing = false;
  }

  private step() {
    const dt = 0.08;
    // ramp 時間常數:rampSec 內趨近 95%
    const k = 1 - Math.exp((-3 * dt) / Math.max(this.rampSec, 0.1));
    for (const id of ALL_TRACKS) {
      const p = this.players.get(id)!;
      const target = this.playing
        ? Math.max(this.weatherTargets.get(id) ?? 0, this.userTargets.get(id) ?? 0)
        : 0;
      let cur = this.current.get(id)!;
      cur += (target - cur) * k;
      if (cur < 0.004 && target === 0) {
        cur = 0;
        if (p.playing) p.pause();
      } else if (cur > 0 && !p.playing && this.playing) {
        p.play();
      }
      p.volume = Math.min(1, cur * this.master);
      this.current.set(id, cur);
    }
    if (!this.playing) {
      const anyAudible = [...this.current.values()].some((v) => v > 0);
      if (!anyAudible && this.thunderPlayer?.playing) this.thunderPlayer.pause();
    }
  }

  destroy() {
    if (this.tick) clearInterval(this.tick);
    if (this.thunderTimer) clearTimeout(this.thunderTimer);
    for (const p of this.players.values()) p.remove();
    this.thunderPlayer?.remove();
    this.players.clear();
    this.ready = false;
  }
}

export const engine = new SoundEngine();
