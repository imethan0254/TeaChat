import Slider from '@react-native-community/slider';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MIXER_TRACKS } from '../audio/tracks';
import { makeT } from '../i18n/strings';
import type { Palette } from '../lib/theme';
import { useApp } from '../state/store';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  palette: Palette;
}

/** 情境混音器(PRD v2 §3.4):在天氣音景之上疊加音軌,各自獨立音量 + 總音量 */
export function MixerSheet({ visible, onClose, palette }: Props) {
  const { lang, mixer, master, setTrack, setMaster } = useApp();
  const t = makeT(lang);

  return (
    <BottomSheet visible={visible} onClose={onClose} palette={palette}>
      <Text style={[styles.title, { color: palette.text }]}>{t('mixerTitle')}</Text>
      <Text style={[styles.subtitle, { color: palette.subtext }]}>{t('mixerSubtitle')}</Text>

      <View style={styles.masterRow}>
        <Text style={[styles.masterLabel, { color: palette.text }]}>{t('masterVolume')}</Text>
        <Slider
          style={{ flex: 1, marginLeft: 12 }}
          minimumValue={0}
          maximumValue={1}
          value={master}
          onSlidingComplete={setMaster}
          minimumTrackTintColor={palette.accent}
          maximumTrackTintColor="rgba(128,128,128,0.3)"
          thumbTintColor={palette.accent}
        />
      </View>

      <ScrollView style={{ marginTop: 6 }}>
        {MIXER_TRACKS.map(({ id, labelKey, emoji }) => {
          const tr = mixer[id];
          return (
            <View key={id} style={styles.trackRow}>
              <Pressable
                style={styles.trackHead}
                onPress={() => setTrack(id, { enabled: !tr.enabled })}
              >
                <Text style={styles.trackEmoji}>{emoji}</Text>
                <Text style={[styles.trackLabel, { color: palette.text }]}>{t(labelKey)}</Text>
              </Pressable>
              <Slider
                style={styles.trackSlider}
                minimumValue={0}
                maximumValue={1}
                value={tr.volume}
                disabled={!tr.enabled}
                onSlidingComplete={(v) => setTrack(id, { volume: v })}
                minimumTrackTintColor={tr.enabled ? palette.accent : 'rgba(128,128,128,0.3)'}
                maximumTrackTintColor="rgba(128,128,128,0.3)"
                thumbTintColor={tr.enabled ? palette.accent : '#999'}
              />
              <Switch
                value={tr.enabled}
                onValueChange={(v) => setTrack(id, { enabled: v })}
                trackColor={{ true: palette.accent, false: 'rgba(128,128,128,0.3)' }}
              />
            </View>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 4, marginBottom: 10 },
  masterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  masterLabel: { fontSize: 14, fontWeight: '600' },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  trackHead: { flexDirection: 'row', alignItems: 'center', width: 110 },
  trackEmoji: { fontSize: 20, marginRight: 8 },
  trackLabel: { fontSize: 14, fontWeight: '600' },
  trackSlider: { flex: 1, marginHorizontal: 8 },
});
