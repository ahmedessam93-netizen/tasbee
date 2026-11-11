// Keeping the recitation of a part on the phone, to listen with no connection.
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { download, have, offlineSupported, remove } from '../core/offline';
import { ar, ORDINALS } from '../core/plan';
import { filesOfPart } from '../core/recite';
import { PARTS } from '../quran';
import { F, usePalette } from '../theme';
import { CheckIcon } from './icons';
import { Meter } from './dash';
import { Txt, useTap } from './ui';

type St = { got: number; total: number; busy: boolean; failed?: boolean; ask?: boolean };

export function RecitationDownloads() {
  const p = usePalette(); const tap = useTap();
  const [st, setSt] = useState<Record<number, St>>({});
  const cancel = useRef<Record<number, boolean>>({});
  const alive = useRef(true);
  const set = (d: number, x: Partial<St>) => { if (alive.current) setSt((s) => ({ ...s, [d]: { ...(s[d] || { got: 0, total: 0, busy: false }), ...x } })); };

  useEffect(() => {
    alive.current = true;
    (async () => { for (let d = 0; d < PARTS.length; d++) { const files = filesOfPart(d); set(d, { got: await have(files), total: files.length }); } })();
    return () => { alive.current = false; Object.keys(cancel.current).forEach((k) => { cancel.current[+k] = true; }); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!offlineSupported()) return <Txt v="label" style={{ paddingVertical: 12 }}>الحفظ للاستماع بلا إنترنت غير متاح في هذا المتصفح.</Txt>;

  const press = async (d: number) => {
    tap(); const s = st[d]; if (!s) return; const files = filesOfPart(d);
    if (s.busy) { cancel.current[d] = true; return; }
    if (s.got >= s.total) {
      if (!s.ask) { set(d, { ask: true }); return; }
      await remove(files); set(d, { got: await have(files), ask: false }); return;
    }
    cancel.current[d] = false; set(d, { busy: true, failed: false });
    const ok = await download(files, (got, total) => set(d, { got, total }), () => !!cancel.current[d]);
    set(d, { busy: false, failed: !ok && !cancel.current[d], got: await have(files) });
  };

  return (
    <View>
      {PARTS.map((part, d) => {
        const s = st[d]; const full = !!s && s.total > 0 && s.got >= s.total; const some = !!s && s.got > 1 && !full;
        const label = !s ? '' : s.busy ? `إيقاف (${ar(Math.floor((s.got / Math.max(1, s.total)) * 100))}٪)` : full ? (s.ask ? 'اضغط للحذف' : 'محفوظ') : s.failed ? 'أعد المحاولة' : some ? 'أكمل التنزيل' : 'تنزيل';
        return (
          <Pressable key={d} onPress={() => press(d)} accessibilityRole="button" accessibilityLabel={`تلاوة الحزب ${ORDINALS[d]}: ${label}`}
            style={({ pressed }) => ({ paddingVertical: 13, opacity: pressed ? 0.6 : 1, borderTopWidth: d === 0 ? 0 : 1, borderTopColor: p.rule })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt v="body" numberOfLines={1} style={{ fontFamily: F.uiMed }}>{`الحزب ${ORDINALS[d]}`}</Txt>
                <Txt v="label" numberOfLines={1}>{part.name}</Txt>
              </View>
              {full && !s.ask ? <CheckIcon size={18} color={p.gold} /> : null}
              <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiBold, fontSize: 13.5, color: full ? (s.ask ? p.danger : p.gold) : s && s.failed ? p.danger : p.turqHi }}>{label}</Text>
            </View>
            {s && (s.busy || some) ? <View style={{ marginTop: 9 }}><Meter frac={s.got / Math.max(1, s.total)} color={p.turq} height={5} /></View> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
