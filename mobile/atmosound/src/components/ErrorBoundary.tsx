import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface State {
  error: Error | null;
  info: string;
}

/**
 * 頂層錯誤攔截器:正式版(Release)沒有紅色錯誤框,啟動崩潰只會黑屏。
 * 此元件把 render 期間的例外直接顯示在畫面上,方便截圖回報 → 精準定位崩潰模組。
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ info: info.componentStack ?? '' });
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.root}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Rainland 啟動錯誤(請截圖給我)</Text>
            <Text style={styles.msg}>{String(this.state.error?.message ?? this.state.error)}</Text>
            <Text style={styles.stack}>{this.state.error?.stack ?? ''}</Text>
            <Text style={styles.stack}>{this.state.info}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#12182f' },
  content: { padding: 20, paddingTop: 70 },
  title: { color: '#ffb26b', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  msg: { color: '#ff6b6b', fontSize: 14, fontWeight: '600', marginBottom: 14 },
  stack: { color: '#9fb0d8', fontSize: 11, lineHeight: 16, marginBottom: 10 },
});
