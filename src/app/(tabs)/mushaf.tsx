// The whole mushaf: continue free reading, or open any surah or juz.
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookIcon, SearchIcon, BookmarkIcon, CloseIcon } from '../../components/icons';
import { GlassButton, GoldButton, Panel, Segmented, Txt, useTap } from '../../components/ui';
import { ar, ORDINALS } from '../../core/plan';
import { useStore } from '../../core/store';
import { juzOf, PARTS, Q, surahName, surahsOn } from '../../quran';
import { F, usePalette } from '../../theme';

// the page where each juz begins
const JUZ_PAGES = (() => { const out: number[] = []; Q.juz.forEach((j, i) => { if (!out[j - 1]) out[j - 1] = i + 1; }); return out; })();
const norm = (s: string) => s.replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

export default function Mushaf() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const { state, toggleBookmark } = useStore();
  const marks = state.bookmarks || [];
  const W = Math.min(width, 520) - 48;
  const [view, setView] = useState<'surah' | 'juz' | 'hizb'>('surah');
  const [q, setQ] = useState('');
  const open = (page: number) => { tap('medium'); router.push({ pathname: '/reader', params: { mode: 'mushaf', page: String(page) } }); };
  const last = state.mushafPage;
  const list = useMemo(() => {
    const n = norm(q);
    return Q.surahs.map((s, i) => ({ n: i + 1, name: s[0], page: s[1], verses: s[2] }))
      .filter((s) => !n || norm(s.name).includes(n) || String(s.n) === q.trim());
  }, [q]);
  // a page number typed in the search box (Arabic or Latin digits) opens that page
  const digits = q.trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const goPage = /^\d{1,3}$/.test(digits) && +digits >= 1 && +digits <= 604 ? +digits : null;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Txt v="label">مصحف المدينة، برواية حفص عن عاصم</Txt>
          <Txt v="display">المصحف</Txt>
        </Animated.View>

        <GoldButton style={{ marginTop: 14 }} icon={<BookIcon size={22} color={p.onPrimary} />}
          label={last ? `تابع من ص ${ar(last)}، ${surahName(surahsOn(last)[0])}` : 'افتح المصحف'} onPress={() => open(last || 1)} />
        <Txt v="label" style={{ marginTop: 8 }}>قراءة حرة خارج جلسات التسبيع، وتُحفظ صفحتها وحدها.</Txt>

        {marks.length ? (
          <Panel style={{ marginTop: 16 }} padding={6}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 4 }}>
              <BookmarkIcon size={18} color={p.gold} filled />
              <Txt v="h2" style={{ fontSize: 16.5, lineHeight: 24 }}>علاماتك</Txt>
            </View>
            {marks.map((pg, i) => (
              <View key={pg} style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: i === 0 ? 0 : 1, borderTopColor: p.rule }}>
                <Pressable onPress={() => open(pg)} accessibilityRole="button" accessibilityLabel={`افتح العلامة: صفحة ${ar(pg)}، سورة ${surahName(surahsOn(pg)[0])}`}
                  style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 10, opacity: pressed ? 0.6 : 1 })}>
                  <Text allowFontScaling={false} style={{ width: 44, textAlign: 'center', fontFamily: F.title, fontSize: 16, color: p.gold }}>{ar(pg)}</Text>
                  <View style={{ flex: 1 }}>
                    <Txt v="body" style={{ fontFamily: F.uiMed }}>{`سورة ${surahName(surahsOn(pg)[0])}`}</Txt>
                    <Txt v="label">{`الجزء ${ar(juzOf(pg))}، الصفحة ${ar(pg)}`}</Txt>
                  </View>
                </Pressable>
                <Pressable onPress={() => { tap(); toggleBookmark(pg); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={`احذف علامة الصفحة ${ar(pg)}`} style={{ padding: 12 }}>
                  <CloseIcon size={16} color={p.faint} />
                </Pressable>
              </View>
            ))}
          </Panel>
        ) : (
          <Txt v="label" style={{ marginTop: 6 }}>لتضع علامة على صفحة: افتحها ثم اضغط الشريط أعلى الصفحة.</Txt>
        )}

        <View style={{ marginTop: 18, alignItems: 'flex-start' }}>
          <Segmented value={view} onChange={(v) => setView(v)} options={[{ v: 'surah', label: 'السور' }, { v: 'juz', label: 'الأجزاء' }, { v: 'hizb', label: 'الأحزاب السبعة' }]} />
        </View>

        {view === 'surah' ? (
          <>
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: p.chipBorder, backgroundColor: p.chip }}>
              <SearchIcon size={18} color={p.faint} />
              <TextInput value={q} onChangeText={setQ} placeholder="اسم سورة، أو رقم صفحة" placeholderTextColor={p.faint} accessibilityLabel="ابحث عن سورة أو اكتب رقم صفحة"
                style={{ flex: 1, fontFamily: F.ui, fontSize: 15.5, color: p.ink, textAlign: 'right', writingDirection: 'rtl', paddingVertical: 0 }} />
            </View>
            {goPage ? (
              <GlassButton style={{ marginTop: 12 }} tone="gold" label={`افتح الصفحة ${ar(goPage)}، سورة ${surahName(surahsOn(goPage)[0])}`} onPress={() => open(goPage)} />
            ) : null}
            <Panel style={{ marginTop: 12 }} padding={6}>
              {list.map((s, i) => (
                <Pressable key={s.n} onPress={() => open(s.page)} accessibilityRole="button" accessibilityLabel={`سورة ${s.name}، صفحة ${ar(s.page)}`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 10, opacity: pressed ? 0.6 : 1, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: p.rule })}>
                  <Text allowFontScaling={false} style={{ width: 34, textAlign: 'center', fontFamily: F.title, fontSize: 16, color: p.gold }}>{ar(s.n)}</Text>
                  <View style={{ flex: 1 }}>
                    <Txt v="body" style={{ fontFamily: F.uiMed }}>{`سورة ${s.name}`}</Txt>
                    <Txt v="label">{`${ar(s.verses)} آية، الجزء ${ar(juzOf(s.page))}`}</Txt>
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 13, color: p.muted }}>{`ص ${ar(s.page)}`}</Text>
                </Pressable>
              ))}
              {!list.length ? <Txt v="meta" align="center" style={{ paddingVertical: 18 }}>لا توجد سورة بهذا الاسم</Txt> : null}
            </Panel>
          </>
        ) : view === 'hizb' ? (
          <Panel style={{ marginTop: 12 }} padding={6}>
            {PARTS.map((part, d) => (
              <Pressable key={d} onPress={() => open(part.pages[0])} accessibilityRole="button" accessibilityLabel={`الحزب ${ORDINALS[d]}: ${part.name}، صفحة ${ar(part.pages[0])}`}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, opacity: pressed ? 0.6 : 1, borderTopWidth: d === 0 ? 0 : 1, borderTopColor: p.rule })}>
                <Text allowFontScaling={false} style={{ width: 34, textAlign: 'center', fontFamily: F.title, fontSize: 16, color: p.gold }}>{ar(d + 1)}</Text>
                <View style={{ flex: 1 }}>
                  <Txt v="body" style={{ fontFamily: F.uiMed }}>{part.name}</Txt>
                  <Txt v="label">{`الحزب ${ORDINALS[d]}، ${ar(part.pages[1] - part.pages[0] + 1)} صفحة`}</Txt>
                </View>
                <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 13, color: p.muted }}>{`ص ${ar(part.pages[0])}`}</Text>
              </Pressable>
            ))}
          </Panel>
        ) : (
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {JUZ_PAGES.map((pg, j) => (
              <Pressable key={j} onPress={() => open(pg)} accessibilityRole="button" accessibilityLabel={`الجزء ${ar(j + 1)}، صفحة ${ar(pg)}`}
                style={({ pressed }) => ({ width: (W - 30) / 4, height: 68, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.chipBorder, backgroundColor: pressed ? p.turqSoft : p.chip })}>
                <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 20, color: p.ink }}>{ar(j + 1)}</Text>
                <Text allowFontScaling={false} style={{ fontFamily: F.ui, fontSize: 11, color: p.muted }}>{`ص ${ar(pg)}`}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
