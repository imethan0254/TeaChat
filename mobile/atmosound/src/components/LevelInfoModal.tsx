import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { makeT, RAIN_LEVEL_TEXT, type Lang } from '../i18n/strings';
import type { Palette } from '../lib/theme';
import { CloseIcon } from './Icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  palette: Palette;
  lang: Lang;
  /** 目前所在級數(高亮) */
  currentLevel: number;
}

/** 雨勢分級說明浮窗(需求 5):列出 1–7 級名稱與情境描述,可關閉 */
export function LevelInfoModal({ visible, onClose, palette, lang, currentLevel }: Props) {
  const t = makeT(lang);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: palette.panel, borderColor: palette.panelBorder }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>{t('rainScaleTitle')}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <CloseIcon size={18} color={palette.subtext} />
            </Pressable>
          </View>
          <Text style={[styles.intro, { color: palette.subtext }]}>{t('rainScaleIntro')}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {[1, 2, 3, 4, 5, 6, 7].map((lv) => {
              const item = RAIN_LEVEL_TEXT[lv];
              const active = lv === currentLevel;
              return (
                <View
                  key={lv}
                  style={[
                    styles.row,
                    { borderColor: active ? palette.accent : 'transparent' },
                    active && { backgroundColor: `${palette.accent}18` },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: palette.accent, opacity: 0.25 + lv * 0.1 }]}>
                    <Text style={styles.dotText}>{lv}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: active ? palette.accent : palette.text }]}>
                      {item.name[lang]}
                    </Text>
                    <Text style={[styles.desc, { color: palette.subtext }]}>{item.desc[lang]}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '78%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', flex: 1 },
  closeBtn: { padding: 4 },
  intro: { fontSize: 12, lineHeight: 17, marginTop: 6, marginBottom: 10 },
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.2,
    marginBottom: 4,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dotText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700' },
  desc: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
});
