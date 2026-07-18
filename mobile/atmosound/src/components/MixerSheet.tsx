import Slider from '@react-native-community/slider';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { MIXER_TRACKS } from '../audio/tracks';
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
  const { mixer, master, setTrack, setMaster } = useApp();

  return (
    <BottomSheet visible={visible} onClose={onClose} palette={palette}>
      <Text style={[styles.title, { color: palette.text }]}>情境混音器</Text>
      <Text style={[styles.subtitle, { color: palette.subtext }]}>
        天氣音景自動播放中,可疊加你喜歡的聲音
      </Text>

      <View style={styles.masterRow}>
        <Text style={[styles.masterLabel, { color: palette.text }]}>總音量</Text>
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
        {MIXER_TRACKS.map(({ id, label, emoji }) => {
          const t = mixer[id];
          return (
            <View key={id} style={styles.trackRow}>
              <Pressable
                style={styles.trackHead}
                onPress={() => setTrack(id, { enabled: !t.enabled })}
              >
                <Text style={styles.trackEmoji}>{emoji}</Text>
                <Text style={[styles.trackLabel, { color: palette.text }]}>{label}</Text>
              </Pressable>
              <Slider
                style={styles.trackSlider}
                minimumValue={0}
                maximumValue={1}
                value={t.volume}
                disabled={!t.enabled}
                onSlidingComplete={(v) => setTrack(id, { volume: v })}
                minimumTrackTintColor={t.enabled ? palette.accent : 'rgba(128,128,128,0.3)'}
                maximumTrackTintColor="rgba(128,128,128,0.3)"
                thumbTintColor={t.enabled ? palette.accent : '#999'}
              />
              <Switch
                value={t.enabled}
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
