import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { engine } from './src/audio/engine';
import {
  ClockIcon,
  DiceIcon,
  DropIcon,
  EyeIcon,
  EyeOffIcon,
  GearIcon,
  GlobeIcon,
  LocateIcon,
  PauseIcon,
  PlayIcon,
  RainCloudIcon,
  SearchIcon,
  SlidersIcon,
} from './src/components/Icons';
import { MixerSheet } from './src/components/MixerSheet';
import { RainScene } from './src/components/RainScene';
import { RippleLayer, type Ripple } from './src/components/RippleLayer';
import { SearchSheet } from './src/components/SearchSheet';
import { SettingsSheet } from './src/components/SettingsSheet';
import { TimerSheet } from './src/components/TimerSheet';
import { WeatherPanel } from './src/components/WeatherPanel';
import { makeT } from './src/i18n/strings';
import { reverseGeocode } from './src/lib/api';
import { CITIES, type City } from './src/lib/cities';
import { probeCities } from './src/lib/rainFinder';
import { rainLevel, rainVisual } from './src/lib/rainLevels';
import { dayPhase, PALETTES } from './src/lib/theme';
import { REFRESH_MS, useApp } from './src/state/store';

type SheetName = 'search' | 'mixer' | 'timer' | 'settings' | null;

/** 地圖上的雨點標記快取(10 分鐘) */
let rainMarkersCache: { at: number; spots: { city: City; level: number }[] } | null = null;

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
    uiHidden,
    setView,
    setUiHidden,
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
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [rainMarkers, setRainMarkers] = useState<{ city: City; level: number }[]>([]);
  const mapRef = useRef<MapView>(null);
  const rippleId = useRef(0);

  const phase = dayPhase(location.utcOffsetSeconds);
  const palette = PALETTES[phase];
  const visual = useMemo(
    () =>
      rainVisual(
        level,
        weather ?? { code: 0, isDay: true, temp: 20, humidity: 60, wind: 5, precip: 0, fetchedAt: 0 },
      ),
    [level, weather],
  );

  // 啟動:還原設定 → 定位(拒絕則預設城市)→ 找離自己最近的雨 → 自動播放
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
        // 定位失敗:找雨以預設城市為基準
      }
      await runRainFinder('nearest');
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

  // 進入地圖:載入全球雨點標記(需求 4;快取 10 分鐘)
  useEffect(() => {
    if (view !== 'map') return;
    if (rainMarkersCache && Date.now() - rainMarkersCache.at < 10 * 60 * 1000) {
      setRainMarkers(rainMarkersCache.spots);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const probed = await probeCities(CITIES);
        const spots = probed
          .map((p) => ({ city: p.city, level: rainLevel(p.weather) }))
          .filter((p) => p.level > 0);
        rainMarkersCache = { at: Date.now(), spots };
        if (alive) setRainMarkers(spots);
      } catch {
        // 標記載入失敗不影響地圖本體
      }
    })();
    return () => {
      alive = false;
    };
  }, [view]);

  // 地點變更 → 地圖飛過去
  useEffect(() => {
    if (view !== 'map') return;
    mapRef.current?.animateToRegion(
      { latitude: location.lat, longitude: location.lon, latitudeDelta: 1.2, longitudeDelta: 1.2 },
      1200,
    );
  }, [location.lat, location.lon, view]);

  // 點擊雨景(需求 3、5、8):水波紋 + 水滴聲;UI 顯示中則同時進入 Zen 模式
  const onScenePress = useCallback(
    (x: number, y: number) => {
      const id = rippleId.current++;
      setRipples((rs) => [...rs.slice(-6), { id, x, y }]);
      setTimeout(() => setRipples((rs) => rs.filter((r) => r.id !== id)), 950);
      void engine.playDrop();
      if (!uiHidden) setUiHidden(true);
    },
    [uiHidden, setUiHidden],
  );

  const onMapPress = async (lat: number, lon: number) => {
    const geo = await reverseGeocode(lat, lon, lang);
    await setLocation({ ...useApp.getState().location, lat, lon, name: geo.name });
  };

  // 定位鍵(需求 7):重新抓 GPS → 找離自己最近的雨
  const onLocate = async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude, lang);
        setUserPos({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          countryCode: geo.countryCode,
        });
      }
    } catch {
      // 沿用上次位置
    }
    await runRainFinder('nearest');
  };

  const iconColor = 'rgba(255,255,255,0.92)';

  return (
    <View style={styles.root}>
      <StatusBar style={view === 'rain' ? 'light' : palette.statusBarStyle} hidden={uiHidden} />

      {/* 背景:雨景動畫 ⇄ 世界地圖 */}
      {view === 'map' ? (
        <>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lon,
              latitudeDelta: 30,
              longitudeDelta: 30,
            }}
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              void onMapPress(latitude, longitude);
            }}
            userInterfaceStyle={phase === 'night' || phase === 'dusk' ? 'dark' : 'light'}
            showsPointsOfInterest={false}
            toolbarEnabled={false}
          >
            {/* 需求 4:正在下雨的城市標記,點擊直接切換 */}
            {rainMarkers.map((m) => (
              <Marker
                key={`${m.city.en}`}
                coordinate={{ latitude: m.city.lat, longitude: m.city.lon }}
                onPress={() => {
                  void setLocation({
                    lat: m.city.lat,
                    lon: m.city.lon,
                    name: lang === 'zh-Hant' ? m.city.zh : m.city.en,
                    timezone: useApp.getState().location.timezone,
                    utcOffsetSeconds: useApp.getState().location.utcOffsetSeconds,
                  });
                }}
                tracksViewChanges={false}
              >
                <View style={[styles.marker, m.level >= 5 && styles.markerHeavy]}>
                  <DropIcon size={15} color="#fff" fill="#5a8fd9" strokeWidth={1.5} />
                  <Text style={styles.markerText}>{m.level}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
          <LinearGradient
            colors={palette.gradient}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      ) : (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={(e) => onScenePress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        >
          <RainScene visual={visual} phase={phase} />
        </Pressable>
      )}

      <RippleLayer ripples={ripples} />

      {/* Zen 模式(需求 5):只留右下角眼睛鍵 */}
      {uiHidden ? (
        <Pressable
          style={[styles.eyeBtn, { bottom: insets.bottom + 18, right: 18 }]}
          onPress={() => setUiHidden(false)}
        >
          <EyeIcon size={21} color={iconColor} />
        </Pressable>
      ) : (
        <>
          {/* 品牌字 */}
          <View style={[styles.brand, { top: insets.top + 6 }]} pointerEvents="none">
            <Text style={styles.brandText}>{t('appName')}</Text>
          </View>

          {/* 天氣面板 */}
          <View style={[styles.panelWrap, { top: insets.top + 36 }]} pointerEvents="box-none">
            <WeatherPanel palette={palette} phase={phase} />
          </View>

          {/* 右側 icon-only FAB(需求 2):切換視圖 / 隨機找雨 / 定位最近 / 設定 */}
          <View style={[styles.fabCol, { bottom: insets.bottom + 148 }]}>
            <Fab onPress={() => setView(view === 'rain' ? 'map' : 'rain')}>
              {view === 'rain' ? (
                <GlobeIcon size={21} color={iconColor} />
              ) : (
                <RainCloudIcon size={21} color={iconColor} />
              )}
            </Fab>
            <Fab onPress={() => void runRainFinder('random')} busy={findingRain}>
              <DiceIcon size={21} color={iconColor} />
            </Fab>
            <Fab onPress={() => void onLocate()} busy={findingRain}>
              <LocateIcon size={21} color={iconColor} />
            </Fab>
            <Fab onPress={() => setSheet('settings')}>
              <GearIcon size={21} color={iconColor} />
            </Fab>
          </View>

          {/* 右下角:進入 Zen 模式 */}
          <Pressable
            style={[styles.eyeBtn, { bottom: insets.bottom + 88, right: 18 }]}
            onPress={() => setUiHidden(true)}
          >
            <EyeOffIcon size={21} color={iconColor} />
          </Pressable>

          {/* 底部控制列(精簡:搜尋/混音/播放/計時) */}
          <View
            style={[
              styles.bar,
              {
                bottom: insets.bottom + 16,
                backgroundColor: palette.bar,
                borderColor: palette.panelBorder,
              },
            ]}
          >
            <BarButton onPress={() => setSheet('search')}>
              <SearchIcon size={22} color={palette.subtext} />
            </BarButton>
            <BarButton onPress={() => setSheet('mixer')}>
              <SlidersIcon size={22} color={palette.subtext} />
            </BarButton>
            <Pressable
              style={[styles.playBtn, { backgroundColor: palette.accent }]}
              onPress={togglePlay}
            >
              {isPlaying ? (
                <PauseIcon size={24} color="#fff" />
              ) : (
                <PlayIcon size={24} color="#fff" />
              )}
            </Pressable>
            <BarButton onPress={() => setSheet('timer')}>
              <ClockIcon
                size={22}
                color={timerEndsAt || timerFading ? palette.accent : palette.subtext}
              />
            </BarButton>
          </View>
        </>
      )}

      {findingRain && uiHidden && (
        <View style={[styles.findingPill, { top: insets.top + 12 }]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}

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
  children,
  onPress,
  busy,
}: {
  children: React.ReactNode;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable style={styles.fab} onPress={onPress} disabled={busy}>
      {busy ? <ActivityIndicator color="#fff" size="small" /> : children}
    </Pressable>
  );
}

function BarButton({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable style={styles.barBtn} onPress={onPress}>
      {children}
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

const FAB_BG = 'rgba(16,24,48,0.55)';
const FAB_BORDER = 'rgba(255,255,255,0.18)';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f24' },
  brand: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  brandText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 8,
  },
  panelWrap: { position: 'absolute', left: 16, right: 16 },
  fabCol: { position: 'absolute', right: 14, alignItems: 'center', gap: 10 },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: FAB_BG,
    borderWidth: 1,
    borderColor: FAB_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: FAB_BG,
    borderWidth: 1,
    borderColor: FAB_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    left: 16,
    right: 80,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  barBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,32,64,0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 1,
  },
  markerHeavy: { backgroundColor: 'rgba(46,68,120,0.95)' },
  markerText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  findingPill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: FAB_BG,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
