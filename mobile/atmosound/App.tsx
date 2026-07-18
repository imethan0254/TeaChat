import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { MixerSheet } from './src/components/MixerSheet';
import { SearchSheet } from './src/components/SearchSheet';
import { TimerSheet } from './src/components/TimerSheet';
import { WeatherPanel } from './src/components/WeatherPanel';
import { reverseGeocode } from './src/lib/api';
import { dayPhase, PALETTES } from './src/lib/theme';
import { REFRESH_MS, useApp } from './src/state/store';

type SheetName = 'search' | 'mixer' | 'timer' | null;

function Main() {
  const insets = useSafeAreaInsets();
  const {
    location,
    isPlaying,
    timerEndsAt,
    timerFading,
    setLocation,
    refreshWeather,
    togglePlay,
    onTimerExpired,
    hydrate,
  } = useApp();
  const [sheet, setSheet] = useState<SheetName>(null);
  const mapRef = useRef<MapView>(null);

  const phase = dayPhase(location.utcOffsetSeconds);
  const palette = PALETTES[phase];

  // 啟動:還原設定 → 抓目前定位(拒絕則留在預設城市)→ 取天氣
  useEffect(() => {
    (async () => {
      await hydrate();
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
          const { latitude, longitude } = pos.coords;
          const name = await reverseGeocode(latitude, longitude);
          await setLocation({
            ...useApp.getState().location,
            lat: latitude,
            lon: longitude,
            name,
          });
          return;
        }
      } catch {
        // 定位失敗 → fallback 預設城市
      }
      await refreshWeather();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 前景每 30 分鐘刷新 + 回前景時刷新(stale >5 分鐘才打 API)
  useEffect(() => {
    const interval = setInterval(() => void refreshWeather(), REFRESH_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refreshWeather({ ifStale: true });
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 計時器 tick(endsAt 絕對時間戳 → 背景返回也不 drift)
  useEffect(() => {
    if (!timerEndsAt) return;
    const t = setInterval(() => {
      if (Date.now() >= (useApp.getState().timerEndsAt ?? Infinity)) onTimerExpired();
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerEndsAt]);

  // 地點變更 → 地圖飛過去
  useEffect(() => {
    mapRef.current?.animateToRegion(
      { latitude: location.lat, longitude: location.lon, latitudeDelta: 1.2, longitudeDelta: 1.2 },
      1200,
    );
  }, [location.lat, location.lon]);

  const region = useMemo(
    () => ({
      latitude: location.lat,
      longitude: location.lon,
      latitudeDelta: 1.2,
      longitudeDelta: 1.2,
    }),
    // 只用初始值;之後由 animateToRegion 控制
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onMapPress = async (lat: number, lon: number) => {
    const name = await reverseGeocode(lat, lon);
    await setLocation({ ...useApp.getState().location, lat, lon, name });
  };

  return (
    <View style={styles.root}>
      <StatusBar style={palette.statusBarStyle} />
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          void onMapPress(latitude, longitude);
        }}
        userInterfaceStyle={phase === 'night' || phase === 'dusk' ? 'dark' : 'light'}
        showsPointsOfInterest={false}
        toolbarEnabled={false}
      />

      {/* 日夜氛圍漸層(不擋觸控) */}
      <LinearGradient
        colors={palette.gradient}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 天氣面板 */}
      <View style={[styles.panelWrap, { top: insets.top + 12 }]} pointerEvents="box-none">
        <WeatherPanel palette={palette} phase={phase} />
      </View>

      {/* 底部控制列 */}
      <View style={[styles.bar, { bottom: insets.bottom + 16, backgroundColor: palette.bar, borderColor: palette.panelBorder }]}>
        <BarButton emoji="🔍" label="探索" onPress={() => setSheet('search')} palette={palette} />
        <BarButton emoji="🎚️" label="混音" onPress={() => setSheet('mixer')} palette={palette} />
        <Pressable
          style={[styles.playBtn, { backgroundColor: palette.accent }]}
          onPress={togglePlay}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </Pressable>
        <BarButton
          emoji="⏱️"
          label={timerEndsAt || timerFading ? '計時中' : '計時'}
          onPress={() => setSheet('timer')}
          palette={palette}
          highlight={!!timerEndsAt || timerFading}
        />
        <BarButton
          emoji="📍"
          label="回定位"
          onPress={() => {
            mapRef.current?.animateToRegion(
              { latitude: location.lat, longitude: location.lon, latitudeDelta: 1.2, longitudeDelta: 1.2 },
              800,
            );
          }}
          palette={palette}
        />
      </View>

      <SearchSheet
        visible={sheet === 'search'}
        onClose={() => setSheet(null)}
        palette={palette}
        onPick={(r) => {
          void setLocation({
            lat: r.lat,
            lon: r.lon,
            name: r.name,
            timezone: r.timezone,
            utcOffsetSeconds: useApp.getState().location.utcOffsetSeconds,
          });
        }}
      />
      <MixerSheet visible={sheet === 'mixer'} onClose={() => setSheet(null)} palette={palette} />
      <TimerSheet visible={sheet === 'timer'} onClose={() => setSheet(null)} palette={palette} />
    </View>
  );
}

function BarButton({
  emoji,
  label,
  onPress,
  palette,
  highlight,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  palette: (typeof PALETTES)['day'];
  highlight?: boolean;
}) {
  return (
    <Pressable style={styles.barBtn} onPress={onPress}>
      <Text style={styles.barEmoji}>{emoji}</Text>
      <Text style={[styles.barLabel, { color: highlight ? palette.accent : palette.subtext }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panelWrap: { position: 'absolute', left: 16, right: 16 },
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  barBtn: { alignItems: 'center', width: 52 },
  barEmoji: { fontSize: 20 },
  barLabel: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  playBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 22 },
});
