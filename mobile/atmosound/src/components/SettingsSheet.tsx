import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { makeT, type Lang } from '../i18n/strings';
import type { Palette } from '../lib/theme';
import { useApp } from '../state/store';
import { BottomSheet } from './BottomSheet';
import { ClockIcon, SlidersIcon } from './Icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  palette: Palette;
  /** 混音器 / 計時器整併入設定(按鈕整併需求) */
  onOpenMixer: () => void;
  onOpenTimer: () => void;
}

/** 設定面板:混音器/計時器入口 + 語言切換(即生效並持久化) */
export function SettingsSheet({ visible, onClose, palette, onOpenMixer, onOpenTimer }: Props) {
  const { lang, timerEndsAt, timerFading, setLang } = useApp();
  const t = makeT(lang);

  const LangOption = ({ value, label }: { value: Lang; label: string }) => {
    const active = lang === value;
    return (
      <Pressable
        style={[
          styles.option,
          { borderColor: active ? palette.accent : palette.panelBorder },
          active && { backgroundColor: `${palette.accent}22` },
        ]}
        onPress={() => setLang(value)}
      >
        <Text style={[styles.optionText, { color: active ? palette.accent : palette.text }]}>
          {label}
        </Text>
        {active && <Text style={[styles.check, { color: palette.accent }]}>✓</Text>}
      </Pressable>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} palette={palette}>
      <Text style={[styles.title, { color: palette.text }]}>{t('settingsTitle')}</Text>

      {/* 混音器 / 計時器入口 */}
      <Pressable
        style={[styles.entry, { borderColor: palette.panelBorder }]}
        onPress={onOpenMixer}
      >
        <SlidersIcon size={19} color={palette.accent} />
        <Text style={[styles.entryText, { color: palette.text }]}>{t('mixerTitle')}</Text>
        <Text style={[styles.chevron, { color: palette.subtext }]}>›</Text>
      </Pressable>
      <Pressable
        style={[styles.entry, { borderColor: palette.panelBorder }]}
        onPress={onOpenTimer}
      >
        <ClockIcon size={19} color={palette.accent} />
        <Text style={[styles.entryText, { color: palette.text }]}>
          {t('timerTitle')}
          {(timerEndsAt || timerFading) ? ` · ${t('timerActive')}` : ''}
        </Text>
        <Text style={[styles.chevron, { color: palette.subtext }]}>›</Text>
      </Pressable>

      <Text style={[styles.sectionLabel, { color: palette.subtext, marginTop: 14 }]}>{t('language')}</Text>
      <LangOption value="en" label="English" />
      <LangOption value="zh-Hant" label="繁體中文" />

      <Text style={[styles.about, { color: palette.subtext }]}>{t('about')}</Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  entryText: { fontSize: 15, fontWeight: '600', flex: 1 },
  chevron: { fontSize: 20, fontWeight: '600' },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 10,
  },
  optionText: { fontSize: 15, fontWeight: '600' },
  check: { fontSize: 16, fontWeight: '700' },
  about: { fontSize: 12, lineHeight: 18, marginTop: 14 },
});
