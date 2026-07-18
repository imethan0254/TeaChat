# AtmoSound 🌦️🎧

> Every Thought Has A Note — 環境天氣白噪音生成 App(React Native + Expo)

結合真實世界地理位置與即時天氣數據的環境音 App:選世界任一城市,即刻「置身」當地氣候場景 —— 介面隨當地時間變換日夜色調,環境音隨當地真實天氣(降雨量、風速、雷雨)動態生成。

規格見 [`docs/PRD-atmosound-v2.md`](../../docs/PRD-atmosound-v2.md)(repo 根目錄 docs/)。

## 功能(V1)

- 🗺️ 全螢幕互動世界地圖:平移/縮放/點擊任意位置、城市搜尋(支援中文)、GPS 定位
- 🌤️ 即時天氣面板:當地時間(IANA 時區即時計算)、溫度/降水/濕度/風速、動態天氣圖示
- 🎵 天氣驅動音景:WMO 天氣代碼 → 音軌組合;降水量/風速**連續**映射音量;天氣轉變 3 秒 crossfade;雷雨隨機雷聲
- 🎚️ 情境混音器:疊加柴火/海浪/溪流/鍵盤/鳥鳴/蟲鳴,獨立音量 + 總音量
- ⏱️ 專注計時器:30 分/1 小時/2 小時/自訂,結束 10 秒淡出(存絕對時間戳,不 drift)
- 🌗 日夜主題:清晨/白晝/黃昏/黑夜四段配色,隨「選定地點」當地時間切換
- 🔒 鎖屏背景播放(iOS `UIBackgroundModes: audio`)

## 技術重點

- **API 全免金鑰**:Open-Meteo(天氣+時區+城市搜尋)、BigDataCloud(反查地名)—— clone 下來直接跑,不用註冊任何服務
- **音源零授權**:10 軌無縫循環音檔全部由 `scripts` 內 DSP 程式合成(scipy 濾波噪音成形),非採樣
- expo-audio(多軌併發 + 音量 ramp 引擎)、react-native-maps、zustand、AsyncStorage

## 在手機上跑起來

```bash
cd mobile/atmosound
npm install
npx expo start
```

1. 手機裝 **Expo Go**(App Store / Play Store 搜尋)
2. 電腦與手機連同一個 Wi-Fi
3. iPhone 用相機掃 terminal 的 QR code;Android 在 Expo Go 內掃
4. 不同網段時改用 `npx expo start --tunnel`

> 鎖屏播放與鎖屏控制在正式 build(`eas build`)行為最完整;Expo Go 內已可背景播放。

## 發布(V3)

```bash
npm i -g eas-cli && eas login
eas build --platform android --profile preview   # 產出可直接安裝的 APK
eas build --platform ios                          # 需 Apple Developer 帳號 → TestFlight
```
