import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { City } from '../lib/cities';
import { DropIcon } from './Icons';

interface Props {
  initialLat: number;
  initialLon: number;
  dark: boolean;
  rainMarkers: { city: City; level: number }[];
  onMapPress: (lat: number, lon: number) => void;
  onMarkerPress: (city: City) => void;
}

/**
 * 世界地圖畫面 —— 獨立成一個 lazy-load 元件(需求:啟動穩定性)。
 * react-native-maps 是很重的原生模組;抽出來後,只有切到地圖時才載入,
 * 雨景(預設畫面)完全不依賴它,避免啟動階段因地圖模組崩潰而黑屏。
 */
export const MapScreen = forwardRef<MapView, Props>(function MapScreen(
  { initialLat, initialLon, dark, rainMarkers, onMapPress, onMarkerPress },
  ref,
) {
  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: initialLat,
        longitude: initialLon,
        latitudeDelta: 30,
        longitudeDelta: 30,
      }}
      onPress={(e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        onMapPress(latitude, longitude);
      }}
      userInterfaceStyle={dark ? 'dark' : 'light'}
      showsPointsOfInterest={false}
      toolbarEnabled={false}
    >
      {rainMarkers.map((m) => (
        <Marker
          key={m.city.en}
          coordinate={{ latitude: m.city.lat, longitude: m.city.lon }}
          onPress={() => onMarkerPress(m.city)}
          tracksViewChanges={false}
        >
          <View style={[styles.marker, m.level >= 5 && styles.markerHeavy]}>
            <DropIcon size={15} color="#fff" fill="#5a8fd9" strokeWidth={1.5} />
            <Text style={styles.markerText}>{m.level}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
});

const styles = StyleSheet.create({
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
});
