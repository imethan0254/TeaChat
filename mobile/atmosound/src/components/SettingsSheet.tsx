import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { makeT, type Lang } from '../i18n/strings';
import type { Palette } from '../lib/theme';
import { useApp } from '../state/store';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  palette: Palette;
}

/** 設定面板(需求 2):語言切換 English / 繁體中文,選擇即生效並持久化 */
export function SettingsSheet({ visible, onClose, palette }: Props) {
  const { lang, setLang } = useApp();
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

      <Text style={[styles.sectionLabel, { color: palette.subtext }]}>{t('language')}</Text>
      <LangOption value="en" label="English" />
      <LangOption value="zh-Hant" label="繁體中文" />

      <Text style={[styles.about, { color: palette.subtext }]}>{t('about')}</Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
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
