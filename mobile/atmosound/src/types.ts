export type TrackId =
  | 'rain-mist'
  | 'rain-drips'
  | 'rain-light'
  | 'rain-medium'
  | 'rain-heavy'
  | 'rain-downpour'
  | 'wind'
  | 'storm-wind'
  | 'fire'
  | 'waves'
  | 'stream'
  | 'birds'
  | 'crickets'
  | 'keyboard';

export interface AppLocation {
  lat: number;
  lon: number;
  name: string;
  /** IANA timezone, e.g. "Asia/Taipei" — 當地時間一律即時計算,不存死字串 */
  timezone: string;
  /** Open-Meteo 回傳的 UTC 位移秒數,避免依賴裝置 Intl timezone 資料 */
  utcOffsetSeconds: number;
}

export interface Weather {
  /** WMO weather code — 天氣→聲音對照表的鍵 */
  code: number;
  isDay: boolean;
  temp: number;
  humidity: number;
  /** km/h */
  wind: number;
  /** mm/h */
  precip: number;
  fetchedAt: number;
}

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
  lat: number;
  lon: number;
  timezone: string;
}
