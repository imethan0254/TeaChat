import React from 'react';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

/**
 * 有設計感的天氣圖示組(WMO code → glyph)。
 * 圓潤線條 + 重點色(太陽/閃電用 accent),雙色平衡,取代 emoji。
 * viewBox 48×48。
 */

interface Props {
  code: number;
  isDay: boolean;
  size?: number;
  color?: string;
  accent?: string;
}

const stroke = (c: string, w = 2.4) => ({
  stroke: c,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

/** 雲朵路徑(共用) */
function Cloud({ c, cx = 0, cy = 0 }: { c: string; cx?: number; cy?: number }) {
  return (
    <Path
      d={`M${14 + cx},${34 + cy} a8,8 0 0 1 -0.6,-15.94 a11,11 0 0 1 21.2,2.2 a7,7 0 0 1 -1.6,13.74 Z`}
      {...stroke(c)}
      fill={c}
      fillOpacity={0.14}
    />
  );
}

function Sun({ c, accent }: { c: string; accent: string }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <G>
      {rays.map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 24 + Math.cos(r) * 12;
        const y1 = 24 + Math.sin(r) * 12;
        const x2 = 24 + Math.cos(r) * 17;
        const y2 = 24 + Math.sin(r) * 17;
        return <Line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} {...stroke(accent, 2.4)} />;
      })}
      <Circle cx={24} cy={24} r={9} {...stroke(accent, 2.4)} fill={accent} fillOpacity={0.22} />
    </G>
  );
}

function Moon({ c }: { c: string }) {
  return (
    <Path
      d="M31,32 A13,13 0 1 1 22,10 A10,10 0 0 0 31,32 Z"
      {...stroke(c, 2.4)}
      fill={c}
      fillOpacity={0.16}
    />
  );
}

function Rays({ c, count, angle = 22 }: { c: string; count: number; angle?: number }) {
  const xs = Array.from({ length: count }, (_, i) => 15 + (i * 18) / Math.max(count - 1, 1));
  const dx = Math.sin((angle * Math.PI) / 180) * 6;
  const dy = Math.cos((angle * Math.PI) / 180) * 6;
  return (
    <G>
      {xs.map((x, i) => (
        <Line key={i} x1={x} y1={37} x2={x - dx} y2={37 + dy + 5} {...stroke(c, 2.2)} />
      ))}
    </G>
  );
}

export function WeatherGlyph({ code, isDay, size = 44, color = '#334', accent = '#e8896a' }: Props) {
  const svg = { width: size, height: size, viewBox: '0 0 48 48' };
  const c = color;

  // 晴
  if (code === 0) {
    return <Svg {...svg}>{isDay ? <Sun c={c} accent={accent} /> : <Moon c={c} />}</Svg>;
  }
  // 晴時多雲 / 多雲
  if (code === 1 || code === 2) {
    return (
      <Svg {...svg}>
        {isDay ? (
          <G>
            <Circle cx={17} cy={17} r={6.5} {...stroke(accent, 2.2)} fill={accent} fillOpacity={0.22} />
            {[210, 250, 290].map((deg) => {
              const r = (deg * Math.PI) / 180;
              return (
                <Line key={deg} x1={17 + Math.cos(r) * 8.5} y1={17 + Math.sin(r) * 8.5} x2={17 + Math.cos(r) * 12} y2={17 + Math.sin(r) * 12} {...stroke(accent, 2)} />
              );
            })}
          </G>
        ) : null}
        <Cloud c={c} cx={3} cy={3} />
      </Svg>
    );
  }
  // 陰
  if (code === 3) {
    return (
      <Svg {...svg}>
        <Cloud c={c} cx={0} cy={1} />
      </Svg>
    );
  }
  // 霧
  if (code === 45 || code === 48) {
    return (
      <Svg {...svg}>
        <Cloud c={c} cx={0} cy={-3} />
        {[36, 40, 44].map((y, i) => (
          <Line key={y} x1={11 + i * 2} y1={y} x2={37 - i * 2} y2={y} {...stroke(c, 2.2)} />
        ))}
      </Svg>
    );
  }
  // 毛毛雨
  if (code >= 51 && code <= 57) {
    return (
      <Svg {...svg}>
        <Cloud c={c} cx={0} cy={-3} />
        <Rays c={c} count={3} />
      </Svg>
    );
  }
  // 雨 / 陣雨
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <Svg {...svg}>
        <Cloud c={c} cx={0} cy={-3} />
        <Rays c={c} count={4} />
      </Svg>
    );
  }
  // 雪
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return (
      <Svg {...svg}>
        <Cloud c={c} cx={0} cy={-3} />
        {[16, 24, 32].map((x, i) => (
          <G key={x}>
            <Line x1={x} y1={37 + (i % 2)} x2={x} y2={43 + (i % 2)} {...stroke(c, 2)} />
            <Line x1={x - 2.6} y1={38.5 + (i % 2)} x2={x + 2.6} y2={41.5 + (i % 2)} {...stroke(c, 2)} />
            <Line x1={x + 2.6} y1={38.5 + (i % 2)} x2={x - 2.6} y2={41.5 + (i % 2)} {...stroke(c, 2)} />
          </G>
        ))}
      </Svg>
    );
  }
  // 雷雨
  return (
    <Svg {...svg}>
      <Cloud c={c} cx={0} cy={-3} />
      <Path d="M25,35 L20,43 L24,43 L21,49" {...stroke(accent, 2.6)} fill="none" />
      <Rays c={c} count={2} />
    </Svg>
  );
}
