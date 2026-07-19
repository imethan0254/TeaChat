import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { makeT, RAIN_LEVEL_TEXT } from '../i18n/strings';
import { weatherEmoji } from '../lib/rainLevels';
import { formatLocalDate, formatLocalTime, PHASE_KEY, type Palette } from '../lib/theme';
import { useApp } from '../state/store';
import type { DayPhase } from '../types';
import { InfoIcon } from './Icons';
import { LevelInfoModal } from './LevelInfoModal';

interface Props {
  palette: Palette;
  phase: DayPhase;
}

/**
 * 天氣面板:地名、當地時間、7 級雨勢名稱 + 情境描述(需求 4 文案)、四項氣象數據。
 * 無雨時顯示引導(點「找雨」)。
 */
export function WeatherPanel({ palette, phase }: Props) {
  const { lang, location, weather, weatherError, level, rainSearchNote, findingRain } = useApp();
  const t = makeT(lang);
  const [, forceTick] = useState(0);
  const [showScale, setShowScale] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 20_000);
    return () => clearInterval(timer);
  }, []);

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
  const levelText = level > 0 ? RAIN_LEVEL_TEXT[level] : null;

  return (
    <View style={[styles.panel, { backgroundColor: palette.panel, borderColor: palette.panelBorder }]}>
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
        <Animated.Text style={[styles.emoji, { transform: [{ scale: pulse }] }]}>
          {weather ? weatherEmoji(weather.code, weather.isDay) : '🌧️'}
        </Animated.Text>
      </View>

      {findingRain ? (
        <Text style={[styles.levelName, { color: palette.accent, marginTop: 12 }]}>
          {t('findingRain')}
        </Text>
      ) : weather ? (
        <>
          {levelText ? (
            <View style={styles.levelBlock}>
              <View style={styles.levelHeader}>
                <Text style={[styles.levelName, { color: palette.text }]}>
                  {levelText.name[lang]}
                </Text>
                <Pressable onPress={() => setShowScale(true)} hitSlop={8}>
                  <InfoIcon size={16} color={palette.subtext} strokeWidth={1.8} />
                </Pressable>
              </View>
              <Text style={[styles.levelDesc, { color: palette.subtext }]} numberOfLines={3}>
                {levelText.desc[lang]}
              </Text>
            </View>
          ) : (
            <View style={styles.levelBlock}>
              <View style={styles.levelHeader}>
                <Text style={[styles.levelName, { color: palette.text }]}>{t('noRainHere')}</Text>
                <Pressable onPress={() => setShowScale(true)} hitSlop={8}>
                  <InfoIcon size={16} color={palette.subtext} strokeWidth={1.8} />
                </Pressable>
              </View>
              <Text style={[styles.levelDesc, { color: palette.subtext }]}>{t('noRainHint')}</Text>
            </View>
          )}

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
  emoji: { fontSize: 42, marginLeft: 8 },
  levelBlock: { marginTop: 12 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelName: { fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },
  levelDesc: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  note: { marginTop: 8, fontSize: 11, fontWeight: '600' },
  dataRow: { flexDirection: 'row', marginTop: 14 },
  datum: { flex: 1, alignItems: 'center' },
  datumValue: { fontSize: 16, fontWeight: '600' },
  datumLabel: { fontSize: 11, marginTop: 2 },
});
