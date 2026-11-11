// The pieces of the home and week screens: the week ribbon, the day's card, the sittings,
// the shortcuts and the month. Shared by every screen that shows "where am I in my reading".
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { CheckIcon, ChevronIcon } from './icons';
import { useTap } from './ui';
import { F, usePalette } from '../theme';

const ON_HERO = '#F6EEDB'; const ON_HERO_MUTED = 'rgba(246,238,219,0.74)';
const GOLD: [string, string, string] = ['#F7E2A6', '#E2BC6A', '#C39A45'];

/** A ring that fills clockwise from the top. */
export function ProgressRing({ size, frac, stroke = 8, color, track, children }: { size: number; frac: number; stroke?: number; color: string; track: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r; const f = Math.max(0, Math.min(1, frac));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
          {f > 0 ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${Math.max(0.01, c * f)} ${c}`} /> : null}
        </G>
      </Svg>
      {children}
    </View>
  );
}

export type StripDay = { key: string; name: string; num: string; frac: number; full: boolean; today: boolean; selected: boolean; a11y: string };
/** The week at a glance: seven days, each with its own small ring. Tap a day to open it. */
export function WeekStrip({ days, onPick }: { days: StripDay[]; onPick: (key: string) => void }) {
  const p = usePalette(); const tap = useTap();
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginTop: 14 }}>
      {days.map((d) => (
        <Pressable key={d.key} onPress={() => { tap(); onPick(d.key); }} accessibilityRole="button" accessibilityState={{ selected: d.selected }} accessibilityLabel={d.a11y}
          style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 9, borderRadius: 18, overflow: 'hidden',
            borderWidth: 1, borderColor: d.selected ? 'transparent' : d.today ? p.goldFaint : 'transparent' }}>
          {d.selected ? <LinearGradient colors={p.hero} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: d.selected || d.today ? F.uiBold : F.ui, fontSize: 11, lineHeight: 16, color: d.selected ? ON_HERO_MUTED : d.today ? p.goldLight : p.muted }}>{d.name}</Text>
          <View style={{ marginTop: 5 }}>
            {d.full ? (
              <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: d.selected ? GOLD[1] : p.gold }}>
                <CheckIcon size={17} color={d.selected ? '#2A1D07' : p.dark ? '#2A1D07' : '#FFF8E8'} />
              </View>
            ) : (
              <ProgressRing size={30} stroke={3} frac={d.frac} color={d.selected ? GOLD[1] : p.turq} track={d.selected ? 'rgba(255,255,255,0.2)' : p.dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,30,50,0.1)'}>
                <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 13, lineHeight: 18, color: d.selected ? ON_HERO : p.ink }}>{d.num}</Text>
              </ProgressRing>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/** The gold button that sits on the day's card. */
export function HeroButton({ label, onPress, icon, quiet }: { label: string; onPress: () => void; icon?: React.ReactNode; quiet?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ height: quiet ? 48 : 56, borderRadius: quiet ? 16 : 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10,
        transform: [{ scale: pressed ? 0.985 : 1 }], opacity: pressed ? 0.92 : 1, borderWidth: quiet ? 1 : 0, borderColor: 'rgba(247,226,166,0.5)',
        ...(quiet ? {} : { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 }) })}>
      {quiet ? null : <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />}
      {icon ? <View>{icon}</View> : null}
      <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={{ fontFamily: F.uiBold, fontSize: quiet ? 15.5 : 17.5, color: quiet ? GOLD[0] : '#2A1D07' }}>{label}</Text>
    </Pressable>
  );
}

/** The card that holds the day's reading: what is due now, how far along, and the way in. */
export function HeroCard({ eyebrow, tone, title, line, frac, big, small, done, children, style }: {
  eyebrow: string; tone: 'now' | 'done' | 'plain'; title: string; line?: string; frac: number; big: string; small: string; done?: boolean; children?: React.ReactNode; style?: ViewStyle;
}) {
  const p = usePalette();
  return (
    <View style={[{ borderRadius: 28, shadowColor: p.hero[2], shadowOpacity: p.dark ? 0.5 : 0.32, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 8 }, style]}>
      <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(247,226,166,0.28)' }}>
        <LinearGradient colors={p.hero} start={{ x: 0.9, y: 0 }} end={{ x: 0.1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {/* an eight-pointed star, half off the corner, as on a carved door */}
        <Svg width={230} height={230} viewBox="0 0 200 200" style={{ position: 'absolute', left: -78, top: -84, opacity: 0.16 }} pointerEvents="none">
          <Rect x={40} y={40} width={120} height={120} stroke={GOLD[0]} strokeWidth={1.4} fill="none" />
          <Rect x={40} y={40} width={120} height={120} stroke={GOLD[0]} strokeWidth={1.4} fill="none" transform="rotate(45 100 100)" />
          <Circle cx={100} cy={100} r={58} stroke={GOLD[0]} strokeWidth={1} fill="none" />
          <Circle cx={100} cy={100} r={96} stroke={GOLD[0]} strokeWidth={1} fill="none" />
        </Svg>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone === 'now' ? '#7FE3D0' : tone === 'done' ? GOLD[1] : 'rgba(246,238,219,0.5)' }} />
                <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={{ flexShrink: 1, fontFamily: F.uiMed, fontSize: 13.5, lineHeight: 20, color: tone === 'now' ? '#A8EFE2' : tone === 'done' ? GOLD[0] : ON_HERO_MUTED }}>{eyebrow}</Text>
              </View>
              <Text maxFontSizeMultiplier={1.15} numberOfLines={2} adjustsFontSizeToFit style={{ marginTop: 4, fontFamily: F.display, fontSize: 30, lineHeight: 44, color: ON_HERO }}>{title}</Text>
              {line ? <Text maxFontSizeMultiplier={1.2} style={{ marginTop: 2, fontFamily: F.ui, fontSize: 14, lineHeight: 22, color: ON_HERO_MUTED }}>{line}</Text> : null}
            </View>
            <ProgressRing size={96} stroke={9} frac={done ? 1 : frac} color={GOLD[1]} track="rgba(255,255,255,0.16)">
              {done ? <CheckIcon size={40} color={GOLD[0]} /> : (
                <>
                  <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 30, lineHeight: 36, color: ON_HERO }}>{big}</Text>
                  <Text allowFontScaling={false} style={{ fontFamily: F.ui, fontSize: 11, lineHeight: 15, color: ON_HERO_MUTED }}>{small}</Text>
                </>
              )}
            </ProgressRing>
          </View>
          {children ? <View style={{ marginTop: 18, gap: 10 }}>{children}</View> : null}
        </View>
      </View>
    </View>
  );
}

export type SitRow = { key: string; Icon: (p: { size?: number; color: string }) => React.ReactElement; title: string; sub: string; right: string; state: 'done' | 'now' | 'missed' | 'upcoming'; onPress: () => void; a11y: string };
/** The day's sittings down a rail, one after each prayer. */
export function Timeline({ rows }: { rows: SitRow[] }) {
  const p = usePalette(); const tap = useTap();
  return (
    <View>
      {rows.map((r, k) => {
        const c = r.state === 'done' ? p.gold : r.state === 'now' ? p.turq : p.faint;
        return (
          <Pressable key={r.key} onPress={() => { tap(); r.onPress(); }} accessibilityRole="button" accessibilityLabel={r.a11y}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'stretch', gap: 14, opacity: pressed ? 0.65 : 1 })}>
            <View style={{ alignItems: 'center', width: 42 }}>
              <View style={{ width: 2, height: 10, backgroundColor: k === 0 ? 'transparent' : p.rule }} />
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
                backgroundColor: r.state === 'done' ? p.gold : r.state === 'now' ? p.turqSoft : 'transparent', borderWidth: r.state === 'done' ? 0 : 1.5, borderColor: r.state === 'now' ? p.turq : p.goldFaint }}>
                {r.state === 'done' ? <CheckIcon size={22} color={p.dark ? '#2A1D07' : '#FFF8E8'} /> : <r.Icon size={22} color={r.state === 'now' ? p.turqHi : p.muted} />}
              </View>
              <View style={{ width: 2, flex: 1, minHeight: 10, backgroundColor: k === rows.length - 1 ? 'transparent' : p.rule }} />
            </View>
            <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', paddingVertical: 8 }}>
              <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={{ fontFamily: F.uiBold, fontSize: 16, lineHeight: 24, color: r.state === 'missed' ? p.muted : p.ink }}>{r.title}</Text>
              <Text maxFontSizeMultiplier={1.2} numberOfLines={2} style={{ fontFamily: F.ui, fontSize: 13, lineHeight: 19, color: p.muted }}>{r.sub}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: r.state === 'now' ? F.uiBold : F.ui, fontSize: 13, color: c }}>{r.right}</Text>
              <ChevronIcon size={15} color={p.faint} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export type TileItem = { key: string; icon: React.ReactNode; title: string; sub?: string; onPress: () => void };
/** Shortcuts, two to a row. */
export function Tiles({ items }: { items: TileItem[] }) {
  const p = usePalette(); const tap = useTap();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {items.map((t) => (
        <Pressable key={t.key} onPress={() => { tap(); t.onPress(); }} accessibilityRole="button" accessibilityLabel={t.sub ? `${t.title}، ${t.sub}` : t.title}
          style={({ pressed }) => ({ flexGrow: 1, flexBasis: '45%', minHeight: 104, padding: 14, borderRadius: 22, borderWidth: 1, borderColor: p.panelBorder, backgroundColor: p.card || p.chip,
            transform: [{ scale: pressed ? 0.98 : 1 }], ...(p.dark ? {} : { shadowColor: '#6B4A12', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 }) })}>
          <View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: p.dark ? 'rgba(226,188,106,0.13)' : 'rgba(148,100,16,0.1)' }}>{t.icon}</View>
          <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={{ marginTop: 10, fontFamily: F.uiBold, fontSize: 15.5, lineHeight: 23, color: p.ink }}>{t.title}</Text>
          {t.sub ? <Text maxFontSizeMultiplier={1.15} numberOfLines={2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted }}>{t.sub}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

export type HeatCell = { key: string; state: 'full' | 'some' | 'none' | 'future'; today?: boolean; num: string };
/** The last weeks as a small calendar: gold for a finished day, a ring for a started one. */
export function Heat({ head, weeks }: { head: string[]; weeks: HeatCell[][] }) {
  const p = usePalette();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {head.map((h, i) => <Text key={i} allowFontScaling={false} numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontFamily: F.ui, fontSize: 10.5, color: p.faint }}>{h}</Text>)}
      </View>
      {weeks.map((w, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
          {w.map((c) => (
            <View key={c.key} style={{ flex: 1, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
              backgroundColor: c.state === 'full' ? p.gold : c.state === 'some' ? p.turqSoft : p.dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,50,0.045)',
              borderWidth: c.today ? 1.5 : c.state === 'some' ? 1 : 0, borderColor: c.today ? p.turq : p.turq, opacity: c.state === 'future' ? 0.45 : 1 }}>
              <Text allowFontScaling={false} style={{ fontFamily: c.state === 'full' ? F.uiBold : F.ui, fontSize: 12.5, color: c.state === 'full' ? (p.dark ? '#2A1D07' : '#FFF8E8') : c.state === 'some' ? p.turqHi : p.muted }}>{c.num}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** A thin bar of progress with rounded ends. */
export function Meter({ frac, color, height = 6 }: { frac: number; color?: string; height?: number }) {
  const p = usePalette();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: p.dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,50,0.08)', overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`, borderRadius: height / 2, backgroundColor: color || p.gold }} />
    </View>
  );
}

/** A small heading over a card, with an optional link at its end. */
export function Head({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const p = usePalette(); const tap = useTap();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 10, paddingHorizontal: 4 }}>
      <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiBold, fontSize: 17, lineHeight: 26, color: p.ink }}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={() => { tap(); onAction(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel={action}>
          <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: F.uiMed, fontSize: 13.5, color: p.turqHi }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
