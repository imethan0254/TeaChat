import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { makeT } from '../i18n/strings';
import { searchCities } from '../lib/api';
import type { Palette } from '../lib/theme';
import { useApp } from '../state/store';
import type { GeoResult } from '../types';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (r: GeoResult) => void;
  palette: Palette;
}

/** 地點搜尋(Open-Meteo Geocoding,支援中文,免金鑰) */
export function SearchSheet({ visible, onClose, onPick, palette }: Props) {
  const { lang } = useApp();
  const t = makeT(lang);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const doSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(false);
    try {
      setResults(await searchCities(q, lang));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} palette={palette}>
      <Text style={[styles.title, { color: palette.text }]}>{t('searchTitle')}</Text>
      <TextInput
        style={[styles.input, { color: palette.text, borderColor: palette.panelBorder }]}
        placeholder={t('searchPlaceholder')}
        placeholderTextColor={palette.subtext}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={doSearch}
        returnKeyType="search"
        autoFocus
      />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} color={palette.accent} />}
      {error && (
        <Text style={[styles.hint, { color: palette.subtext }]}>{t('searchFailed')}</Text>
      )}
      <FlatList
        data={results}
        keyExtractor={(r) => `${r.lat},${r.lon}`}
        keyboardShouldPersistTaps="handled"
        style={{ marginTop: 8 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => {
              onPick(item);
              setQuery('');
              setResults([]);
              onClose();
            }}
          >
            <Text style={[styles.rowName, { color: palette.text }]}>{item.name}</Text>
            <Text style={[styles.rowSub, { color: palette.subtext }]}>
              {[item.admin1, item.country].filter(Boolean).join(' · ')}
            </Text>
          </Pressable>
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  hint: { marginTop: 14, textAlign: 'center', fontSize: 13 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.2)' },
  rowName: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
});
