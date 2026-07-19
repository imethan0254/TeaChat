import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { MixerSheet } from './src/components/MixerSheet';
import { RainScene } from './src/components/RainScene';
import { SearchSheet } from './src/components/SearchSheet';
import { SettingsSheet } from './src/components/SettingsSheet';
import { TimerSheet } from './src/components/TimerSheet';
import { WeatherPanel } from './src/components/WeatherPanel';
import { makeT } from './src/i18n/strings';
import { reverseGeocode } from './src/lib/api';
import { rainVisual } from './src/lib/rainLevels';
import { dayPhase, PALETTES } from './src/lib/theme';
import { REFRESH_MS, useApp } from './src/state/store';

type SheetName = 'search' | 'mixer' | 'timer' | 'settings' | null;

function Main() {
  const insets = useSafeAreaInsets();
  const {
    lang,
    view,
    location,
    weather,
    level,
    isPlaying,
    timerEndsAt,
    timerFading,
    findingRain,
    setView,
    setUserPos,
    setLocation,
    refreshWeather,
    runRainFinder,
    togglePlay,
    onTimerExpired,
    hydrate,
  } = useApp();
  const t = makeT(lang);
  const [sheet, setSheet] = useState<SheetName>(null);
  const mapRef = useRef<MapView>(null);

  const phase = dayPhase(location.utcOffsetSeconds);
  const palette = PALETTES[phase];
  const visual = useMemo(
    () => rainVisual(level, weather ?? { code: 0, isDay: true, temp: 20, humidity: 60, wind: 5, precip: 0, fetchedAt: 0 }),
    [level, weather],
  );

  // 啟動(需求 1):還原設定 → 定位(拒絕則預設城市)→ 找雨(先國內,無則鄰近國家)→ 自動播放
  useEffect(() => {
    (async () => {
      await hydrate();
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude, useApp.getState().lang);
          setUserPos({ lat: latitude, lon: longitude, countryCode: geo.countryCode });
        }
      } catch {
        // 定位失敗:userPos 維持 null,找雨以預設城市為基準
      }
      await runRainFinder();
      if (!useApp.getState().isPlaying && useApp.getState().weather) {
        useApp.getState().togglePlay();
      }
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
    const timer = setInterval(() => {
      if (Date.now() >= (useApp.getState().timerEndsAt ?? Infinity)) onTimerExpired();
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerEndsAt]);

  // 地點變更 → 地圖飛過去
  useEffect(() => {
    if (view !== 'map') return;
    mapRef.current?.animateToRegion(
      { latitude: location.lat, longitude: location.lon, latitudeDelta: 1.2, longitudeDelta: 1.2 },
      1200,
    );
  }, [location.lat, location.lon, view]);

  const onMapPress = async (lat: number, lon: number) => {
    const geo = await reverseGeocode(lat, lon, lang);
    await setLocation({ ...useApp.getState().location, lat, lon, name: geo.name });
  };

  return (
    <View style={styles.root}>
      <StatusBar style={view === 'rain' ? 'light' : palette.statusBarStyle} />

      {/* 背景:預設雨景動畫,floating button 切世界地圖(需求 3) */}
      {view === 'map' ? (
        <>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lon,
              latitudeDelta: 1.2,
              longitudeDelta: 1.2,
            }}
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              void onMapPress(latitude, longitude);
            }}
            userInterfaceStyle={phase === 'night' || phase === 'dusk' ? 'dark' : 'light'}
            showsPointsOfInterest={false}
            toolbarEnabled={false}
          />
          <LinearGradient
            colors={palette.gradient}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      ) : (
        <RainScene visual={visual} phase={phase} />
      )}

      {/* 品牌字 */}
      <View style={[styles.brand, { top: insets.top + 6 }]} pointerEvents="none">
        <Text style={styles.brandText}>{t('appName')}</Text>
      </View>

      {/* 天氣面板 */}
      <View style={[styles.panelWrap, { top: insets.top + 40 }]} pointerEvents="box-none">
        <WeatherPanel palette={palette} phase={phase} />
      </View>

      {/* 右側 floating buttons:切換視圖 / 找雨 / 設定 */}
      <View style={[styles.fabCol, { bottom: insets.bottom + 108 }]}>
        <Fab
          emoji={view === 'rain' ? '🗺️' : '🌧️'}
          label={view === 'rain' ? t('toMap') : t('toRain')}
          onPress={() => setView(view === 'rain' ? 'map' : 'rain')}
        />
        <Fab
          emoji={findingRain ? undefined : '📡'}
          label={t('findRain')}
          onPress={() => void runRainFinder()}
          busy={findingRain}
        />
        <Fab emoji="⚙️" label={t('settings')} onPress={() => setSheet('settings')} />
      </View>

      {/* 底部控制列 */}
      <View
        style={[
          styles.bar,
          { bottom: insets.bottom + 16, backgroundColor: palette.bar, borderColor: palette.panelBorder },
        ]}
      >
        <BarButton emoji="🔍" label={t('explore')} onPress={() => setSheet('search')} palette={palette} />
        <BarButton emoji="🎚️" label={t('mixer')} onPress={() => setSheet('mixer')} palette={palette} />
        <Pressable style={[styles.playBtn, { backgroundColor: palette.accent }]} onPress={togglePlay}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </Pressable>
        <BarButton
          emoji="⏱️"
          label={timerEndsAt || timerFading ? t('timerActive') : t('timer')}
          onPress={() => setSheet('timer')}
          palette={palette}
          highlight={!!timerEndsAt || timerFading}
        />
        <BarButton
          emoji="📍"
          label={t('toMap')}
          onPress={() => {
            setView('map');
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
      <SettingsSheet visible={sheet === 'settings'} onClose={() => setSheet(null)} palette={palette} />
    </View>
  );
}

function Fab({
  emoji,
  label,
  onPress,
  busy,
}: {
  emoji?: string;
  label: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable style={styles.fab} onPress={onPress} disabled={busy}>
      {busy ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.fabEmoji}>{emoji}</Text>
      )}
      <Text style={styles.fabLabel}>{label}</Text>
    </Pressable>
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
  root: { flex: 1, backgroundColor: '#0a0f24' },
  brand: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  brandText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 8,
  },
  panelWrap: { position: 'absolute', left: 16, right: 16 },
  fabCol: { position: 'absolute', right: 14, alignItems: 'center', gap: 12 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(20,28,58,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabEmoji: { fontSize: 20 },
  fabLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 8.5, fontWeight: '700', marginTop: 1 },
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
