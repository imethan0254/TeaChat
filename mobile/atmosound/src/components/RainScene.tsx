import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { RainVisual } from '../lib/rainLevels';
import type { DayPhase } from '../types';

/**
 * 雨景動畫背景(需求 3)。
 * - 每顆雨滴一條 useNativeDriver 的 translateY/X loop,長度/速度/傾角/密度由 7 級 RainVisual 驅動
 * - 細雨:霧氣層呼吸;豪雨:天空加深 + 隨機閃電
 * - 天空漸層隨「選定地點」當地時段(清晨/白晝/黃昏/夜晚)變化
 */

/** 天空漸層(上→中→下),隨當地時段 */
const SKY_COLORS: Record<DayPhase, [string, string, string]> = {
  dawn: ['#6e6591', '#a58ba0', '#e2b49a'],
  day: ['#6f8fb5', '#8fa9c4', '#b7c6d3'],
  dusk: ['#3d3660', '#7d5a78', '#c98a6b'],
  night: ['#0a0f24', '#141c3a', '#1d2645'],
};

interface DropSpec {
  x: number; // 0-1 viewport 比例
  delay: number;
  duration: number;
  length: number;
  width: number;
  opacity: number;
}

function Drop({
  spec,
  slant,
  height,
  width: vw,
}: {
  spec: DropSpec;
  slant: number;
  height: number;
  width: number;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: spec.duration,
        delay: spec.delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [t, spec.duration, spec.delay]);

  const drift = Math.tan((slant * Math.PI) / 180) * (height + 120);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-spec.length - 60, height + 60] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, -drift] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: spec.x * (vw + drift),
        top: 0,
        width: spec.width,
        height: spec.length,
        borderRadius: spec.width,
        backgroundColor: 'rgba(220,235,255,0.9)',
        opacity: spec.opacity,
        transform: [{ translateY }, { translateX }, { rotate: `${slant}deg` }],
      }}
    />
  );
}

function Lightning({ chance }: { chance: number }) {
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (chance <= 0) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      if (Math.random() < chance) {
        Animated.sequence([
          Animated.timing(flash, { toValue: 0.85, duration: 60, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0.1, duration: 90, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0.6, duration: 70, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]).start();
      }
      timer = setTimeout(tick, 4000 + Math.random() * 4000);
    };
    let timer = setTimeout(tick, 3000);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [chance, flash]);

  if (chance <= 0) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.fill, { backgroundColor: '#e8f0ff', opacity: flash }]}
    />
  );
}

function MistLayer({ intensity }: { intensity: number }) {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (intensity <= 0) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [intensity, breathe]);

  if (intensity <= 0) return null;
  const opacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [intensity * 0.6, intensity],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.fill, { backgroundColor: '#cfd8e3', opacity }]}
    />
  );
}

export interface RainBurst {
  id: number;
  /** 0–1 螢幕寬度比例(點擊處) */
  x: number;
}

/** 單顆地面濺水:底部一圈快速擴散淡出的橢圓,模擬雨滴打到地板 */
function GroundSplash({ leftPct, delay, period, vw }: { leftPct: number; delay: number; period: number; vw: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(period),
      ]),
    );
    run.start();
    return () => run.stop();
  }, [t, delay, period]);
  const scaleX = t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.7] });
  const scaleY = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 10,
        left: leftPct * vw - 13,
        width: 26,
        height: 11,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: 'rgba(215,232,255,0.9)',
        opacity,
        transform: [{ scaleX }, { scaleY }],
      }}
    />
  );
}

/** 地面濺水層:數量隨雨勢級數,持續在底部隨機冒出濺水 */
function GroundSplashLayer({ level, vw }: { level: number; vw: number }) {
  const spots = useMemo(() => {
    const count = Math.min(Math.round(level * 3.2), 22);
    return Array.from({ length: count }, () => ({
      leftPct: Math.random(),
      delay: Math.random() * 1600,
      period: 500 + Math.random() * (1600 - level * 150),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);
  if (level <= 0) return null;
  return (
    <>
      {spots.map((s, i) => (
        <GroundSplash key={`gs-${level}-${i}`} leftPct={s.leftPct} delay={s.delay} period={Math.max(s.period, 350)} vw={vw} />
      ))}
    </>
  );
}

/** 點擊灑雨:在點擊 x 欄位灑下一陣快雨 + 落地濺水(需求 1) */
function Burst({ x, height, vw }: { x: number; height: number; vw: number }) {
  const cx = x * vw;
  const drops = useMemo(
    () =>
      Array.from({ length: 16 }, () => ({
        dx: (Math.random() - 0.5) * 76,
        delay: Math.random() * 180,
        dur: 380 + Math.random() * 240,
        len: 18 + Math.random() * 24,
        w: 1.8 + Math.random() * 1.2,
      })),
    [],
  );
  const splash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(340),
      Animated.timing(splash, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [splash]);
  return (
    <View pointerEvents="none" style={styles.fill}>
      {drops.map((d, i) => (
        <BurstDrop key={`bd-${i}`} left={cx + d.dx} delay={d.delay} dur={d.dur} len={d.len} w={d.w} height={height} />
      ))}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 8,
          left: cx - 20,
          width: 40,
          height: 16,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: 'rgba(225,238,255,0.95)',
          opacity: splash.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.7, 0] }),
          transform: [
            { scaleX: splash.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.8] }) },
            { scaleY: splash.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          ],
        }}
      />
    </View>
  );
}

function BurstDrop({ left, delay, dur, len, w, height }: { left: number; delay: number; dur: number; len: number; w: number; height: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, delay, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
  }, [t, delay, dur]);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-len - 40, height - 14] });
  const opacity = t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.9, 0.9, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left,
        top: 0,
        width: w,
        height: len,
        borderRadius: w,
        backgroundColor: 'rgba(220,235,255,0.95)',
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

interface Props {
  visual: RainVisual;
  phase: DayPhase;
  /** 點擊灑雨事件(保留;目前 App 未使用) */
  bursts?: RainBurst[];
  /** 點擊改變的雨傾斜角(度);null = 用風速預設傾角(需求 1) */
  slantOverride?: number | null;
}

export function RainScene({ visual, phase, bursts = [], slantOverride = null }: Props) {
  const { width, height } = useWindowDimensions();
  // 點擊指定的傾角優先,否則用天氣風速的預設傾角
  const slant = slantOverride ?? visual.slant;


  // 每級生成一組固定雨滴規格(level 變了才重算 → 動畫平順)
  const drops = useMemo<DropSpec[]>(() => {
    const arr: DropSpec[] = [];
    for (let i = 0; i < visual.dropCount; i++) {
      const [dMin, dMax] = visual.fallMs;
      const [lMin, lMax] = visual.dropLength;
      arr.push({
        x: Math.random(),
        delay: Math.random() * dMax,
        duration: dMin + Math.random() * (dMax - dMin),
        length: lMin + Math.random() * (lMax - lMin),
        width: visual.dropWidth * (0.7 + Math.random() * 0.6),
        opacity: visual.dropOpacity * (0.5 + Math.random() * 0.5),
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visual.dropCount, visual.dropOpacity, visual.slant]);

  return (
    <View style={styles.fill} pointerEvents="none">
      <LinearGradient colors={SKY_COLORS[phase]} style={styles.fill} />
      {/* 豪雨的天色加深 */}
      <View style={[styles.fill, { backgroundColor: '#060a14', opacity: visual.gloom }]} />
      <MistLayer intensity={visual.mist} />
      {drops.map((d, i) => (
        <Drop key={`${visual.dropCount}-${i}`} spec={d} slant={slant} height={height} width={width} />
      ))}
      <Lightning chance={visual.lightning} />
      {/* 地面積水的微光 */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', `rgba(190,210,235,${0.08 + visual.dropOpacity * 0.12})`]}
        style={styles.ground}
      />
      {/* 雨打到地板的濺水(需求 1) */}
      <GroundSplashLayer level={Math.min(Math.round(visual.dropCount / 25), 7)} vw={width} />
      {/* 點擊灑下的一陣雨 */}
      {bursts.map((b) => (
        <Burst key={b.id} x={b.x} height={height} vw={width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
});
