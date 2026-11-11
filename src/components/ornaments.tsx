// Illuminations from the approved canvas: the shamsa (a sitting completed), the week's
// seven-petal rosette, and the Mamluk enamelled lamp (welcome).
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { F, usePalette } from '../theme';

const GOLD = (id: string) => (
  <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#F7E2A6" /><Stop offset="0.5" stopColor="#E2BC6A" /><Stop offset="1" stopColor="#9C7428" /></LinearGradient>
);

// The shamsa: an illuminated sun medallion with a twelve-petal rosette and an amber heart.
export function Shamsa({ size = 300 }: { size?: number }) {
  const rays = Array.from({ length: 32 }, (_, i) => { const a = (i * Math.PI * 2) / 32; const long = i % 2 === 0; return { a, long }; });
  const petals = Array.from({ length: 16 }, (_, j) => (j * Math.PI * 2) / 16 + Math.PI / 16);
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      <Defs>
        <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#F2C46B" stopOpacity={0.35} /><Stop offset="0.6" stopColor="#F2C46B" stopOpacity={0.08} /><Stop offset="1" stopColor="#F2C46B" stopOpacity={0} /></RadialGradient>
        {GOLD('sg')}
        <RadialGradient id="lapis" cx="50%" cy="40%" r="60%"><Stop offset="0" stopColor="#2E57B8" /><Stop offset="1" stopColor="#14306F" /></RadialGradient>
        <RadialGradient id="amber" cx="34%" cy="28%" r="78%"><Stop offset="0" stopColor="#FFF1C4" /><Stop offset="0.4" stopColor="#F0B451" /><Stop offset="1" stopColor="#8A4A12" /></RadialGradient>
        <RadialGradient id="enamel" cx="40%" cy="35%" r="70%"><Stop offset="0" stopColor="#8FEADF" /><Stop offset="1" stopColor="#1F8A80" /></RadialGradient>
      </Defs>
      <Circle cx={150} cy={150} r={148} fill="url(#sunGlow)" />
      {rays.map(({ a, long }, i) => (
        <Line key={i} x1={150 + 112 * Math.cos(a)} y1={150 + 112 * Math.sin(a)} x2={150 + (long ? 146 : 132) * Math.cos(a)} y2={150 + (long ? 146 : 132) * Math.sin(a)} stroke="#E2BC6A" strokeOpacity={long ? 0.7 : 0.4} strokeWidth={1.2} strokeLinecap="round" />
      ))}
      {petals.map((b, j) => <Circle key={j} cx={150 + 96 * Math.cos(b)} cy={150 + 96 * Math.sin(b)} r={13} fill="url(#lapis)" stroke="url(#sg)" strokeWidth={2} />)}
      <Circle cx={150} cy={150} r={84} fill="url(#lapis)" stroke="url(#sg)" strokeWidth={3} />
      <Circle cx={150} cy={150} r={76} fill="none" stroke="#E2BC6A" strokeOpacity={0.5} strokeWidth={1} />
      {Array.from({ length: 12 }, (_, q) => (
        <G key={q} transform={`translate(150 150) rotate(${q * 30})`}>
          <Path d="M0 -16 C 11 -27, 12 -50, 0 -66 C -12 -50, -11 -27, 0 -16 Z" fill="url(#enamel)" fillOpacity={0.92} stroke="url(#sg)" strokeWidth={2} />
          <Path d="M0 -28 C 4 -36, 4 -46, 0 -54 C -4 -46, -4 -36, 0 -28 Z" fill="#F7E2A6" fillOpacity={0.55} />
        </G>
      ))}
      <Circle cx={150} cy={150} r={21} fill="#14306F" stroke="url(#sg)" strokeWidth={2.5} />
      <Circle cx={150} cy={150} r={14} fill="url(#amber)" />
      <Ellipse cx={145.5} cy={144.5} rx={5} ry={3.2} fill="#FFFFFF" fillOpacity={0.7} />
    </Svg>
  );
}

// The week as a seven-petal rosette, Monday first, clockwise from the top.
export type PetalState = 'done' | 'today' | 'future' | 'missed';
export function WeekRosette({ size = 300, names, states, children }: { size?: number; names: string[]; states: PetalState[]; children?: React.ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 300 300">
        <Defs>
          {GOLD('wg')}
          <RadialGradient id="core" cx="50%" cy="45%" r="60%"><Stop offset="0" stopColor={p.dark ? '#1F6E5A' : p.primary[0]} /><Stop offset="1" stopColor={p.dark ? '#0A2B24' : p.primary[2]} /></RadialGradient>
        </Defs>
        <Circle cx={150} cy={150} r={146} fill="none" stroke={p.gold} strokeOpacity={0.2} strokeWidth={1} />
        {states.map((s, i) => {
          const deg = i * (360 / 7);
          const fill = s === 'done' ? 'url(#wg)' : s === 'today' ? 'rgba(83,205,191,0.22)' : p.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)';
          const stroke = s === 'done' ? '#F7E2A6' : s === 'today' ? p.turq : p.goldFaint;
          const inner = s === 'done' ? 'rgba(42,29,7,0.45)' : s === 'today' ? 'rgba(127,227,215,0.6)' : 'rgba(226,188,106,0.18)';
          return (
            <G key={i} transform={`translate(150 150) rotate(${deg.toFixed(2)})`}>
              <Path d="M0 -58 C 30 -70, 34 -116, 0 -140 C -34 -116, -30 -70, 0 -58 Z" fill={fill} stroke={stroke} strokeWidth={s === 'today' ? 2 : 1.2} strokeDasharray={s === 'missed' ? '4 3' : undefined} />
              <Path d="M0 -76 C 14 -84, 16 -110, 0 -122 C -16 -110, -14 -84, 0 -76 Z" fill="none" stroke={inner} strokeWidth={1} />
            </G>
          );
        })}
        {states.map((s, i) => {
          const a = ((i * (360 / 7) - 90) * Math.PI) / 180;
          return (
            <SvgText key={`l${i}`} x={150 + 99 * Math.cos(a)} y={154 + 99 * Math.sin(a)} textAnchor="middle" fontFamily={F.uiBold} fontSize={11} fill={s === 'done' ? '#2A1D07' : s === 'today' ? p.turqHi : p.muted}>{names[i]}</SvgText>
          );
        })}
        <Circle cx={150} cy={150} r={52} fill="url(#core)" stroke="url(#wg)" strokeWidth={2} />
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: size * 0.327, top: size * 0.327, width: size * 0.347, height: size * 0.347, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

// A Mamluk enamelled glass lamp, lit from within.
export function Lamp({ width = 220 }: { width?: number }) {
  const h = (width * 360) / 220;
  return (
    <Svg width={width} height={h} viewBox="0 0 220 360">
      <Defs>
        <RadialGradient id="flame" cx="50%" cy="58%" r="55%"><Stop offset="0" stopColor="#FFF4CF" stopOpacity={1} /><Stop offset="0.35" stopColor="#F7C566" stopOpacity={0.85} /><Stop offset="1" stopColor="#C47A22" stopOpacity={0.1} /></RadialGradient>
        <LinearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.1} /><Stop offset="0.25" stopColor="#FFFFFF" stopOpacity={0.32} /><Stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.06} /><Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.16} /></LinearGradient>
        <LinearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#F7E2A6" /><Stop offset="1" stopColor="#A8802F" /></LinearGradient>
        <RadialGradient id="halo" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#F2C46B" stopOpacity={0.5} /><Stop offset="1" stopColor="#F2C46B" stopOpacity={0} /></RadialGradient>
      </Defs>
      <Circle cx={110} cy={250} r={105} fill="url(#halo)" />
      <Path d="M110 0 V96 M110 96 L62 168 M110 96 L158 168 M110 96 L110 168" stroke="#E2BC6A" strokeOpacity={0.75} strokeWidth={1.4} strokeDasharray="3 3" />
      <Circle cx={110} cy={96} r={5} fill="url(#lg)" />
      <Path d="M58 168 L162 168 L140 222 L80 222 Z" fill="url(#flame)" fillOpacity={0.55} />
      <Path d="M58 168 L162 168 L140 222 L80 222 Z" fill="url(#glass)" stroke="url(#lg)" strokeWidth={2} />
      <Path d="M66 182 L154 182" stroke="#E2BC6A" strokeWidth={5} strokeOpacity={0.9} />
      {Array.from({ length: 9 }, (_, i) => <Circle key={i} cx={74 + i * 9} cy={196} r={3} fill="#2F6FD0" stroke="#E2BC6A" strokeWidth={1} />)}
      <Path d="M80 222 C38 230 34 300 70 316 L150 316 C186 300 182 230 140 222 Z" fill="url(#flame)" />
      <Path d="M80 222 C38 230 34 300 70 316 L150 316 C186 300 182 230 140 222 Z" fill="url(#glass)" stroke="url(#lg)" strokeWidth={2} />
      <Path d="M52 256 C90 266 130 266 168 256" stroke="#2F6FD0" strokeWidth={9} strokeOpacity={0.75} fill="none" />
      <Path d="M52 256 C90 266 130 266 168 256" stroke="#E2BC6A" strokeWidth={1.2} fill="none" strokeDasharray="6 4" />
      <Ellipse cx={110} cy={276} rx={9} ry={14} fill="#FFF6D6" />
      <Path d="M86 316 L134 316 L128 334 L92 334 Z" fill="url(#glass)" stroke="url(#lg)" strokeWidth={2} />
      <Path d="M78 334 L142 334" stroke="url(#lg)" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
