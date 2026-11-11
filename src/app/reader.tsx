// The reader. Two modes:
//  - a day's part (default): its five sittings in order, with a short pause screen between them.
//    Pages are fixed per sitting; a page shared by two sittings shows the other sitting's words faint.
//  - the whole mushaf (mode=mushaf): all 604 pages, free reading from the saved page.
// Your place is saved once you stay on a page for a moment, and whenever you leave.
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon, CloseIcon, BookmarkIcon } from '../components/icons';
import { MushafPage } from '../components/MushafPage';
import { Shamsa } from '../components/ornaments';
import { Pager, PagerHandle } from '../components/Pager';
import { Bar, GlassButton, GoldButton, IconButton, Sky, Txt, useTap } from '../components/ui';
import { leave } from '../core/nav';
import { ar, fmtTime, itemsFor, MN, ORDINALS, PG, planForDay, RItem, sitLabel, sitPages, weekComplete } from '../core/plan';
import { useStore } from '../core/store';
import { juzOf, minutesFor, surahName, surahsOn } from '../quran';
import { loadPage } from '../quran/fonts';
import { F, usePalette } from '../theme';

function KeepAwake() { useKeepAwake(); return null; }
const DWELL = 2500;

type Item = { kind: 'page'; it: RItem } | { kind: 'stop'; k: number } | { kind: 'fin' };

function Done({ title, line, primary, onPrimary, secondary, onSecondary }: { title: string; line: string; primary: string; onPrimary: () => void; secondary?: string; onSecondary?: () => void }) {
  const insets = useSafeAreaInsets(); const { width, height } = useWindowDimensions(); const p = usePalette();
  const s = Math.min(width - 90, 280, height * 0.34);
  return (
    <View style={{ flex: 1 }}>
      <Sky glowAt={height * 0.3} />
      <View style={{ flex: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 28, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <Animated.View entering={FadeIn.duration(900)}><Shamsa size={s} /></Animated.View>
          <Txt v="display" align="center" style={{ fontSize: 30, lineHeight: 44, marginTop: 18 }}>{title}</Txt>
          <Text maxFontSizeMultiplier={1.3} style={{ fontFamily: F.serif, fontSize: 21, lineHeight: 34, color: p.ink, textAlign: 'center' }}>تقبّل الله منك</Text>
          <Txt v="meta" align="center" style={{ marginTop: 8, fontSize: 15, lineHeight: 24 }}>{line}</Txt>
        </View>
        <View style={{ alignSelf: 'stretch', gap: 12, maxWidth: 480, width: '100%' }}>
          <GoldButton label={primary} onPress={onPrimary} />
          {secondary && onSecondary ? <GlassButton label={secondary} onPress={onSecondary} /> : null}
        </View>
      </View>
    </View>
  );
}

export default function Reader() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ day?: string; seg?: string; at?: string; mode?: string; page?: string }>();
  const free = params.mode === 'mushaf';
  const { state, finishSitting, setPlace, countKhatma, setMushafPage, toggleBookmark } = useStore();

  const P = useMemo(() => planForDay(state, params.day || null, new Date()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const items: Item[] = useMemo(() => {
    if (free) return Array.from({ length: 604 }, (_, i) => ({ kind: 'page' as const, it: { key: `m:${i + 1}`, k: -1, page: i + 1, from: 0, to: 1e9, first: i === 0, last: i === 603 } }));
    const its = itemsFor(P.part); const out: Item[] = [];
    its.forEach((it, i) => {
      out.push({ kind: 'page', it });
      const nx = its[i + 1];
      if (nx && nx.k !== it.k) out.push({ kind: 'stop', k: it.k });
    });
    out.push({ kind: 'fin' });
    return out;
  }, [P, free]);

  const startItem = useMemo(() => {
    const f = (fn: (x: Item) => boolean) => items.findIndex(fn);
    let i = -1;
    if (free) i = Number(params.page || state.mushafPage || 1) - 1;
    else if (params.seg != null) i = f((x) => x.kind === 'page' && x.it.k === Number(params.seg));
    else if (params.at) i = f((x) => x.kind === 'page' && x.it.key === params.at);
    else if (P.at) i = f((x) => x.kind === 'page' && x.it.key === P.at);
    if (i < 0 && !free) i = f((x) => x.kind === 'page' && !P.done[x.it.k]);
    return Math.max(0, Math.min(items.length - 1, i));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pager = useRef<PagerHandle>(null);
  const [idx, setIdx] = useState(startItem); const idxRef = useRef(startItem);

  // get the coming pages ready, so turning a page never waits
  useEffect(() => {
    for (let j = idx; j < Math.min(items.length, idx + 8); j++) { const x = items[j]; if (x.kind === 'page') loadPage(x.it.page); }
    for (let j = Math.max(0, idx - 2); j < idx; j++) { const x = items[j]; if (x.kind === 'page') loadPage(x.it.page); }
  }, [idx, items]);

  // ---- saving your place ----
  const shownAt = useRef(Date.now());
  const dwell = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePlace = useCallback((i: number) => {
    const x = items[i]; if (!x || x.kind !== 'page') return;
    if (free) setMushafPage(x.it.page); else setPlace(P.key, x.it.key);
  }, [items, P.key, free, setPlace, setMushafPage]);
  const startDwell = useCallback((i: number) => {
    if (dwell.current) clearTimeout(dwell.current);
    shownAt.current = Date.now();
    if (items[i]?.kind === 'page') dwell.current = setTimeout(() => { dwell.current = null; savePlace(i); }, DWELL);
  }, [items, savePlace]);
  const flush = useCallback(() => {
    if (dwell.current && Date.now() - shownAt.current >= 1500) { clearTimeout(dwell.current); dwell.current = null; savePlace(idxRef.current); }
  }, [savePlace]);
  const flushRef = useRef(flush); flushRef.current = flush;
  useEffect(() => {
    startDwell(startItem);
    const sub = AppState.addEventListener('change', (st) => { if (st !== 'active') flushRef.current(); });
    const onHide = () => flushRef.current();
    if (Platform.OS === 'web' && typeof window !== 'undefined') { window.addEventListener('pagehide', onHide); document.addEventListener('visibilitychange', onHide); }
    return () => {
      flushRef.current(); sub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') { window.removeEventListener('pagehide', onHide); document.removeEventListener('visibilitychange', onHide); }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const close = () => { flush(); leave(free ? '/mushaf' : '/'); };

  // The page is shown alone, like a printed mushaf. The controls appear for a moment when the
  // reader opens, and whenever the page is tapped; turning the page hides them again.
  const chrome = useSharedValue(1);
  const [chromeOn, setChromeOn] = useState(true);
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showChrome = useCallback((on: boolean) => {
    if (hideT.current) { clearTimeout(hideT.current); hideT.current = null; }
    chrome.value = withTiming(on ? 1 : 0, { duration: 220 }); setChromeOn(on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { hideT.current = setTimeout(() => showChrome(false), 2200); return () => { if (hideT.current) clearTimeout(hideT.current); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleChrome = useCallback(() => showChrome(!chromeOn), [chromeOn, showChrome]);
  const chromeSt = useAnimatedStyle(() => ({ opacity: chrome.value }));

  const [khatmaNew, setKhatmaNew] = useState(false);
  const onSelected = (i: number) => {
    const from = idxRef.current;
    // going back never stops on a "sitting done" screen
    if (items[i].kind === 'stop' && i < from) { setTimeout(() => pager.current?.setPage(i - 1), 0); return; }
    setIdx(i); idxRef.current = i; tap();
    startDwell(i);
    const x = items[i];
    if (x.kind === 'stop') {
      const nx = items[i + 1];
      finishSitting(P.key, x.k, nx && nx.kind === 'page' ? nx.it.key : undefined);
      tap('success');
    }
    if (x.kind === 'fin') {
      finishSitting(P.key, 4);
      tap('success');
    }
    // the controls stay out of the way while reading; on the pause screens there are none
    if (chromeOn) showChrome(false);
  };
  // when the last sitting of the week is done, the khatma is complete
  const cur = items[idx];
  useEffect(() => {
    if (free || cur.kind !== 'fin') return;
    if (weekComplete(state, P) && countKhatma(P.cycle)) setKhatmaNew(true);
  }, [cur.kind, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => pager.current?.setPage(Math.min(idx + 1, items.length - 1));
  const prev = () => pager.current?.setPage(Math.max(idx - 1, 0));

  // the page uses the whole screen (inside the phone's own status and navigation bars)
  const pageW = Math.min(width, 640);
  const pageH = height - insets.top - insets.bottom;

  const k = cur.kind === 'page' ? cur.it.k : cur.kind === 'stop' ? cur.k : 4;
  const group = items.filter((x): x is { kind: 'page'; it: RItem } => x.kind === 'page' && x.it.k === k);
  const pos = cur.kind === 'page' ? group.findIndex((x) => x.it.key === cur.it.key) : group.length;
  const pageNo = cur.kind === 'page' ? cur.it.page : 0;
  const isLastOfSeg = !free && cur.kind === 'page' && cur.it.last;
  const nextLabel = isLastOfSeg ? (k === 4 ? 'إتمام الحزب' : 'إتمام الجلسة') : 'التالية';
  const otherDay = !!params.day && params.day !== planForDay(state, null, new Date()).key;
  const names = cur.kind === 'page' ? surahsOn(pageNo).map((n) => `سورة ${surahName(n)}`).join('، ') : '';
  const title = free ? names : `${otherDay ? `${P.dayName}، ` : ''}جلسة ${P.wins[k]?.name ?? ''}`;
  const sub = cur.kind === 'page' ? (free ? `الجزء ${ar(juzOf(pageNo))}، الصفحة ${ar(pageNo)}` : `${names}، الصفحة ${ar(pageNo)}`) : '';

  const stopInfo = (k0: number) => {
    const nk = k0 + 1; const nw = P.wins[nk];
    const now = new Date(); let curK = -1;
    P.wins.forEach((w, j) => { if (w.time && w.time <= now) curK = j; });
    const done = state.days[P.key]?.done || {};
    let when: string;
    if (otherDay || !nw.time) when = `التالية جلسة ${nw.name}. ولك أن تكملها الآن.`;
    else if (nw.time > now) when = `التالية جلسة ${nw.name}، بعد ${nw.name} ${fmtTime(nw.time)}. ولك أن تكملها الآن.`;
    else if (curK <= nk) when = `حان وقت جلسة ${nw.name}، فأكملها الآن إن شئت.`;
    else {
      const behind = [0, 1, 2, 3, 4].filter((j) => j >= nk && j < curK && !done[j]).map((j) => P.wins[j].name);
      const names = behind.length ? behind : [nw.name];
      when = `دخل وقت ${P.wins[curK].name}، وما زالت قبله ${names.length > 1 ? 'جلسات' : 'جلسة'} ${names.join('، ')}. أكملها الآن إن شئت.`;
    }
    return { title: `أتممتَ جلسة ${P.wins[k0].name}`, line: `${sitLabel(P.part, nk)}: ${PG(sitPages(P.part, nk))}، نحو ${MN(minutesFor(P.part.sittings[nk].w))}.\n${when}`, cont: `أكمل: جلسة ${nw.name}` };
  };
  const finInfo = () => {
    const done = state.days[P.key]?.done || {};
    const missing = [0, 1, 2, 3, 4].filter((j) => !done[j]).map((j) => P.wins[j].name);
    if (missing.length) return { title: `أتممتَ جلسة ${P.wins[4].name}`, line: `بقي من الحزب ${ORDINALS[P.d]}: ${missing.length > 1 ? 'جلسات' : 'جلسة'} ${missing.join('، ')}. اضغطها في الصفحة الرئيسية متى شئت.` };
    if (khatmaNew) return { title: 'ختمتَ القرآن الكريم', line: `ختمة رقم ${ar(state.khatma.count)}. اللهم اجعل القرآن العظيم ربيع قلوبنا.` };
    return { title: `تمّ الحزب ${ORDINALS[P.d]}`, line: P.d === 6 ? 'بقيت أحزاب من هذا الأسبوع لم تكتمل، فأتمّها لتكتمل الختمة.' : `الحزب ${ORDINALS[(P.d + 1) % 7]} غدًا بعد الفجر.` };
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.pageBg }}>
      {state.settings.wake !== false && Platform.OS !== 'web' && <KeepAwake />}
      <Pager ref={pager} style={{ flex: 1 }} paper={p.pageBg} initialPage={startItem} onPageSelected={onSelected}>
        {items.map((x, i) => {
          if (x.kind === 'page') {
            return (
              <View key={x.it.key} style={{ flex: 1 }}>
                {Math.abs(i - idx) <= 1 ? (
                  <Pressable onPress={toggleChrome} accessible={false} style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, alignItems: 'center' }}>
                    <MushafPage page={x.it.page} width={pageW} height={pageH} ink={p.pageInk} faint={p.dark ? 'rgba(240,228,203,0.22)' : 'rgba(27,36,54,0.2)'} gold={p.gold} muted={p.muted}
                      from={free ? undefined : x.it.from} to={free ? undefined : x.it.to} />
                  </Pressable>
                ) : null}
              </View>
            );
          }
          if (x.kind === 'stop') {
            return (
              <View key={`stop${x.k}`} style={{ flex: 1 }}>
                {Math.abs(idx - i) <= 1 ? (() => { const d = stopInfo(x.k); return <Done title={d.title} line={d.line} primary={d.cont} onPrimary={next} secondary="يكفي الآن" onSecondary={close} />; })() : null}
              </View>
            );
          }
          return (
            <View key="fin" style={{ flex: 1 }}>
              {Math.abs(idx - i) <= 1 ? (() => {
                const d = finInfo();
                return khatmaNew
                  ? <Done title={d.title} line={d.line} primary="دعاء ختم القرآن" onPrimary={() => { flush(); router.replace('/khatma'); }} secondary="العودة" onSecondary={close} />
                  : <Done title={d.title} line={d.line} primary="العودة" onPrimary={close} />;
              })() : null}
            </View>
          );
        })}
      </Pager>

      {cur.kind === 'page' && (
        <Animated.View pointerEvents={chromeOn ? 'box-none' : 'none'} style={[{ position: 'absolute', top: insets.top + 8, left: 12, right: 12 }, chromeSt]}>
          <Bar radius={22}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 7 }}>
              <IconButton label="إغلاق" onPress={close}><CloseIcon size={20} color={p.ink} /></IconButton>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.display, fontSize: 16.5, lineHeight: 23, color: p.ink, textAlign: 'right' }}>{title}</Text>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, color: p.muted, textAlign: 'right' }}>{sub}</Text>
              </View>
              <IconButton label={(state.bookmarks || []).includes(pageNo) ? 'إزالة العلامة عن هذه الصفحة' : 'ضع علامة على هذه الصفحة'} onPress={() => { toggleBookmark(pageNo); showChrome(true); }}>
                <BookmarkIcon size={20} color={(state.bookmarks || []).includes(pageNo) ? p.gold : p.ink} filled={(state.bookmarks || []).includes(pageNo)} />
              </IconButton>
            </View>
          </Bar>
        </Animated.View>
      )}

      {cur.kind === 'page' && (
        <Animated.View pointerEvents={chromeOn ? 'box-none' : 'none'} style={[{ position: 'absolute', bottom: insets.bottom + 10, left: 12, right: 12 }, chromeSt]}>
          <Bar radius={24}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
              {free ? null : <Pressable onPress={() => { tap(); prev(); }} disabled={idx === 0} accessibilityRole="button" accessibilityLabel="الصفحة السابقة" hitSlop={6}
                style={({ pressed }) => ({ width: 48, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', opacity: idx === 0 ? 0.35 : pressed ? 0.7 : 1, backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder })}>
                <ChevronIcon dir="right" size={20} color={p.ink} strokeWidth={2.2} />
              </Pressable>}
              <View style={{ flex: 1 }} accessible accessibilityLabel={free ? `صفحة ${ar(pageNo)} من ٦٠٤` : `الصفحة ${ar(pos + 1)} من ${ar(group.length)} في الجلسة`}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: p.chip, overflow: 'hidden', flexDirection: 'row', direction: 'rtl' }}>
                  <View style={{ width: `${Math.round(((free ? pageNo : pos + 1) / (free ? 604 : group.length)) * 100)}%`, backgroundColor: p.turq }} />
                </View>
                <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.ui, fontSize: 12.5, lineHeight: 18, marginTop: 5, color: p.muted, textAlign: 'right' }}>
                  {free ? `صفحة ${ar(pageNo)} من ٦٠٤` : `${ar(pos + 1)} من ${ar(group.length)}${isLastOfSeg ? '، آخر صفحة في الجلسة' : ''}`}
                </Text>
              </View>
              {free ? null : <Pressable onPress={() => { tap('medium'); next(); }} accessibilityRole="button" accessibilityLabel={nextLabel}>
                {({ pressed }) => (
                  <LinearGradient colors={p.primary} locations={[0, 0.48, 1]} style={{ height: 50, paddingHorizontal: 18, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.85 : 1 }}>
                    <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiBold, fontSize: 15.5, color: p.onPrimary }}>{nextLabel}</Text>
                    <ChevronIcon size={18} color={p.onPrimary} strokeWidth={2.2} />
                  </LinearGradient>
                )}
              </Pressable>}
            </View>
          </Bar>
        </Animated.View>
      )}
    </View>
  );
}
