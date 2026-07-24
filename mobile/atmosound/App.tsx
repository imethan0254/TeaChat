import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import type MapView from 'react-native-maps';
import { engine } from './src/audio/engine';
import {
  EyeIcon,
  GearIcon,
  GlobeIcon,
  LocateIcon,
  PauseIcon,
  PlayIcon,
  RainCloudIcon,
  RainSearchIcon,
  SearchIcon,
} from './src/components/Icons';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { MixerSheet } from './src/components/MixerSheet';
import { RainScene, type RainBurst } from './src/components/RainScene';
// 地圖模組很重,改為「用到才載入」— 雨景(預設)不依賴 react-native-maps,避免啟動崩潰
const MapScreen = React.lazy(() =>
  import('./src/components/MapScreen').then((m) => ({ default: m.MapScreen })),
);
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
  const { width: screenW } = useWindowDimensions();
  const {
    lang,
    view,
    location,
    weather,
    level,
    isPlaying,
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
  const [bursts, setBursts] = useState<RainBurst[]>([]);
  const [rainMarkers, setRainMarkers] = useState<{ city: City; level: number }[]>([]);
  const mapRef = useRef<MapView>(null);
  const rippleId = useRef(0);
  const timerEndsAt = useApp((s) => s.timerEndsAt);

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

  // 進入地圖:載入全球雨點標記(快取 10 分鐘)
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

  // 點擊雨景(需求 1):在點擊處灑下一陣雨(落地濺水)+ 水波紋 + 觸水聲。
  // 隱藏資訊改由右下角眼睛鍵負責(不再點一下就隱藏,以免與灑雨衝突)。
  const onScenePress = useCallback(
    (x: number, y: number) => {
      const id = rippleId.current++;
      setRipples((rs) => [...rs.slice(-6), { id, x, y }]);
      setTimeout(() => setRipples((rs) => rs.filter((r) => r.id !== id)), 950);
      const bx = screenW > 0 ? x / screenW : 0.5;
      setBursts((bs) => [...bs.slice(-4), { id, x: bx }]);
      setTimeout(() => setBursts((bs) => bs.filter((b) => b.id !== id)), 1300);
      void engine.playDrop();
    },
    [screenW],
  );

  const onMapPress = async (lat: number, lon: number) => {
    const geo = await reverseGeocode(lat, lon, lang);
    await setLocation({ ...useApp.getState().location, lat, lon, name: geo.name });
  };

  // 定位(整入地圖畫面):重新抓 GPS → 找離自己最近的雨
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

      {/* 背景:雨景動畫 ⇄ 世界地圖(地圖 lazy-load) */}
      {view === 'map' ? (
        <>
          <Suspense fallback={<View style={[StyleSheet.absoluteFill, { backgroundColor: '#12182f' }]} />}>
            <MapScreen
              ref={mapRef}
              initialLat={location.lat}
              initialLon={location.lon}
              dark={phase === 'night' || phase === 'dusk'}
              rainMarkers={rainMarkers}
              onMapPress={(lat, lon) => void onMapPress(lat, lon)}
              onMarkerPress={(city) => {
                void setLocation({
                  lat: city.lat,
                  lon: city.lon,
                  name: lang === 'zh-Hant' ? city.zh : city.en,
                  timezone: useApp.getState().location.timezone,
                  utcOffsetSeconds: useApp.getState().location.utcOffsetSeconds,
                });
              }}
            />
          </Suspense>
          <LinearGradient
            colors={palette.gradient}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* 地圖內建工具(按鈕整併):搜尋 + 回到我的位置 */}
          <View style={[styles.mapTools, { bottom: insets.bottom + 20 }]}>
            <Pressable style={styles.mapToolBtn} onPress={() => setSheet('search')}>
              <SearchIcon size={20} color={iconColor} />
            </Pressable>
            <Pressable style={styles.mapToolBtn} onPress={() => void onLocate()} disabled={findingRain}>
              {findingRain ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LocateIcon size={20} color={iconColor} />
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={(e) => onScenePress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        >
          <RainScene visual={visual} phase={phase} bursts={bursts} />
        </Pressable>
      )}

      <RippleLayer ripples={ripples} />

      {uiHidden ? (
        /* Zen 模式:右下角保留顯示鍵 */
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

          {/* 右側唯一按鈕列(由上而下):地圖切換 / 找雨 / 設定 / 播放主鍵 */}
          <View style={[styles.fabCol, { bottom: insets.bottom + 24 }]}>
            <Fab onPress={() => setView(view === 'rain' ? 'map' : 'rain')}>
              {view === 'rain' ? (
                <GlobeIcon size={21} color={iconColor} />
              ) : (
                <RainCloudIcon size={21} color={iconColor} />
              )}
            </Fab>
            <Fab onPress={() => void runRainFinder('random')} busy={findingRain}>
              <RainSearchIcon size={21} color={iconColor} />
            </Fab>
            <Fab onPress={() => setSheet('settings')}>
              <GearIcon size={21} color={iconColor} />
            </Fab>
            {/* 播放/暫停 = 主按鈕:更大、accent 底色、外圈光暈 */}
            <View style={[styles.playHalo, { borderColor: `${palette.accent}55` }]}>
              <Pressable
                style={[styles.playBtn, { backgroundColor: palette.accent }]}
                onPress={togglePlay}
              >
                {isPlaying ? (
                  <PauseIcon size={26} color="#fff" />
                ) : (
                  <PlayIcon size={26} color="#fff" />
                )}
              </Pressable>
            </View>
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
      <SettingsSheet
        visible={sheet === 'settings'}
        onClose={() => setSheet(null)}
        palette={palette}
        onOpenMixer={() => setSheet('mixer')}
        onOpenTimer={() => setSheet('timer')}
      />
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

export default function App() {
  const [globalErr, setGlobalErr] = useState<string>('');

  // 全域錯誤捕捉(含 render 以外的 async / 原生 JS 錯誤)→ 直接印到畫面,便於診斷黑屏
  useEffect(() => {
    const g = (global as unknown as { ErrorUtils?: any }).ErrorUtils;
    if (!g?.setGlobalHandler) return;
    const prev = g.getGlobalHandler?.();
    g.setGlobalHandler((e: any, isFatal: boolean) => {
      setGlobalErr(`[全域${isFatal ? ' FATAL' : ''}] ${e?.message ?? e}\n\n${e?.stack ?? ''}`);
      prev?.(e, isFatal);
    });
  }, []);

  // 根層一律鋪深藍底:只要 React 有 commit,畫面至少是深藍不會純黑 —— 用來判斷渲染是否發生
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f24' }}>
      {globalErr ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 70 }}>
          <Text style={{ color: '#ffb26b', fontSize: 15, fontWeight: '800', marginBottom: 10 }}>
            Rainland 執行錯誤(請截圖給我)
          </Text>
          <Text style={{ color: '#ff8080', fontSize: 12, lineHeight: 17 }}>{globalErr}</Text>
        </ScrollView>
      ) : (
        <ErrorBoundary>
          <SafeAreaProvider>
            <Main />
          </SafeAreaProvider>
        </ErrorBoundary>
      )}
    </View>
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
  fabCol: { position: 'absolute', right: 14, alignItems: 'center', gap: 12 },
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
  playHalo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
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
  mapTools: { position: 'absolute', left: 16, gap: 10 },
  mapToolBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: FAB_BG,
    borderWidth: 1,
    borderColor: FAB_BORDER,
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
