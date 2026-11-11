import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient as SvgLinear, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useStore } from '../core/store';
import { F, Palette, usePalette } from '../theme';

// The web version runs on phones' browsers: keep it light (no endless animations).
const WEB = Platform.OS === 'web';

// ---------- haptics ----------
export function useTap() {
  const { state } = useStore();
  return (kind: 'light' | 'medium' | 'rigid' | 'success' = 'light') => {
    if (state.settings.haptics === false) return;
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : kind === 'rigid' ? Haptics.ImpactFeedbackStyle.Rigid : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
}

// ---------- text ----------
type V = 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'meta' | 'label' | 'num' | 'sacred';
type TxtProps = TextProps & { v?: V; color?: string; align?: TextStyle['textAlign'] };
export function Txt({ v = 'body', color, align, style, ...rest }: TxtProps) {
  const p = usePalette();
  const base: TextStyle = {
    hero: { fontFamily: F.displayBold, fontSize: 60, lineHeight: 80, color: p.title },
    display: { fontFamily: F.display, fontSize: 36, lineHeight: 50, color: p.title },
    h1: { fontFamily: F.display, fontSize: 30, lineHeight: 42, color: p.ink },
    h2: { fontFamily: F.uiBold, fontSize: 16.5, lineHeight: 26, color: p.goldLight },
    h3: { fontFamily: F.uiBold, fontSize: 16.5, lineHeight: 25, color: p.ink },
    body: { fontFamily: F.ui, fontSize: 16, lineHeight: 25, color: p.ink },
    meta: { fontFamily: F.ui, fontSize: 14.5, lineHeight: 23, color: p.muted },
    label: { fontFamily: F.ui, fontSize: 13, lineHeight: 20, color: p.muted },
    num: { fontFamily: F.title, fontSize: 72, lineHeight: 88, color: p.ink },
    sacred: { fontFamily: F.title, fontSize: 23, lineHeight: 44, color: p.ink },
  }[v];
  return <Text maxFontSizeMultiplier={1.35} {...rest} style={[base, { textAlign: align ?? 'right', writingDirection: 'rtl' }, color ? { color } : null, style]} />;
}

// The book's own rosette, used as the progress marker everywhere.
export function Mark({ color, size = 26 }: { color: string; size?: number }) {
  return <Text allowFontScaling={false} style={{ fontFamily: F.serif, fontSize: size, lineHeight: size * 1.15, width: size + 2, textAlign: 'center', color }}>۞</Text>;
}

// ---------- sky ----------
function seeded(n: number, seed = 11) { let s = seed; const out: number[] = []; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; out.push(s / 233280); } return out; }

function Twinkle({ x, y, r, delay, color }: { x: number; y: number; r: number; delay: number; color: string }) {
  const o = useSharedValue(0.3);
  useEffect(() => { o.value = withDelay(delay, withRepeat(withSequence(withTiming(0.95, { duration: 2600, easing: Easing.inOut(Easing.sin) }), withTiming(0.25, { duration: 2800, easing: Easing.inOut(Easing.sin) })), -1)); }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: color }, st]} />;
}

export function Sky({ glowAt = 0 }: { glowAt?: number }) {
  const p = usePalette();
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => {
    const r = seeded(34 * 3); const out = [];
    for (let i = 0; i < 34; i++) out.push({ x: r[i * 3] * width, y: r[i * 3 + 1] * height * 0.42, s: 0.5 + r[i * 3 + 2] * 1.1, o: 0.25 + r[i * 3 + 2] * 0.6, d: Math.floor(r[i * 3 + 2] * 4000) });
    return out;
  }, [width, height]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={p.sky} locations={[0, 0.34, 0.62, 1]} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="lamp" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0" stopColor="#F2C46B" stopOpacity={p.dark ? 0.3 : 0.24} />
            <Stop offset="0.45" stopColor="#F2C46B" stopOpacity={p.dark ? 0.07 : 0.1} />
            <Stop offset="1" stopColor="#F2C46B" stopOpacity={0} />
          </RadialGradient>
          <SvgLinear id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff" stopOpacity={1} />
            <Stop offset="0.55" stopColor="#fff" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </SvgLinear>
          <Mask id="fadeMask"><Rect width={width} height={height} fill="url(#fade)" /></Mask>
          <Pattern id="khatam" width={78} height={78} patternUnits="userSpaceOnUse">
            <Path d="M39 13 L46 32 L65 39 L46 46 L39 65 L32 46 L13 39 L32 32 Z" fill="none" stroke={p.lattice} strokeOpacity={p.dark ? 0.07 : 0.13} strokeWidth={1} />
            <Rect x={27} y={27} width={24} height={24} fill="none" stroke={p.lattice} strokeOpacity={0.05} strokeWidth={1} />
            <Rect x={27} y={27} width={24} height={24} fill="none" stroke={p.lattice} strokeOpacity={0.05} strokeWidth={1} transform="rotate(45 39 39)" />
          </Pattern>
        </Defs>
        {WEB
          ? <Rect width={width} height={height * 0.5} fill="url(#khatam)" opacity={0.7} />
          : <Rect width={width} height={height} fill="url(#khatam)" mask="url(#fadeMask)" />}
        <Ellipse cx={width / 2} cy={glowAt} rx={width * 0.95} ry={height * 0.46} fill="url(#lamp)" />
      </Svg>
      {p.dark && stars.map((s, i) => (i % 3 === 0 && !WEB
        ? <Twinkle key={i} x={s.x} y={s.y} r={s.s} delay={s.d} color={p.star} />
        : <View key={i} style={{ position: 'absolute', left: s.x - s.s, top: s.y - s.s, width: s.s * 2, height: s.s * 2, borderRadius: s.s, backgroundColor: p.star, opacity: s.o }} />))}
    </View>
  );
}

// ---------- panels ----------
export function Panel({ children, style, padding = 18, radius = 24 }: { children?: React.ReactNode; style?: ViewStyle | ViewStyle[]; padding?: number; radius?: number }) {
  const p = usePalette();
  // Day: a solid ivory card lifted off the page. Night: a sheet of glass with a fine gold edge.
  return (
    <View style={[{ borderRadius: radius, backgroundColor: p.card || 'transparent' }, p.dark ? null : { shadowColor: '#6B4A12', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 }, style as ViewStyle]}>
      <View style={{ borderRadius: radius, borderWidth: 1, borderColor: p.panelBorder, overflow: 'hidden' }}>
        <LinearGradient colors={p.panel} style={StyleSheet.absoluteFill} />
        {p.dark ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 18, right: 18, height: 1, backgroundColor: 'rgba(247,226,166,0.22)' }} /> : null}
        <View style={{ paddingHorizontal: padding, paddingVertical: Math.max(4, padding / 3) }}>{children}</View>
      </View>
    </View>
  );
}
// kept for older call sites
export const Glass = Panel;

// floating bar (tab bar, reader chrome)
export function Bar({ children, style, radius = 24 }: { children: React.ReactNode; style?: ViewStyle; radius?: number }) {
  const p = usePalette();
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor: p.dark ? 'rgba(226,188,106,0.3)' : 'rgba(138,100,32,0.25)', overflow: 'hidden', shadowColor: '#000', shadowOpacity: p.dark ? 0.45 : 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 12 }, style]}>
      {Platform.OS === 'ios' && <BlurView intensity={40} tint={p.dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'} style={StyleSheet.absoluteFill} />}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: p.bar }]} />
      {children}
    </View>
  );
}

// ---------- buttons ----------
function usePress() {
  const s = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return { st, onPressIn: () => { s.value = withSpring(0.97, { damping: 18, stiffness: 420 }); }, onPressOut: () => { s.value = withSpring(1, { damping: 14, stiffness: 300 }); } };
}

export function GoldButton({ label, onPress, icon, style, small, a11y }: { label: string; onPress: () => void; icon?: React.ReactNode; style?: ViewStyle; small?: boolean; a11y?: string }) {
  const p = usePalette(); const tap = useTap(); const pr = usePress();
  return (
    <Animated.View style={[pr.st, style, { shadowColor: p.dark ? '#E2BC6A' : p.primary[2], shadowOpacity: p.dark ? 0.28 : 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 6, borderRadius: small ? 17 : 20 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={a11y || label} onPressIn={pr.onPressIn} onPressOut={pr.onPressOut} onPress={() => { tap('medium'); onPress(); }}>
        <LinearGradient colors={p.primary} locations={[0, 0.48, 1]} style={{ height: small ? 52 : 60, borderRadius: small ? 17 : 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 }}>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 10, right: 10, height: 1, backgroundColor: 'rgba(255,255,255,0.6)' }} />
          {icon}
          <Text maxFontSizeMultiplier={1.25} style={{ fontFamily: F.uiBold, fontSize: small ? 16 : 18, color: p.onPrimary }}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function GlassButton({ label, onPress, icon, style, tone, a11y }: { label?: string; onPress: () => void; icon?: React.ReactNode; style?: ViewStyle; tone?: 'gold' | 'plain'; a11y?: string }) {
  const p = usePalette(); const tap = useTap(); const pr = usePress();
  return (
    <Animated.View style={[pr.st, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={a11y || label} onPressIn={pr.onPressIn} onPressOut={pr.onPressOut} onPress={() => { tap(); onPress(); }}
        style={{ minHeight: 56, borderRadius: 20, paddingHorizontal: label ? 18 : 0, minWidth: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder }}>
        {icon}
        {label ? <Text maxFontSizeMultiplier={1.25} style={{ fontFamily: F.uiMed, fontSize: 17, color: tone === 'gold' ? p.gold : p.ink }}>{label}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({ onPress, children, label, size = 44 }: { onPress: () => void; children: React.ReactNode; label: string; size?: number }) {
  const p = usePalette(); const tap = useTap();
  return (
    <Pressable onPress={() => { tap(); onPress(); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? p.goldFaint : p.dark ? 'rgba(255,255,255,0.07)' : 'rgba(20,38,80,0.06)', borderWidth: 1, borderColor: p.dark ? 'rgba(226,188,106,0.2)' : 'rgba(138,100,32,0.18)' })}>
      {children}
    </Pressable>
  );
}

// ---------- form controls ----------
export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  const p = usePalette(); const tap = useTap();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: p.dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,38,80,0.06)', borderRadius: 12, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const on = o.v === value;
        return (
          <Pressable key={String(o.v)} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { tap(); onChange(o.v); }}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9, minHeight: 34, justifyContent: 'center', backgroundColor: on ? (p.dark ? 'rgba(226,188,106,0.18)' : '#FFFFFF') : 'transparent', borderWidth: 1, borderColor: on ? (p.dark ? 'rgba(226,188,106,0.4)' : 'rgba(138,100,32,0.3)') : 'transparent' }}>
            <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: on ? F.uiBold : F.uiMed, fontSize: 14, color: on ? p.goldLight : p.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const p = usePalette(); const tap = useTap();
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => { x.value = withSpring(value ? 1 : 0, { damping: 16, stiffness: 260 }); }, [value]);
  // RTL: "on" puts the knob at the far (left) end
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(x.value, [0, 1], [0, -20]) }] }));
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={() => { tap(); onChange(!value); }} hitSlop={8}>
      <View style={{ width: 52, height: 32, borderRadius: 16, overflow: 'hidden', padding: 3, justifyContent: 'center', alignItems: 'flex-start', backgroundColor: p.dark ? 'rgba(255,255,255,0.14)' : 'rgba(20,38,80,0.14)' }}>
        {value ? <LinearGradient colors={p.dark ? ['#F7E2A6', '#C99C46'] : [p.primary[0], p.primary[2]]} style={StyleSheet.absoluteFill} /> : null}
        <Animated.View style={[{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF8E6', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }, knob]} />
      </View>
    </Pressable>
  );
}

export function Row({ title, sub, right, onPress, first, children }: { title: string; sub?: string; right?: React.ReactNode; onPress?: () => void; first?: boolean; children?: React.ReactNode }) {
  const p = usePalette(); const tap = useTap();
  const body = (
    <View style={{ minHeight: 58, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: p.rule }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt v="body" style={{ fontFamily: F.uiMed }}>{title}</Txt>
          {sub ? <Txt v="label" style={{ fontSize: 13, lineHeight: 19 }}>{sub}</Txt> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
  return onPress ? <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" accessibilityLabel={title}>{body}</Pressable> : body;
}

export function SectionTitle({ children }: { children: string }) {
  const p = usePalette();
  return <Text maxFontSizeMultiplier={1.3} style={{ fontFamily: F.uiBold, fontSize: 13.5, lineHeight: 20, color: p.goldLight, marginTop: 24, marginBottom: 8, marginHorizontal: 6, textAlign: 'right' }}>{children}</Text>;
}

/** One number with its caption: used in the rows of small facts on the home screens. */
export function Stat({ value, label, tone }: { value: string; label: string; tone?: 'gold' | 'now' }) {
  const p = usePalette();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 }}>
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: F.title, fontSize: 26, lineHeight: 34, color: tone === 'now' ? p.turqHi : tone === 'gold' ? p.goldLight : p.ink }}>{value === '٠' ? '–' : value}</Text>
      <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={{ fontFamily: F.ui, fontSize: 12, lineHeight: 17, color: p.muted }}>{label}</Text>
    </View>
  );
}

/** The page fades out under the floating tab bar, so text never shows through it. */
export function TabFade({ height = 132 }: { height?: number }) {
  const p = usePalette();
  const c = p.sky[3]; const clear = p.dark ? 'rgba(5,10,20,0)' : 'rgba(242,232,212,0)';
  return <LinearGradient pointerEvents="none" colors={[clear, c, c]} locations={[0, 0.55, 1]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }} />;
}

export const useP = usePalette;
export type { Palette };
