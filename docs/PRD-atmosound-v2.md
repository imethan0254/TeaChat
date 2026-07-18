# 專案需求文件 (PRD) v2:AtmoSound — 環境天氣白噪音生成 App

> Every Thought Has A Note
>
> **v2 修訂說明**:本版由 v1 優化而來,修正了 v1 的關鍵缺口 —— 聲音素材來源未定義、API 選型需金鑰註冊、行動平台背景播放限制未提及、缺 MVP 分期、資料結構隱患(localTime 存字串會過期、timer 存分鐘數會 drift)、「天氣→聲音」自動配對缺對照表。所有修訂處以 **[v2]** 標記。

---

## 1. 產品概述 (Product Overview)

**產品目標**:打造一款具備高度設計感、結合真實世界地理位置與即時天氣數據的白噪音/環境音生成應用程式。幫助用戶在工作、閱讀或休息時,透過沉浸式的環境音效提升專注力與放鬆感。

**核心價值**:不同於傳統單一的白噪音 App,本產品將「聲音」與「空間天氣」連結。用戶不僅是聽聲音,更是瞬間「置身」於世界各地的特定氣候場景中,且聲音會隨著當地真實天氣動態變化。

**[v2] 目標平台**:iOS + Android 原生 App(React Native + Expo)。開發期以 Expo Go 於實機測試;發布期走 EAS Build 產出安裝檔(iOS TestFlight / Android APK)。

**[v2] 成功指標(北極星)**:平均單次聆聽 session 長度 ≥ 25 分鐘;7 日留存 ≥ 30%。

---

## 2. MVP 分期 **[v2 新增]**

v1 將所有功能平鋪、無優先序,一次實作風險高。v2 拆為三期:

| 期別 | 範圍 | 驗收標準 |
|---|---|---|
| **V1(本次實作)** | 互動地圖 + 定位/搜尋 + 即時天氣面板 + 天氣驅動音景(自動配對 + crossfade)+ 混音器疊加音軌 + 專注計時器 + 日夜主題 | 手機實機可跑;選任意城市 3 秒內出天氣與對應音景;鎖屏後持續播放 |
| **V2** | 播放清單(多地點情境佇列,依序/隨機)+ 收藏地點 + 天氣動畫精緻化(Lottie) | 佇列自動輪播並平滑過渡 |
| **V3** | 上架(EAS Build + TestFlight / Play Store)+ 離線快取 + 通知/勿擾整合 | 商店可下載 |

---

## 3. 核心功能規格 (Core Features)

### 3.1 互動式世界地圖與地理定位

- **初始畫面**:App 啟動後,首頁為全螢幕的互動式世界地圖。
- **預設定位**:系統預設抓取使用者的當前位置(`expo-location`,僅前景權限即可),並將地圖中心點對準該區域。**若未授權定位,fallback 到預設唯美城市(台灣新竹 24.8138, 120.9675)**。
- **自由探索**:用戶可平移、縮放地圖、**點擊地圖任意位置**,或透過搜尋欄輸入任意國家、城市名稱移動定位點。
- **[v2] 反查地名**:點擊地圖任意經緯度時,以 Reverse Geocoding 顯示最近的城市名;查無結果時顯示座標。

### 3.2 即時天氣數據呈現

選定地點後,浮現半透明高質感數據面板:

| 資料欄位 | UI 呈現要求 | 說明 |
|---|---|---|
| 天氣圖示(動態) | CSS/RN 動畫(V1);Lottie(V2) | 雷雨的雨滴與微閃電、晴天耀光、起風雲層 |
| 日期與時間 | 當地時區時間 | **[v2] 以 IANA 時區字串即時計算**(見 §6 資料結構),每分鐘 tick 更新,不存死字串 |
| 氣象數據 | 乾淨排版 | 溫度、降水量 (mm/h)、濕度 (%)、風速 (km/h) |

### 3.3 氣候驅動之動態環境音

- **自動配對**:系統讀取該地點即時天氣,依 **[v2] 下方「天氣→聲音對照表」**自動生成對應聲音組合。
- **[v2] 連續參數驅動**:不只離散切換 —— 降水量 (mm/h) 連續映射雨聲強度/音量,風速 (km/h) 連續映射風聲強度,使「小雨 2mm」和「大雨 12mm」聽感明顯不同。
- **即時動態轉換**:**[v2 修正]** v1 要求「背景每 30 分鐘拉取天氣 API」,但行動 OS 不保證背景定時網路請求。改為:**App 前景時每 30 分鐘刷新 + 每次由背景返回前景時刷新**。天氣轉變時所有音軌以 **crossfade(≥ 3 秒)**無縫過渡。

#### **[v2 新增] 天氣→聲音對照表(SSOT)**

以 Open-Meteo WMO weather code 為鍵:

| WMO Code | 天氣 | 基底音軌組合(音量 0–1) |
|---|---|---|
| 0 | 晴 | 白日:鳥鳴 0.5 + 微風 0.3;夜晚:蟲鳴 0.6 + 微風 0.2 |
| 1–3 | 多雲 | 風 0.35 + (日)鳥鳴 0.3 /(夜)蟲鳴 0.4 |
| 45, 48 | 霧 | 低頻風 0.5(濾波更暗) |
| 51–57 | 毛毛雨 | 小雨 0.45 + 風 0.2 |
| 61–67, 80–82 | 雨 | 雨(強度隨 mm/h 內插 0.4→1.0)+ 風(隨風速) |
| 71–77, 85–86 | 雪 | 柔和低頻風 0.5(雪的「靜」) |
| 95–99 | 雷雨 | 大雨 0.9 + 風 0.5 + 雷聲(隨機間隔 8–25 秒轟隆) |
| 任何 code + 風速 > 20 km/h | 強風疊加 | 風聲強度 = clamp(wind/50, 0.3, 1.0) |

### 3.4 聲音疊加、混音與播放清單

1. **情境混音器 (Mixer)(V1)**:在當前天氣聲音的基礎上疊加額外音軌 —— **[v2] 明確音軌清單**:柴火、海浪、溪流、鍵盤敲擊、蟲鳴、鳥鳴 —— 各自獨立音量滑桿 + 總音量。
2. **播放清單 (Playlist)(V2)**:多個「地點情境」加入佇列,支援依序 (Sequential) / 隨機 (Shuffle) 播放。

#### **[v2 新增] 聲音素材來源與授權(v1 完全未定義,為最高風險缺口)**

- **方案**:全部音軌由**程式合成**(離線以 DSP 合成無縫循環音檔:濾波噪音成形雨/風/浪、隨機脈衝成形雨滴/火花/鍵擊、正弦簇成形鳥鳴/蟲鳴),打包為 app 內建 assets(`.m4a`,每軌 20–40 秒無縫 loop)。
- **理由**:(a) 零版權/授權風險,永久可商用;(b) 免下載、離線可用;(c) 音色參數可控,後續可依天氣強度再生成多檔強度分級。
- **無縫 loop 要求**:合成時以循環卷積/首尾 crossfade 消除接縫,播放器開 `isLooping`,聽感不得有「咔」聲或明顯循環感。

### 3.5 專注計時器 (Timer)

- 預設快捷:30 分鐘、1 小時、2 小時;支援自訂。
- 倒數結束後聲音**逐漸淡出(≥ 10 秒 fade out)**至停止。
- **[v2 修正]**:狀態儲存 `endsAt`(絕對時間戳),**不存 remainingMinutes** —— App 進背景/被暫停後回前景,以 `endsAt - now` 重算剩餘,避免計時 drift。

### 3.6 背景播放 **[v2 新增 — v1 未提,對本產品是核心場景]**

- 用戶鎖屏/切出 App 後**聲音必須持續播放**(睡前、專注場景的基本要求)。
- iOS:`app.json` 設 `UIBackgroundModes: ["audio"]`;`expo-audio` 的 `setAudioModeAsync({ shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' 或 'doNotMix' })`。
- Android:`FOREGROUND_SERVICE` 由 expo-audio 處理;音訊焦點遵從系統(來電暫停、結束後恢復)。
- 注意:**Expo Go 內背景播放行為與正式 build 略有差異**(Expo Go 可背景播放,但鎖屏控制面板需 dev build 以後驗證)。

---

## 4. 介面與使用者體驗設計 (UI/UX Guidelines)

- **視覺風格**:捨棄傳統冷硬的天氣 App 樣貌。Lo-Fi 放鬆感、溫暖色調(吉卜力/皮克斯感),讓地圖與天氣卡片像藝術品。
- **介面邏輯**:極簡。首頁完全讓位給地圖與天氣視覺;控制面板(計時器、混音器、搜尋)以**底部抽屜 (Bottom Sheet)** 滑動呼出,不干擾沉浸感。
- **色彩計畫**:隨選定地點「當地時間」(清晨/白晝/黃昏/黑夜)平滑過渡 UI 主題色與地圖配色。**[v2] 實作**:以當地時刻切 4 段主題(dawn 05–08、day 08–17、dusk 17–20、night 20–05),漸層背景 + 地圖 style 深淺切換,動畫過渡 ≥ 800ms。

---

## 5. 技術實作指南 (Technical Implementation)

### 5.1 技術棧 **[v2 修訂]**

| 項目 | v1 建議 | v2 決定 | 理由 |
|---|---|---|---|
| 框架 | React Native (Expo) 或 Flutter | **React Native + Expo(SDK 53+,TypeScript)** | 定案單一路線;Expo Go 實機即測 |
| 地圖 | react-native-maps (Mapbox) | **react-native-maps**(iOS: Apple Maps / Android: Google Maps),**不用 Mapbox** | Mapbox 需 token + 額度上限;react-native-maps 在 Expo Go 開箱即用、可自訂 mapStyle 做日夜配色 |
| 音訊 | expo-av 或 react-native-track-player | **expo-audio** | **expo-av 已於 SDK 52 起 deprecated**(v1 資訊過時);expo-audio 支援多 player 併發、音量、循環、背景播放 |
| 狀態管理 | Zustand 或 Redux Toolkit | **Zustand** | 輕量,契合單畫面沉浸式 app |
| 儲存 | (未提) | **AsyncStorage** | 記住上次地點、混音器設定 |

### 5.2 API 整合計畫 **[v2 全面修訂 — v1 需 3 家 API + 金鑰註冊]**

| 用途 | v1 建議 | v2 決定 | 理由 |
|---|---|---|---|
| 天氣 | OpenWeatherMap / WeatherAPI(需 API key) | **Open-Meteo Forecast API** — `api.open-meteo.com/v1/forecast?latitude=&longitude=&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day&timezone=auto` | **完全免費、免 API key、免註冊**;非商用額度寬鬆;一次回傳含時區 |
| 城市搜尋 (Geocoding) | 另接 Geocoding API | **Open-Meteo Geocoding API** — `geocoding-api.open-meteo.com/v1/search?name=&count=8&language=zh` | 同家、免 key、支援中文 |
| 反查地名 (Reverse) | 同上 | **BigDataCloud reverse-geocode-client**(免費免 key);失敗時顯示座標 | Open-Meteo 無反查;此端點免註冊 |
| 時區 | 另接 Timezone API | **不需要** — Open-Meteo `timezone=auto` 直接回傳 IANA 時區 | 3 個整合縮為 1.5 個 |

**[v2] 錯誤與離線行為**:API 失敗 → 保留上次成功天氣(標示「更新於 X 分鐘前」);完全無網路首開 → 預設城市 + 預設「多雲」音景,聲音功能不受網路影響(素材皆內建)。

### 5.3 核心資料結構 **[v2 修訂]**

```ts
interface AppState {
  location: {
    lat: number; lon: number; name: string;
    timezone: string;        // [v2] IANA 例 "Asia/Taipei" — 取代 v1 的 localTime 字串
  };                          //      當地時間一律由 timezone 即時計算,不存死值
  weather: {
    code: number;             // [v2] WMO weather code(對照表的鍵)— 取代自由字串 condition
    isDay: boolean;           // [v2] 驅動日夜音景(鳥鳴 vs 蟲鳴)與主題
    temp: number; humidity: number; wind: number; precip: number;
    fetchedAt: number;        // [v2] 支援「更新於 X 分鐘前」與 30 分鐘刷新判斷
  } | null;
  mixer: {
    master: number;                                   // [v2] 新增總音量
    tracks: Record<TrackId, { volume: number; enabled: boolean }>;
  };
  isPlaying: boolean;
  timer: { endsAt: number | null };                   // [v2] 絕對時間戳,取代 remainingMinutes
  // V2 期實作:
  playlist: { location: Location; durationMin: number }[];
  playlistMode: 'sequential' | 'shuffle';
}
```

### 5.4 音訊引擎架構 **[v2 新增]**

- 每個音軌一個 `expo-audio` player,載入內建無縫 loop 素材,`isLooping = true`。
- 「天氣自動層」與「用戶疊加層」分離:天氣變化只改天氣層各軌目標音量;用戶滑桿只改疊加層。
- **Crossfade**:所有音量變化經 60fps 音量 ramp(目標音量 + 時間常數),天氣切換 ramp ≥ 3s,計時器結束 ramp ≥ 10s。
- 雷聲軌特例:非循環,由排程器以隨機間隔(8–25s)觸發單次播放。

---

## 6. 驗收清單(V1)

- [ ] 首開:定位授權 → 地圖置中目前位置;拒絕 → 新竹
- [ ] 搜尋「Reykjavik」→ 地圖飛到冰島、面板顯示當地時間與天氣、音景 3 秒內切換(crossfade)
- [ ] 點地圖任意點 → 反查地名 + 更新天氣音景
- [ ] 降水 8mm/h 的城市雨聲明顯大於 1mm/h 的城市
- [ ] 疊加「柴火」並調音量 → 與天氣音景共存
- [ ] 設 30 分計時 → 到時 10 秒淡出停止;期間切背景再回來剩餘時間正確
- [ ] 鎖屏後聲音持續播放
- [ ] 選夜晚時區城市 → UI 轉夜色、蟲鳴取代鳥鳴
