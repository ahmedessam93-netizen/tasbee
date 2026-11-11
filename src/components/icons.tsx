// Line icons from the approved canvas: drawn on a 24 grid, round caps.
import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { usePalette } from '../theme';

type P = { size?: number; color?: string; active?: boolean; strokeWidth?: number };

function Base({ size = 24, children, strokeWidth = 1.6, color, active }: P & { children: React.ReactNode }) {
  const p = usePalette();
  const stroke = color || (active ? p.goldLight : p.ink);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{children}</G>
    </Svg>
  );
}
const one = (d: string) => (p: P) => <Base {...p}><Path d={d} /></Base>;

// Mishkat: the hanging lamp. "Today".
export const LampIcon = (p: P) => (
  <Base {...p}>
    <Path d="M12 1.8v2.2" /><Path d="M8.6 7.2c.6-2 1.9-3.1 3.4-3.1s2.8 1.1 3.4 3.1" /><Path d="M7.6 7.2h8.8" />
    <Path d="M8.2 7.2l.9 9.6c.1.7.6 1.2 1.3 1.2h3.2c.7 0 1.2-.5 1.3-1.2l.9-9.6" /><Path d="M10.6 15.2v-3a1.4 1.4 0 0 1 2.8 0v3" />
    <Path d="M9.4 20.6h5.2" /><Path d="M12 18v2.6" />
  </Base>
);
// Crescent with a star. "Week".
export const CrescentIcon = (p: P) => (
  <Base {...p}>
    <Path d="M18.6 15.3A8 8 0 0 1 8.7 5.4 8 8 0 1 0 18.6 15.3z" />
    <Path d="M17 4.2l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2z" />
  </Base>
);
// The eight-pointed star. "Settings".
export const StarIcon = (p: P) => (
  <Base {...p}>
    <Rect x={5.6} y={5.6} width={12.8} height={12.8} rx={1.2} />
    <Rect x={5.6} y={5.6} width={12.8} height={12.8} rx={1.2} transform="rotate(45 12 12)" />
    <Circle cx={12} cy={12} r={2.6} />
  </Base>
);
// A small misbaha. The daily wird.
export const MisbahaIcon = (p: P) => {
  const pal = usePalette(); const c = p.color || pal.gold;
  return (
    <Base {...p} color={c} strokeWidth={p.strokeWidth ?? 1.5}>
      <Circle cx={12} cy={10.5} r={7} />
      <Circle cx={12} cy={3.5} r={1.3} fill={c} /><Circle cx={18.2} cy={7} r={1.3} fill={c} /><Circle cx={5.8} cy={7} r={1.3} fill={c} />
      <Path d="M12 17.5v4" />
    </Base>
  );
};
export const BookIcon = (p: P) => (
  <Base {...p} strokeWidth={p.strokeWidth ?? 1.8}>
    <Path d="M12 6.5c-1.8-1.4-4.4-2-7.5-1.8v13c3.1-.2 5.7.4 7.5 1.8 1.8-1.4 4.4-2 7.5-1.8v-13c-3.1-.2-5.7.4-7.5 1.8z" /><Path d="M12 6.5v13" />
  </Base>
);
export const CheckIcon = one('M5 12.5l4.5 4.5L19 7.5');
export const CloseIcon = (p: P) => <Base {...p} strokeWidth={p.strokeWidth ?? 2}><Path d="M6 6l12 12M18 6L6 18" /></Base>;
export const ChevronIcon = (p: P & { dir?: 'left' | 'right' }) => <Base {...p} strokeWidth={p.strokeWidth ?? 2}><Path d={p.dir === 'right' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} /></Base>;
export const PinIcon = (p: P) => <Base {...p} strokeWidth={p.strokeWidth ?? 2}><Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><Circle cx={12} cy={10} r={2.3} /></Base>;
export const BellIcon = one('M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0');
// A ribbon: a marked page. Filled when the page is marked.
export const BookmarkIcon = (p: P & { filled?: boolean }) => (
  <Svg width={p.size || 24} height={p.size || 24} viewBox="0 0 24 24" fill="none">
    <Path d="M7 3.8h10a.8.8 0 0 1 .8.8v15.6L12 16.4l-5.8 3.8V4.6a.8.8 0 0 1 .8-.8z" stroke={p.color} strokeWidth={1.7} strokeLinejoin="round" fill={p.filled ? p.color : 'none'} />
  </Svg>
);
// listening: filled shapes, so they read at a glance on the player bar
export const PlayIcon = (p: P) => <Svg width={p.size || 24} height={p.size || 24} viewBox="0 0 24 24"><Path d="M8 5.2v13.6a.9.9 0 0 0 1.38.76l10.4-6.8a.9.9 0 0 0 0-1.52L9.38 4.44A.9.9 0 0 0 8 5.2z" fill={p.color} /></Svg>;
export const PauseIcon = (p: P) => <Svg width={p.size || 24} height={p.size || 24} viewBox="0 0 24 24"><Rect x={6} y={4.5} width={4.4} height={15} rx={1.3} fill={p.color} /><Rect x={13.6} y={4.5} width={4.4} height={15} rx={1.3} fill={p.color} /></Svg>;
/** To the next ayah (pointing left, the way the page is read) or, mirrored, to the one before. */
export const SkipIcon = (p: P & { back?: boolean }) => (
  <Svg width={p.size || 24} height={p.size || 24} viewBox="0 0 24 24" style={p.back ? { transform: [{ scaleX: -1 }] } : undefined}>
    <Path d="M18 6.3v11.4a.8.8 0 0 1-1.25.66L8.6 12.66a.8.8 0 0 1 0-1.32l8.15-5.7A.8.8 0 0 1 18 6.3z" fill={p.color} /><Rect x={5} y={5.5} width={2.6} height={13} rx={1.1} fill={p.color} />
  </Svg>
);
export const RepeatIcon = (p: P) => (
  <Svg width={p.size || 24} height={p.size || 24} viewBox="0 0 24 24" fill="none">
    <Path d="M17 2.8l3.2 3.2L17 9.2M3.8 11V9.5A3.5 3.5 0 0 1 7.3 6h12.9M7 21.2L3.8 18 7 14.8M20.2 13v1.5a3.5 3.5 0 0 1-3.5 3.5H3.8" stroke={p.color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
export const ListenIcon = (p: P) => (
  <Svg width={p.size || 24} height={p.size || 24} viewBox="0 0 24 24" fill="none">
    <Path d="M4 14v-2a8 8 0 0 1 16 0v2" stroke={p.color} strokeWidth={1.8} strokeLinecap="round" />
    <Rect x={3} y={13} width={4.6} height={7} rx={2} stroke={p.color} strokeWidth={1.8} /><Rect x={16.4} y={13} width={4.6} height={7} rx={2} stroke={p.color} strokeWidth={1.8} />
  </Svg>
);
export const SearchIcon = (p: P) => <Base {...p}><Circle cx={11} cy={11} r={6.5} /><Path d="M16 16l4.5 4.5" /></Base>;
export const UndoIcon = (p: P) => <Base {...p} strokeWidth={p.strokeWidth ?? 2}><Path d="M9 14l-4-4 4-4" /><Path d="M5 10h9a5 5 0 0 1 0 10h-3" /></Base>;
export const ShareIcon = (p: P) => <Base {...p} strokeWidth={p.strokeWidth ?? 1.8}><Path d="M12 3.5v11" /><Path d="M8 7.5l4-4 4 4" /><Path d="M6 11.5H5v8.5h14v-8.5h-1" /></Base>;
export const TextSizeIcon = one('M3 18l5-12 5 12M4.8 14h6.4M14 18l3.5-8 3.5 8M15.2 15.5h4.6');

// Prayer icons (fajr, dhuhr, asr, maghrib, isha)
export const FajrIcon = one('M3.5 17h17 M7.2 17a4.8 4.8 0 0 1 9.6 0 M12 7.5v2.2 M6.2 10.4l1.5 1.5 M17.8 10.4l-1.5 1.5');
export const DhuhrIcon = one('M12 8.2a3.8 3.8 0 1 0 0 7.6a3.8 3.8 0 1 0 0-7.6 M12 3.5v2 M12 18.5v2 M3.5 12h2 M18.5 12h2 M6 6l1.4 1.4 M16.6 16.6L18 18 M6 18l1.4-1.4 M16.6 7.4L18 6');
export const AsrIcon = one('M12 6.9a3.6 3.6 0 1 0 0 7.2a3.6 3.6 0 1 0 0-7.2 M12 3.6v1.6 M4 10.5h1.6 M18.4 10.5H20 M4 19h16');
export const MaghribIcon = one('M3.5 15.5h17 M7.2 15.5a4.8 4.8 0 0 1 9.6 0 M12 5v4.2 M10 7.4l2 2 2-2 M7 19h10');
export const IshaIcon = one('M17.5 14.6A6.6 6.6 0 0 1 9.4 6.5 6.6 6.6 0 1 0 17.5 14.6z M17.6 5.2v2.4 M16.4 6.4h2.4');
export const PRAYER_ICONS = [FajrIcon, DhuhrIcon, AsrIcon, MaghribIcon, IshaIcon];
export const SunriseIcon = FajrIcon;
export const SunsetIcon = MaghribIcon;
