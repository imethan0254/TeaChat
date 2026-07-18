import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { WEATHER_LABEL, weatherEmoji } from '../lib/soundMap';
import { formatLocalDate, formatLocalTime, PHASE_LABEL, type Palette } from '../lib/theme';
import { useApp } from '../state/store';
import type { DayPhase } from '../types';

interface Props {
  palette: Palette;
  phase: DayPhase;
}

/** 半透明天氣數據面板(PRD v2 §3.2):地名、當地時間(即時計算)、四項氣象數據、動態圖示 */
export function WeatherPanel({ palette, phase }: Props) {
  const { location, weather, weatherError } = useApp();
  const [, forceTick] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  // 當地時間每 20 秒 tick 重算(不存死字串)
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 20_000);
    return () => clearInterval(t);
  }, []);

  // 天氣圖示呼吸動畫
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const staleMin = weather ? Math.round((Date.now() - weather.fetchedAt) / 60000) : 0;

  return (
    <View style={[styles.panel, { backgroundColor: palette.panel, borderColor: palette.panelBorder }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.place, { color: palette.text }]} numberOfLines={1}>
            {location.name}
          </Text>
          <Text style={[styles.time, { color: palette.subtext }]}>
            {formatLocalDate(location.utcOffsetSeconds)} · {formatLocalTime(location.utcOffsetSeconds)}{' '}
            {PHASE_LABEL[phase]}
          </Text>
        </View>
        <Animated.Text style={[styles.emoji, { transform: [{ scale: pulse }] }]}>
          {weather ? weatherEmoji(weather.code, weather.isDay) : '🌍'}
        </Animated.Text>
      </View>

      {weather ? (
        <>
          <View style={styles.dataRow}>
            <Datum label="溫度" value={`${Math.round(weather.temp)}°`} palette={palette} />
            <Datum label="降水" value={`${weather.precip} mm`} palette={palette} />
            <Datum label="濕度" value={`${Math.round(weather.humidity)}%`} palette={palette} />
            <Datum label="風速" value={`${Math.round(weather.wind)} km/h`} palette={palette} />
          </View>
          <Text style={[styles.condition, { color: palette.accent }]}>
            {WEATHER_LABEL(weather.code)}
            {weatherError && staleMin > 0 ? `(更新於 ${staleMin} 分鐘前)` : ''}
          </Text>
        </>
      ) : (
        <Text style={[styles.condition, { color: palette.subtext }]}>
          {weatherError ? '無法取得天氣,將自動重試' : '取得天氣中…'}
        </Text>
      )}
    </View>
  );
}

function Datum({ label, value, palette }: { label: string; value: string; palette: Palette }) {
  return (
    <View style={styles.datum}>
      <Text style={[styles.datumValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.datumLabel, { color: palette.subtext }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  place: { fontSize: 24, fontWeight: '700', letterSpacing: 0.5 },
  time: { fontSize: 13, marginTop: 3 },
  emoji: { fontSize: 44, marginLeft: 8 },
  dataRow: { flexDirection: 'row', marginTop: 14 },
  datum: { flex: 1, alignItems: 'center' },
  datumValue: { fontSize: 17, fontWeight: '600' },
  datumLabel: { fontSize: 11, marginTop: 2 },
  condition: { marginTop: 12, fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
