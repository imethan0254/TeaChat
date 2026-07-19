import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

/**
 * 扁平圓潤 icon 系統(需求 1、2):
 * 統一 stroke 風格、圓端點(strokeLinecap round)、無寫實漸層,
 * 每個 icon 造型清楚可辨識,不依賴文字。
 */

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const D = { size: 22, color: '#fff', strokeWidth: 2 };

const base = (p: IconProps) => ({
  width: p.size ?? D.size,
  height: p.size ?? D.size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
});

const stroke = (p: IconProps) => ({
  stroke: p.color ?? D.color,
  strokeWidth: p.strokeWidth ?? D.strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/** 地球(切到世界地圖) */
export const GlobeIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Circle cx={12} cy={12} r={9} {...stroke(p)} />
    <Path d="M3 12h18" {...stroke(p)} />
    <Path d="M12 3c2.6 2.5 3.9 5.5 3.9 9S14.6 18.5 12 21c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3z" {...stroke(p)} />
  </Svg>
);

/** 雨雲(切回雨景) */
export const RainCloudIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M7 14a4.5 4.5 0 1 1 .6-8.96A5.5 5.5 0 0 1 18.3 7.2 3.75 3.75 0 0 1 17 14H7z" {...stroke(p)} />
    <Line x1={8.5} y1={17} x2={8} y2={19.5} {...stroke(p)} />
    <Line x1={12.5} y1={17} x2={12} y2={19.5} {...stroke(p)} />
    <Line x1={16.5} y1={17} x2={16} y2={19.5} {...stroke(p)} />
  </Svg>
);

/** 找雨(需求 4):放大鏡搜尋意象,鏡片內含雨滴 */
export const RainSearchIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Circle cx={10.5} cy={10.5} r={7} {...stroke(p)} />
      <Line x1={15.8} y1={15.8} x2={21} y2={21} {...stroke(p)} />
      <Path
        d="M10.5 6.8c1.5 1.9 2.8 3.4 2.8 5a2.8 2.8 0 1 1-5.6 0c0-1.6 1.3-3.1 2.8-5z"
        fill={c}
        stroke={c}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
};

/** 定位十字準星(回到自己位置找最近的雨) */
export const LocateIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Circle cx={12} cy={12} r={6.5} {...stroke(p)} />
      <Circle cx={12} cy={12} r={1.6} fill={c} />
      <Line x1={12} y1={2.5} x2={12} y2={5.5} {...stroke(p)} />
      <Line x1={12} y1={18.5} x2={12} y2={21.5} {...stroke(p)} />
      <Line x1={2.5} y1={12} x2={5.5} y2={12} {...stroke(p)} />
      <Line x1={18.5} y1={12} x2={21.5} y2={12} {...stroke(p)} />
    </Svg>
  );
};

/** 齒輪(設定)— 常見實心齒輪造型(需求 4) */
export const GearIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Path
        fill={c}
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"
      />
    </Svg>
  );
};

/** 放大鏡(搜尋) */
export const SearchIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Circle cx={10.5} cy={10.5} r={6.5} {...stroke(p)} />
    <Line x1={15.5} y1={15.5} x2={20.5} y2={20.5} {...stroke(p)} />
  </Svg>
);

/** 混音滑桿 */
export const SlidersIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Line x1={6} y1={4} x2={6} y2={20} {...stroke(p)} />
      <Line x1={12} y1={4} x2={12} y2={20} {...stroke(p)} />
      <Line x1={18} y1={4} x2={18} y2={20} {...stroke(p)} />
      <Circle cx={6} cy={9} r={2} fill={c} />
      <Circle cx={12} cy={15} r={2} fill={c} />
      <Circle cx={18} cy={7} r={2} fill={c} />
    </Svg>
  );
};

/** 時鐘(計時器) */
export const ClockIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Circle cx={12} cy={12} r={9} {...stroke(p)} />
    <Path d="M12 7v5l3.2 2" {...stroke(p)} />
  </Svg>
);

/** 播放 */
export const PlayIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Path d="M8.2 5.5c0-1 1.1-1.6 2-1.1l9 5.9c.8.5.8 1.9 0 2.4l-9 5.9c-.9.5-2-.1-2-1.1V5.5z" fill={c} stroke={c} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
};

/** 暫停 */
export const PauseIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Rect x={6} y={4.5} width={4} height={15} rx={2} fill={c} />
      <Rect x={14} y={4.5} width={4} height={15} rx={2} fill={c} />
    </Svg>
  );
};

/** 眼睛(顯示完整資訊) */
export const EyeIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" {...stroke(p)} />
      <Circle cx={12} cy={12} r={2.6} fill={c} />
    </Svg>
  );
};

/** 眼睛關(隱藏資訊,只看雨) */
export const EyeOffIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Path d="M4.5 8.5C3.2 9.9 2.5 12 2.5 12s3.5 6.2 9.5 6.2c1.3 0 2.5-.3 3.6-.8M9.5 6.2c.8-.25 1.6-.4 2.5-.4 6 0 9.5 6.2 9.5 6.2s-.9 1.6-2.5 3.2" {...stroke(p)} />
    <Line x1={4} y1={4} x2={20} y2={20} {...stroke(p)} />
  </Svg>
);

/** i 資訊鍵(雨勢分級說明浮窗) */
export const InfoIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Circle cx={12} cy={12} r={9} {...stroke(p)} />
      <Circle cx={12} cy={7.8} r={1.3} fill={c} />
      <Line x1={12} y1={11} x2={12} y2={16.5} {...stroke(p)} />
    </Svg>
  );
};

/** 關閉(浮窗 X) */
export const CloseIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Line x1={6} y1={6} x2={18} y2={18} {...stroke(p)} />
    <Line x1={18} y1={6} x2={6} y2={18} {...stroke(p)} />
  </Svg>
);

/** 水滴(地圖上的下雨標記) */
export const DropIcon = (p: IconProps & { fill?: string }) => (
  <Svg {...base(p)}>
    <Path
      d="M12 3.2c3.2 4 6 7.3 6 10.6a6 6 0 1 1-12 0c0-3.3 2.8-6.6 6-10.6z"
      fill={p.fill ?? 'none'}
      {...stroke(p)}
    />
  </Svg>
);
