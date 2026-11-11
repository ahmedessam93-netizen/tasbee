// The day's horizon: one point per sitting, laid on an arc like the sun's path.
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fmtTime } from '../core/plan';
import { F, usePalette } from '../theme';
import { PRAYER_ICONS } from './icons';

export type Orb = { i: number; name: string; time: Date | null; state: 'done' | 'current' | 'upcoming' | 'missed' };

export function PrayerPath({ orbs, width, onPress }: { orbs: Orb[]; width: number; onPress?: (k: number) => void }) {
  const p = usePalette();
  const n = orbs.length;
  return (
    <View style={{ width, height: 124 }}>
      <Svg width={width} height={74} style={{ position: 'absolute', top: 10, left: 0 }}>
        <Path d={`M8 62 Q${width / 2} -18 ${width - 8} 62`} fill="none" stroke={p.gold} strokeOpacity={0.35} strokeWidth={1.2} strokeDasharray="1.5 6" strokeLinecap="round" />
      </Svg>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        {orbs.map((o, k) => {
          const x = (k + 0.5) / n;
          const top = Math.round((40 * (1 - 4 * x * (1 - x))) / 0.64);
          const Icon = PRAYER_ICONS[o.i];
          const done = o.state === 'done', cur = o.state === 'current';
          const ink = done ? p.onGold : cur ? p.turqHi : p.muted;
          return (
            <Pressable key={o.i} disabled={!onPress} onPress={() => onPress && onPress(k)} accessibilityRole="button"
              accessibilityLabel={`جلسة ${o.name}${o.state === 'done' ? '، تمّت' : o.state === 'missed' ? '، فاتت، اضغط لقراءتها' : ''}`}
              style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingTop: top, opacity: pressed ? 0.6 : 1 })}>
              <View style={[{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
                cur ? { shadowColor: p.turq, shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 } : null]}>
                {cur ? <View style={{ position: 'absolute', width: 58, height: 58, borderRadius: 29, backgroundColor: p.turqSoft, opacity: 0.6 }} /> : null}
                {done
                  ? <LinearGradient colors={['#F7E2A6', '#E2BC6A', '#B48A36']} locations={[0, 0.55, 1]} style={{ position: 'absolute', width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#F7E2A6' }} />
                  : <View style={{ position: 'absolute', width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderStyle: o.state === 'missed' ? 'dashed' : 'solid', borderColor: cur ? p.turq : p.goldFaint, backgroundColor: cur ? p.turqSoft : p.chip }} />}
                <View style={{ zIndex: 1 }}><Icon size={22} color={done ? '#2A1D07' : ink} strokeWidth={1.7} /></View>
              </View>
              <Text maxFontSizeMultiplier={1.15} style={{ marginTop: 6, fontFamily: F.uiBold, fontSize: 13, lineHeight: 18, color: done ? p.goldLight : cur ? p.turqHi : p.ink, opacity: o.state === 'missed' ? 0.55 : done || cur ? 1 : 0.85 }}>{o.name}</Text>
              <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: F.ui, fontSize: 12, lineHeight: 16, color: p.faint }}>{fmtTime(o.time)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
