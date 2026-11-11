// Today's part as a ring of five arcs, one per sitting: gold when done, turquoise for the part
// read so far in the current one.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { usePalette } from '../theme';

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  // angles in turns, 0 at the top, clockwise (drawn mirrored for right-to-left reading)
  const pt = (a: number) => [cx - r * Math.sin(a * 2 * Math.PI), cy - r * Math.cos(a * 2 * Math.PI)];
  const [x0, y0] = pt(a0); const [x1, y1] = pt(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 0.5 ? 1 : 0} 0 ${x1} ${y1}`;
}

export function Ring({ size, shares, done, partial, current, label, children }: {
  size: number; shares: number[]; done: boolean[]; partial: number; current: number; label: string; children?: React.ReactNode;
}) {
  const p = usePalette();
  const c = size / 2; const r = size / 2 - 16; const gap = 0.014; const sw = 13;
  const total = shares.reduce((a, b) => a + b, 0) || 1;
  let a = 0;
  const segs = shares.map((w, k) => { const s = a; a += w / total; return { k, a0: s + gap, a1: a - gap }; });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={label}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="ringHeart" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#F2C46B" stopOpacity={p.dark ? 0.16 : 0.2} /><Stop offset="1" stopColor="#F2C46B" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r - 14} fill="url(#ringHeart)" />
        <Circle cx={c} cy={c} r={r + 12} stroke={p.goldFaint} strokeWidth={1} fill="none" opacity={0.55} />
        <Circle cx={c} cy={c} r={r - 14} stroke={p.goldFaint} strokeWidth={1} strokeDasharray="1 7" strokeLinecap="round" fill="none" opacity={0.8} />
        {segs.map((s) => (
          <Path key={`b${s.k}`} d={arc(c, c, r, s.a0, s.a1)} stroke={s.k === current && !done[s.k] ? p.turqSoft : p.dark ? 'rgba(255,255,255,0.09)' : 'rgba(20,38,30,0.13)'} strokeWidth={sw} strokeLinecap="round" fill="none" />
        ))}
        {segs.map((s) => done[s.k] ? (
          <Path key={`d${s.k}`} d={arc(c, c, r, s.a0, s.a1)} stroke={p.gold} strokeWidth={sw} strokeLinecap="round" fill="none" />
        ) : s.k === current && partial > 0.01 ? (
          <Path key={`p${s.k}`} d={arc(c, c, r, s.a0, s.a0 + (s.a1 - s.a0) * Math.min(1, partial))} stroke={p.turq} strokeWidth={sw} strokeLinecap="round" fill="none" />
        ) : null)}
        {segs.map((s) => s.k === current && !done[s.k] ? (
          <Circle key={`c${s.k}`} cx={c - r * Math.sin(s.a0 * 2 * Math.PI)} cy={c - r * Math.cos(s.a0 * 2 * Math.PI)} r={sw / 2 + 2.5} fill={p.turq} stroke={p.sky[1]} strokeWidth={3} />
        ) : null)}
      </Svg>
      {children}
    </View>
  );
}
