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

/** 骰子(隨機找雨) */
export const DiceIcon = (p: IconProps) => {
  const c = p.color ?? D.color;
  return (
    <Svg {...base(p)}>
      <Rect x={4} y={4} width={16} height={16} rx={4.5} {...stroke(p)} />
      <Circle cx={9} cy={9} r={1.4} fill={c} />
      <Circle cx={15} cy={15} r={1.4} fill={c} />
      <Circle cx={15} cy={9} r={1.4} fill={c} />
      <Circle cx={9} cy={15} r={1.4} fill={c} />
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

/** 齒輪(設定) */
export const GearIcon = (p: IconProps) => (
  <Svg {...base(p)}>
    <Circle cx={12} cy={12} r={3.2} {...stroke(p)} />
    <Line x1={12} y1={2.8} x2={12} y2={5.6} {...stroke(p)} />
    <Line x1={12} y1={18.4} x2={12} y2={21.2} {...stroke(p)} />
    <Line x1={2.8} y1={12} x2={5.6} y2={12} {...stroke(p)} />
    <Line x1={18.4} y1={12} x2={21.2} y2={12} {...stroke(p)} />
    <Line x1={5.5} y1={5.5} x2={7.5} y2={7.5} {...stroke(p)} />
    <Line x1={16.5} y1={16.5} x2={18.5} y2={18.5} {...stroke(p)} />
    <Line x1={18.5} y1={5.5} x2={16.5} y2={7.5} {...stroke(p)} />
    <Line x1={7.5} y1={16.5} x2={5.5} y2={18.5} {...stroke(p)} />
  </Svg>
);

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
