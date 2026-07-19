import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/** 點擊畫面的水波紋(需求 8):同心圓擴散 + 淡出,搭配 engine.playDrop() 水滴聲 */

export interface Ripple {
  id: number;
  x: number;
  y: number;
}

function RippleCircle({ x, y }: { x: number; y: number }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [t]);

  const ring = (delay: number, maxScale: number) => {
    const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.15, maxScale] });
    const opacity = t.interpolate({
      inputRange: [0, delay, 1],
      outputRange: [0.55, 0.45, 0],
    });
    return { transform: [{ scale }], opacity };
  };

  return (
    <View pointerEvents="none" style={[styles.center, { left: x - 60, top: y - 60 }]}>
      <Animated.View style={[styles.ring, ring(0.2, 1.0)]} />
      <Animated.View style={[styles.ring, styles.ringInner, ring(0.4, 0.65)]} />
    </View>
  );
}

export function RippleLayer({ ripples }: { ripples: Ripple[] }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ripples.map((r) => (
        <RippleCircle key={r.id} x={r.x} y={r.y} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(220,235,255,0.9)',
  },
  ringInner: { width: 120, height: 120 },
});
