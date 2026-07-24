import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { makeT, RAIN_LEVEL_TEXT } from '../i18n/strings';
import { formatLocalDate, formatLocalTime, PHASE_KEY, type Palette } from '../lib/theme';
import { useApp } from '../state/store';
import type { DayPhase } from '../types';
import { ChevronDownIcon, InfoIcon } from './Icons';
import { LevelInfoModal } from './LevelInfoModal';
import { WeatherGlyph } from './WeatherGlyph';

interface Props {
  palette: Palette;
  phase: DayPhase;
}

/**
 * 天氣面板(需求 3):預設精簡(地名 / 日期時間 / 設計感天氣圖示),
 * 右側展開收合鈕切換完整資訊(雨勢名稱+描述+四項氣象數據)。
 */
export function WeatherPanel({ palette, phase }: Props) {
  const { lang, location, weather, weatherError, level, rainSearchNote, findingRain } = useApp();
  const t = makeT(lang);
  const [, forceTick] = useState(0);
  const [showScale, setShowScale] = useState(false);
  const [expanded, setExpanded] = useState(false); // 預設精簡
  const pulse = useRef(new Animated.Value(1)).current;
  const chevron = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 20_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  useEffect(() => {
    Animated.timing(chevron, { toValue: expanded ? 1 : 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [expanded, chevron]);

  const staleMin = weather ? Math.round((Date.now() - weather.fetchedAt) / 60000) : 0;
  const levelText = level > 0 ? RAIN_LEVEL_TEXT[level] : null;
  const rotate = chevron.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.panel, { backgroundColor: palette.panel, borderColor: palette.panelBorder }]}>
      {/* 精簡列(永遠顯示):地名 / 日期時間 / 天氣圖示 / 展開收合 */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.place, { color: palette.text }]} numberOfLines={1}>
            {location.name}
          </Text>
          <Text style={[styles.time, { color: palette.subtext }]}>
            {formatLocalDate(location.utcOffsetSeconds, t('weekdays'))} ·{' '}
            {formatLocalTime(location.utcOffsetSeconds)} {t(PHASE_KEY[phase])}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale: pulse }], marginLeft: 8 }}>
          <WeatherGlyph
            code={weather ? weather.code : 61}
            isDay={weather ? weather.isDay : true}
            size={40}
            color={palette.text}
            accent={palette.accent}
          />
        </Animated.View>
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={10} style={styles.chevronBtn}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <ChevronDownIcon size={20} color={palette.subtext} />
          </Animated.View>
        </Pressable>
      </View>

      {/* 完整資訊(展開才顯示) */}
      {expanded && (
        findingRain ? (
          <Text style={[styles.levelName, { color: palette.accent, marginTop: 12 }]}>
            {t('findingRain')}
          </Text>
        ) : weather ? (
          <>
            <View style={styles.levelBlock}>
              <View style={styles.levelHeader}>
                <Text style={[styles.levelName, { color: palette.text }]}>
                  {levelText ? levelText.name[lang] : t('noRainHere')}
                </Text>
                <Pressable onPress={() => setShowScale(true)} hitSlop={8}>
                  <InfoIcon size={16} color={palette.subtext} />
                </Pressable>
              </View>
              <Text style={[styles.levelDesc, { color: palette.subtext }]} numberOfLines={levelText ? 3 : 2}>
                {levelText ? levelText.desc[lang] : t('noRainHint')}
              </Text>
            </View>

            {rainSearchNote === 'fallback' && (
              <Text style={[styles.note, { color: palette.accent }]}>{t('noRainAnywhere')}</Text>
            )}

            <View style={styles.dataRow}>
              <Datum label={t('temp')} value={`${Math.round(weather.temp)}°`} palette={palette} />
              <Datum label={t('precip')} value={`${weather.precip} mm`} palette={palette} />
              <Datum label={t('humidity')} value={`${Math.round(weather.humidity)}%`} palette={palette} />
              <Datum label={t('wind')} value={`${Math.round(weather.wind)} km/h`} palette={palette} />
            </View>
            {weatherError && staleMin > 0 && (
              <Text style={[styles.note, { color: palette.subtext }]}>{t('updatedAgo')(staleMin)}</Text>
            )}
          </>
        ) : (
          <Text style={[styles.levelDesc, { color: palette.subtext, marginTop: 10 }]}>
            {weatherError ? t('fetchFailed') : t('fetching')}
          </Text>
        )
      )}

      <LevelInfoModal
        visible={showScale}
        onClose={() => setShowScale(false)}
        palette={palette}
        lang={lang}
        currentLevel={level}
      />
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
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  place: { fontSize: 24, fontWeight: '700', letterSpacing: 0.5 },
  time: { fontSize: 13, marginTop: 3 },
  chevronBtn: { marginLeft: 6, padding: 2 },
  levelBlock: { marginTop: 14 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelName: { fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },
  levelDesc: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  note: { marginTop: 8, fontSize: 11, fontWeight: '600' },
  dataRow: { flexDirection: 'row', marginTop: 14 },
  datum: { flex: 1, alignItems: 'center' },
  datumValue: { fontSize: 16, fontWeight: '600' },
  datumLabel: { fontSize: 11, marginTop: 2 },
});
