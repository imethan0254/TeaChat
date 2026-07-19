import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { makeT } from '../i18n/strings';
import type { Palette } from '../lib/theme';
import { useApp } from '../state/store';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  palette: Palette;
}

const PRESETS = [
  { labelKey: 'min30', min: 30 },
  { labelKey: 'hour1', min: 60 },
  { labelKey: 'hour2', min: 120 },
] as const;

/** 專注計時器(PRD v2 §3.5):endsAt 絕對時間戳,到點 10 秒淡出 */
export function TimerSheet({ visible, onClose, palette }: Props) {
  const { lang, timerEndsAt, timerFading, setTimer } = useApp();
  const t = makeT(lang);
  const [custom, setCustom] = useState('');
  const [, tick] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [visible]);

  const remaining = timerEndsAt ? Math.max(0, timerEndsAt - Date.now()) : null;
  const fmt = (ms: number) => {
    const s = Math.round(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
      : `${m}:${String(ss).padStart(2, '0')}`;
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} palette={palette}>
      <Text style={[styles.title, { color: palette.text }]}>{t('timerTitle')}</Text>
      <Text style={[styles.subtitle, { color: palette.subtext }]}>{t('timerSubtitle')}</Text>

      {remaining !== null && (
        <View style={styles.activeBox}>
          <Text style={[styles.countdown, { color: palette.accent }]}>{fmt(remaining)}</Text>
          <Pressable onPress={() => setTimer(null)}>
            <Text style={[styles.cancel, { color: palette.subtext }]}>{t('cancelTimer')}</Text>
          </Pressable>
        </View>
      )}
      {timerFading && (
        <Text style={[styles.subtitle, { color: palette.accent }]}>{t('fadingOut')}</Text>
      )}

      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <Pressable
            key={p.min}
            style={[styles.preset, { borderColor: palette.accent }]}
            onPress={() => {
              setTimer(p.min);
              onClose();
            }}
          >
            <Text style={[styles.presetText, { color: palette.accent }]}>{t(p.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.customRow}>
        <TextInput
          style={[styles.input, { color: palette.text, borderColor: palette.panelBorder }]}
          placeholder={t('customMinutes')}
          placeholderTextColor={palette.subtext}
          keyboardType="number-pad"
          value={custom}
          onChangeText={setCustom}
        />
        <Pressable
          style={[styles.customBtn, { backgroundColor: palette.accent }]}
          onPress={() => {
            const m = parseInt(custom, 10);
            if (m > 0) {
              setTimer(m);
              setCustom('');
              onClose();
            }
          }}
        >
          <Text style={styles.customBtnText}>{t('start')}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 4 },
  activeBox: { alignItems: 'center', marginTop: 16 },
  countdown: { fontSize: 42, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cancel: { marginTop: 6, fontSize: 13, textDecorationLine: 'underline' },
  presetRow: { flexDirection: 'row', marginTop: 18, gap: 10 },
  preset: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  presetText: { fontSize: 14, fontWeight: '700' },
  customRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  customBtn: {
    borderRadius: 14,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  customBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
