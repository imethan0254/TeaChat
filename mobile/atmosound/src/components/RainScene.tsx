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

interface Props {
  visual: RainVisual;
  phase: DayPhase;
}

export function RainScene({ visual, phase }: Props) {
  const { width, height } = useWindowDimensions();

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
        <Drop key={`${visual.dropCount}-${i}`} spec={d} slant={visual.slant} height={height} width={width} />
      ))}
      <Lightning chance={visual.lightning} />
      {/* 地面積水的微光 */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', `rgba(190,210,235,${0.08 + visual.dropOpacity * 0.12})`]}
        style={styles.ground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
});
