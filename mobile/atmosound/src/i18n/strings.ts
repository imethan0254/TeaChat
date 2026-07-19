export type Lang = 'en' | 'zh-Hant';

/** 雙語字串表 — 預設英文,設定區可切繁中(需求 2) */
const STRINGS = {
  appName: { en: 'Rainland', 'zh-Hant': '雨之國 Rainland' },
  tagline: { en: 'Every rain has a note', 'zh-Hant': '每一場雨,都有自己的聲音' },

  // Controls
  play: { en: 'Play', 'zh-Hant': '播放' },
  pause: { en: 'Pause', 'zh-Hant': '暫停' },
  explore: { en: 'Search', 'zh-Hant': '探索' },
  mixer: { en: 'Mixer', 'zh-Hant': '混音' },
  timer: { en: 'Timer', 'zh-Hant': '計時' },
  timerActive: { en: 'Timing', 'zh-Hant': '計時中' },
  settings: { en: 'Settings', 'zh-Hant': '設定' },
  findRain: { en: 'Find rain', 'zh-Hant': '找雨' },
  findingRain: { en: 'Searching for rain…', 'zh-Hant': '正在尋找下雨的地方…' },
  toMap: { en: 'Map', 'zh-Hant': '地圖' },
  toRain: { en: 'Rain', 'zh-Hant': '雨景' },

  // Weather panel
  temp: { en: 'Temp', 'zh-Hant': '溫度' },
  precip: { en: 'Rain', 'zh-Hant': '降水' },
  humidity: { en: 'Humidity', 'zh-Hant': '濕度' },
  wind: { en: 'Wind', 'zh-Hant': '風速' },
  fetching: { en: 'Fetching weather…', 'zh-Hant': '取得天氣中…' },
  fetchFailed: { en: 'Weather unavailable, retrying', 'zh-Hant': '無法取得天氣,將自動重試' },
  updatedAgo: { en: (m: number) => `updated ${m} min ago`, 'zh-Hant': (m: number) => `更新於 ${m} 分鐘前` },
  noRainHere: { en: 'No rain here right now', 'zh-Hant': '此地目前無雨' },
  noRainHint: {
    en: 'Tap "Find rain" to travel to the nearest rainfall',
    'zh-Hant': '點「找雨」前往最近的降雨處',
  },
  rainFoundIn: { en: (name: string) => `Raining in ${name}`, 'zh-Hant': (name: string) => `${name} 正在下雨` },
  noRainAnywhere: {
    en: 'No rain nearby — showing the wettest spot found',
    'zh-Hant': '附近都沒下雨 — 已前往查詢範圍內雨量最大處',
  },

  // Search
  searchTitle: { en: 'Explore the world', 'zh-Hant': '探索世界' },
  searchPlaceholder: { en: 'City name, e.g. Tokyo, Reykjavik…', 'zh-Hant': '輸入城市名,如:東京、Reykjavik…' },
  searchFailed: { en: 'Search failed — check your connection', 'zh-Hant': '搜尋失敗,請檢查網路後重試' },

  // Mixer
  mixerTitle: { en: 'Ambience Mixer', 'zh-Hant': '情境混音器' },
  mixerSubtitle: {
    en: 'Rain plays automatically — layer extra sounds on top',
    'zh-Hant': '雨聲自動播放中,可疊加你喜歡的聲音',
  },
  masterVolume: { en: 'Master', 'zh-Hant': '總音量' },
  trackFire: { en: 'Campfire', 'zh-Hant': '柴火' },
  trackWaves: { en: 'Ocean waves', 'zh-Hant': '海浪' },
  trackStream: { en: 'Stream', 'zh-Hant': '溪流' },
  trackKeyboard: { en: 'Typing', 'zh-Hant': '鍵盤敲擊' },
  trackBirds: { en: 'Birdsong', 'zh-Hant': '鳥鳴' },
  trackCrickets: { en: 'Crickets', 'zh-Hant': '蟲鳴' },

  // Timer
  timerTitle: { en: 'Focus Timer', 'zh-Hant': '專注計時器' },
  timerSubtitle: {
    en: 'Sound fades out over 10s when time is up',
    'zh-Hant': '倒數結束後聲音將以 10 秒逐漸淡出停止',
  },
  min30: { en: '30 min', 'zh-Hant': '30 分鐘' },
  hour1: { en: '1 hour', 'zh-Hant': '1 小時' },
  hour2: { en: '2 hours', 'zh-Hant': '2 小時' },
  customMinutes: { en: 'Custom minutes', 'zh-Hant': '自訂分鐘數' },
  start: { en: 'Start', 'zh-Hant': '開始' },
  cancelTimer: { en: 'Cancel timer', 'zh-Hant': '取消計時' },
  fadingOut: { en: 'Fading out…', 'zh-Hant': '淡出中…' },

  // Settings
  settingsTitle: { en: 'Settings', 'zh-Hant': '設定' },
  language: { en: 'Language', 'zh-Hant': '語言' },
  langEn: { en: 'English', 'zh-Hant': 'English' },
  langZh: { en: '繁體中文', 'zh-Hant': '繁體中文' },
  about: {
    en: 'Rainland tunes into real-time rainfall around the world. Pick a rainy place, and its rain becomes your ambience.',
    'zh-Hant': 'Rainland 連接世界各地的即時降雨。選一個正在下雨的地方,那裡的雨,就是你的白噪音。',
  },

  // Day phases
  phaseDawn: { en: 'Dawn', 'zh-Hant': '清晨' },
  phaseDay: { en: 'Day', 'zh-Hant': '白晝' },
  phaseDusk: { en: 'Dusk', 'zh-Hant': '黃昏' },
  phaseNight: { en: 'Night', 'zh-Hant': '夜晚' },

  weekdays: {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'zh-Hant': ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
  },
} as const;

type StringKey = keyof typeof STRINGS;

export function makeT(lang: Lang) {
  // en 與 zh-Hant 每個 key 的值形狀相同(string / fn / array),以 en 作為代表型別
  return <K extends StringKey>(key: K): (typeof STRINGS)[K]['en'] =>
    STRINGS[key][lang] as (typeof STRINGS)[K]['en'];
}

/** 7 級雨勢文案(需求 4:名稱 + 情境描述,雙語) */
export interface RainLevelText {
  name: { en: string; 'zh-Hant': string };
  desc: { en: string; 'zh-Hant': string };
}

export const RAIN_LEVEL_TEXT: Record<number, RainLevelText> = {
  1: {
    name: { en: 'Misty Drizzle', 'zh-Hant': '絲絲細雨' },
    desc: {
      en: 'Droplets as fine as down, drifting weightlessly. The air turns damp and hazy — like walking through a veil of mist, no umbrella needed.',
      'zh-Hant': '水滴如毫毛般細小,在空中輕柔飄浮。空氣潮濕迷濛,落在臉上宛如薄霧,走在其中甚至不需撐傘。',
    },
  },
  2: {
    name: { en: 'Pattering Rain', 'zh-Hant': '淅瀝小雨' },
    desc: {
      en: 'Single drops become audible — soft, scattered ticks on leaves and eaves. The asphalt slowly darkens patch by patch.',
      'zh-Hant': '開始能辨識獨立的雨滴,落在樹葉、屋簷上發出輕微錯落的「滴答」聲,路面逐漸染成深色斑駁。',
    },
  },
  3: {
    name: { en: 'Steady Rain', 'zh-Hant': '綿綿陣雨' },
    desc: {
      en: 'Rain settles into a continuous rhythm. Visible threads slant down; umbrellas hum with a steady rustle, shallow pools gather in low ground.',
      'zh-Hant': '雨勢穩定連綿,雨絲密集成肉眼可見的斜線。傘面響起規律的「沙沙」聲,低窪處積起淺淺水灘。',
    },
  },
  4: {
    name: { en: 'Heavy Showers', 'zh-Hant': '滂沱中雨' },
    desc: {
      en: 'Full, weighty drops drum loudly on umbrellas and rooftops. Splashes leap from the ground; the distance blurs behind rising vapor.',
      'zh-Hant': '雨滴飽滿厚實,打在傘面、鐵皮屋頂上發出響亮密集的「啪嗒」聲,雨滴砸落濺起水花,遠景被水氣籠罩。',
    },
  },
  5: {
    name: { en: 'Pouring Rain', 'zh-Hant': '傾盆大雨' },
    desc: {
      en: 'As if poured straight from a basin — dense, gapless water. Bubbles burst across puddles, gutters run fast, and the roar drowns conversation.',
      'zh-Hant': '宛如有人將水盆直接翻倒,雨水密得沒有空隙。積水面砸出無數水泡,排水溝湍急,雨聲震耳欲聾。',
    },
  },
  6: {
    name: { en: 'Raging Downpour', 'zh-Hant': '狂暴豪雨' },
    desc: {
      en: 'A thick white curtain of rain swallows the view. Gusts drive the rain sideways; umbrellas flip, streets begin to flood.',
      'zh-Hant': '雨水連成厚重白茫雨幕,能見度極低。強陣風把雨吹成水平掃來,撐傘也會被吹翻,道路迅速積水。',
    },
  },
  7: {
    name: { en: 'Torrential Deluge', 'zh-Hant': '致災性暴雨' },
    desc: {
      en: 'The sky tears open. A ferocious roar of water erases every other sound — the world reduced to the thunder of the flood.',
      'zh-Hant': '天空宛如破了大洞,狂暴雨聲蓋過一切,彷彿整個世界只剩下水流的轟鳴,屬於需要警戒的極端氣候。',
    },
  },
};
