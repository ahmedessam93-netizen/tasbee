// Android home-screen widgets, in the app's lapis night style.
//  small  (2×2): progress ring + current sitting
//  medium (4×2): today's part, the current sitting's surahs, progress ring
import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { Snapshot } from '../core/plan';

const F = { title: 'Amiri_700Bold', kufi: 'ReemKufi_600SemiBold', ui: 'IBMPlexSansArabic_500Medium', uiReg: 'IBMPlexSansArabic_400Regular' };
const C = {
  bgFrom: 'rgba(19, 35, 80, 0.97)' as const,
  bgTo: 'rgba(7, 12, 26, 0.97)' as const,
  rim: 'rgba(226, 188, 106, 0.32)' as const,
  line: 'rgba(226, 188, 106, 0.2)' as const,
  ivory: '#F3EAD7' as const,
  muted: 'rgba(243, 234, 215, 0.66)' as const,
  gold: '#E9C677' as const,
  turq: '#7FE3D7' as const,
};

/** A ring of seven arcs would mean seven days; here one ring is today's part. */
function ringSvg(size: number, frac: number, complete: boolean) {
  const r = size / 2 - 7; const c = size / 2; const L = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, frac));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(226,188,106,0.22)" stroke-width="6"/>
<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${complete ? '#E9C677' : '#7FE3D7'}" stroke-width="6" stroke-linecap="round"
 stroke-dasharray="${(L * f).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>
<text x="${c}" y="${c + size * 0.09}" text-anchor="middle" font-size="${size * 0.26}" fill="#F3EAD7" font-family="serif">۞</text>
</svg>`;
}

export function TasbeeWidget({ s, size = 'medium' }: { s: Snapshot; size?: 'small' | 'medium' }) {
  const shell = {
    height: 'match_parent' as const, width: 'match_parent' as const,
    backgroundGradient: { from: C.bgFrom, to: C.bgTo, orientation: 'TOP_BOTTOM' as const },
    borderRadius: 28, borderWidth: 1, borderColor: C.rim,
  };
  if (size === 'small') {
    return (
      <FlexWidget clickAction="OPEN_APP" style={{ ...shell, padding: 10, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <SvgWidget svg={ringSvg(84, s.progress, s.complete)} style={{ width: 84, height: 84 }} />
        <TextWidget text={s.complete ? 'تمّ حزب اليوم' : s.title} style={{ fontFamily: F.kufi, fontSize: 14, color: s.complete ? C.gold : C.ivory, textAlign: 'center', marginTop: 4 }} />
        <TextWidget text={s.detail} maxLines={1} truncate="END" style={{ fontFamily: F.uiReg, fontSize: 10.5, color: C.muted, textAlign: 'center' }} />
      </FlexWidget>
    );
  }
  return (
    <FlexWidget clickAction="OPEN_APP" style={{ ...shell, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }}>
      <FlexWidget style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 8 }}>
        <TextWidget text={s.day} style={{ fontFamily: F.ui, fontSize: 12, color: C.gold, textAlign: 'right' }} />
        <TextWidget text={s.complete ? 'تمّ حزب اليوم، تقبّل الله' : s.title} style={{ fontFamily: F.kufi, fontSize: 17, color: C.ivory, textAlign: 'right' }} />
        <TextWidget text={s.detail} maxLines={2} truncate="END" style={{ fontFamily: F.title, fontSize: 14, color: C.ivory, textAlign: 'right', lineHeight: 22 }} />
        <FlexWidget style={{ height: 1, width: 'match_parent', backgroundColor: C.line, marginTop: 6, marginBottom: 4 }} />
        <TextWidget text={s.next ? `التالية: ${s.next}` : ''} style={{ fontFamily: F.uiReg, fontSize: 11, color: C.turq, textAlign: 'right' }} />
      </FlexWidget>
      <SvgWidget svg={ringSvg(92, s.progress, s.complete)} style={{ width: 92, height: 92 }} />
    </FlexWidget>
  );
}
