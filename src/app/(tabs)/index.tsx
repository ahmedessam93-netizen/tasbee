import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookIcon, BookmarkIcon, ChevronIcon, LampIcon, PinIcon, PRAYER_ICONS, StarIcon } from '../../components/icons';
import { Head, HeroButton, HeroCard, SitRow, StripDay, Tiles, Timeline, WeekStrip } from '../../components/dash';
import { Panel, Stat, Txt, useTap } from '../../components/ui';
import { addDays, ar, DAY_NAMES, dkey, fmtTime, MN, ORDINALS, PG, plan, sitLabel, sitPages, streak, weekOf } from '../../core/plan';
import { useStore, useViewPlan } from '../../core/store';
import { useUpdate } from '../../core/update';
import { minutesFor } from '../../quran';
import { F, usePalette } from '../../theme';

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function hijri(d: Date) {
  try { return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/\s?هـ$/, ''); } catch { return ''; }
}
const pages = (lines: number) => Math.round(lines / 15);
const SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export default function Today() {
  const p = usePalette(); const P = useViewPlan(); const { state, now, setViewDay } = useStore(); const tap = useTap();
  const todayKey = useMemo(() => plan(state, now).key, [state, now]);
  const isToday = P.key === todayKey;
  const isPast = !isToday && P.key < todayKey;
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const update = useUpdate();
  const W = Math.min(width, 520) - 48;

  const read = (params: Record<string, string>) => { tap('medium'); router.push({ pathname: '/reader', params: { day: P.key, ...params } }); };
  const cont = () => read({});
  const openSitting = (k: number) => read({ seg: String(k) });
  const [ty, tm, td] = todayKey.split('-').map(Number);
  const offset = Math.round((+new Date(P.date) - +new Date(ty, tm - 1, td)) / 864e5);

  const w = P.wins[P.nextIdx];
  const isLast = P.nextIdx === 4;
  const placePage = P.at ? Number(P.at.split(':')[1]) : null;
  const contLabel = placePage ? `تابع من ص ${ar(placePage)}` : `ابدأ الحزب ${ORDINALS[P.d]}`;
  const portion = P.part.sittings[P.nextIdx];
  let eyebrow = '', title = '', line = '', cta = '', secondary = false, eyeTone: 'now' | 'done' | 'plain' = 'now';
  if (!isToday && !P.complete) {
    eyebrow = isPast ? (P.readW > 0 ? 'يوم سابق لم يكتمل' : 'يوم سابق') : 'يوم قادم';
    title = `الحزب ${ORDINALS[P.d]}`;
    line = isPast ? `بقي ${PG(Math.max(1, pages(P.left)))}، اقرأها متى شئت.` : `${PG(pages(P.total))}، يبدأ بعد فجر ذلك اليوم. يمكنك قراءته الآن إن شئت.`;
    cta = contLabel; eyeTone = 'plain';
  } else if (P.complete) { eyebrow = 'اكتمل حزب اليوم'; title = `تمّ الحزب ${ORDINALS[P.d]}`; line = isToday ? 'تقبّل الله. حزب الغد يبدأ بعد الفجر.' : 'تقبّل الله.'; eyeTone = 'done'; }
  else if (P.curDone && P.nextIdx > P.cur) { eyebrow = `أتممت جلسة ${P.wins[P.cur].name}`; title = `القادمة: جلسة ${w.name}`; line = `بعد صلاة ${w.name}، ${fmtTime(w.time)}`; cta = contLabel; secondary = true; eyeTone = 'done'; }
  else {
    eyebrow = `الآن، بعد صلاة ${w.name}`;
    title = isLast ? `جلسة ${w.name}، الأخيرة` : `جلسة ${w.name}`;
    line = `${sitLabel(P.part, P.nextIdx)}\n${PG(sitPages(P.part, P.nextIdx))}، نحو ${MN(minutesFor(portion.w))}`;
    cta = contLabel;
  }

  // the five sittings of the day, one after each prayer
  const rows: SitRow[] = P.wins.map((x, k) => {
    const done = P.complete || !!P.done[k];
    const passed = isPast || (isToday && !!x.time && x.time <= now);
    const st: SitRow['state'] = done ? 'done' : !isToday ? (isPast ? 'missed' : 'upcoming') : k === P.nextIdx ? 'now' : passed && k < P.cur ? 'missed' : 'upcoming';
    return { key: String(k), Icon: PRAYER_ICONS[k], title: `جلسة ${x.name}`, sub: `${sitLabel(P.part, k)}، ${PG(sitPages(P.part, k))}`,
      right: st === 'done' ? 'تمّ' : st === 'now' ? 'الآن' : st === 'missed' ? 'فاتت' : x.time ? fmtTime(x.time) : `ص ${ar(P.part.sittings[k].from[0])}`, state: st, onPress: () => openSitting(k),
      a11y: `جلسة ${x.name}: ${sitLabel(P.part, k)}` };
  });

  const week = weekOf(state, P);
  const weekDone = week.filter((x) => x.full).length;
  const run = useMemo(() => streak(state, plan(state, now)), [state, now]);
  // the parts of this week that were left unfinished on their days
  const missed = isToday ? week.filter((x) => !x.full && x.key < P.key) : [];
  const strip: StripDay[] = week.map((x) => ({ key: x.key, name: SHORT[x.date.getDay()], num: ar(x.d + 1), frac: x.n / 5, full: x.full, today: x.key === todayKey, selected: x.key === P.key,
    a11y: `الحزب ${ORDINALS[x.d]}، ${DAY_NAMES[x.date.getDay()]}${x.key === todayKey ? '، اليوم' : ''}${x.full ? '، مكتمل' : ''}` }));
  const city = state.settings.cityName || '';
  const g = P.date;
  const dateLine = [hijri(g), `${ar(g.getDate())} ${MONTHS[g.getMonth()]}`].filter(Boolean).join('، ');

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 150, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        {/* header: the date, the day's part, the city */}
        <Animated.View entering={FadeInDown.duration(500)} style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt v="label">{offset === 0 ? dateLine : `${offset === -1 ? 'أمس' : offset === 1 ? 'غدًا' : offset < 0 ? 'يوم سابق' : 'يوم قادم'}، ${dateLine}`}</Txt>
            <Txt v="display" numberOfLines={1} adjustsFontSizeToFit>{`الحزب ${ORDINALS[P.d]}`}</Txt>
            <Txt v="meta" numberOfLines={1}>{P.part.name}</Txt>
          </View>
          {city ? (
            <Pressable onPress={() => { tap(); router.push('/city'); }} accessibilityRole="button" accessibilityLabel={`المدينة: ${city}`}
              style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: p.chipBorder, backgroundColor: p.chip }}>
              <PinIcon size={14} color={p.gold} />
              <Text maxFontSizeMultiplier={1.15} numberOfLines={1} style={{ fontFamily: F.ui, fontSize: 13, color: p.muted, maxWidth: 120 }}>{city}</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {/* the seven parts of the week: tap one to open it */}
        <Animated.View entering={FadeInDown.delay(40).duration(500)}>
          <WeekStrip days={strip} onPick={(k) => setViewDay(k === todayKey ? null : k)} />
        </Animated.View>

        {update ? (
          <Pressable onPress={() => { tap(); Linking.openURL(update.url); }} accessibilityRole="button" accessibilityLabel="تحديث التطبيق"
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: p.turqSoft, borderWidth: 1, borderColor: p.turq }}>
            <View style={{ flex: 1 }}>
              <Txt v="h3" style={{ fontSize: 15 }}>{`إصدار جديد (${update.version})`}</Txt>
              <Txt v="label">{update.notes || 'اضغط للتحميل، وسيبقى تقدّمك كما هو.'}</Txt>
            </View>
            <Text style={{ fontFamily: F.uiBold, fontSize: 14, color: p.turqHi }}>تحديث</Text>
          </Pressable>
        ) : null}

        {/* the day's card: what is due now, how far along, and the way in */}
        <Animated.View entering={FadeInDown.delay(80).duration(600)}>
          <HeroCard style={{ marginTop: 16 }} eyebrow={eyebrow} tone={eyeTone} title={title} line={line} done={P.complete}
            frac={P.total ? P.readW / P.total : 0} big={ar(Math.max(1, pages(P.left)))} small={P.readW > 0 ? 'صفحة باقية' : 'صفحة'}>
            {cta && !secondary ? <HeroButton label={cta} icon={<BookIcon size={22} color="#2A1D07" />} onPress={cont} /> : null}
            {cta && secondary ? <HeroButton quiet label={cta} onPress={cont} /> : null}
            {P.complete ? <HeroButton quiet label="مراجعة ما قرأت" onPress={() => read({ seg: '0' })} /> : null}
          </HeroCard>
          {!isToday ? (
            <Pressable onPress={() => { tap(); setViewDay(null); }} accessibilityRole="button"
              style={{ marginTop: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: p.turqSoft, borderWidth: 1, borderColor: p.turq }}>
              <Text style={{ fontFamily: F.uiBold, fontSize: 13.5, color: p.turqHi }}>العودة إلى اليوم</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {/* a row of small facts: the run of days, this week, the khatmas */}
        <Animated.View entering={FadeInDown.delay(130).duration(600)}>
          <Panel style={{ marginTop: 16 }} padding={8}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Stat value={ar(run)} label={run === 1 ? 'يوم متتالٍ' : 'أيام متتالية'} tone={run > 0 ? 'gold' : undefined} />
              <View style={{ width: 1, height: 34, backgroundColor: p.rule }} />
              <Stat value={`${ar(weekDone)} / ٧`} label="أحزاب هذا الأسبوع" tone={weekDone > 0 ? 'now' : undefined} />
              <View style={{ width: 1, height: 34, backgroundColor: p.rule }} />
              <Stat value={ar(state.khatma.count)} label="ختمات مكتملة" />
            </View>
          </Panel>
        </Animated.View>

        {/* the day's sittings */}
        <Animated.View entering={FadeInDown.delay(180).duration(600)}>
          <Head title="جلسات اليوم" />
          <Panel padding={14}>
            <View style={{ paddingVertical: 6 }}><Timeline rows={rows} /></View>
          </Panel>
        </Animated.View>

        {missed.length ? (
          <Animated.View entering={FadeInDown.delay(220).duration(600)}>
            <Head title="ما فاتك هذا الأسبوع" />
            <Panel>
              {missed.map((x, i) => (
                <Pressable key={x.key} onPress={() => { tap(); setViewDay(x.key); }} accessibilityRole="button" accessibilityLabel={`افتح الحزب ${ORDINALS[x.d]}، ${DAY_NAMES[x.date.getDay()]}`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, opacity: pressed ? 0.6 : 1, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: p.rule })}>
                  <View style={{ flex: 1 }}>
                    <Txt v="body" style={{ fontFamily: F.uiMed }}>{`الحزب ${ORDINALS[x.d]}: ${x.part.name}`}</Txt>
                    <Txt v="label">{`${DAY_NAMES[x.date.getDay()]}، ${x.n ? `قرأت ${ar(x.n)} من ٥ جلسات` : 'لم يبدأ'}`}</Txt>
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: F.uiBold, fontSize: 13.5, color: p.turqHi }}>اقرأه</Text>
                  <ChevronIcon size={16} color={p.faint} />
                </Pressable>
              ))}
            </Panel>
          </Animated.View>
        ) : null}

        {/* shortcuts */}
        <Animated.View entering={FadeInDown.delay(260).duration(600)}>
          <Head title="المزيد" />
          <Tiles items={[
            { key: 'mushaf', icon: <BookIcon size={22} color={p.goldLight} />, title: 'المصحف', sub: state.mushafPage ? `تابع من الصفحة ${ar(state.mushafPage)}` : 'اقرأ من أي موضع', onPress: () => router.push({ pathname: '/reader', params: { mode: 'mushaf', page: String(state.mushafPage || 1) } }) },
            { key: 'marks', icon: <BookmarkIcon size={22} color={p.goldLight} />, title: 'علاماتك', sub: (state.bookmarks || []).length ? PG((state.bookmarks || []).length) : 'لا علامات بعد', onPress: () => router.navigate('/mushaf') },
            { key: 'dua', icon: <StarIcon size={22} color={p.goldLight} />, title: 'دعاء ختم القرآن', sub: 'يُقرأ عند تمام الختمة', onPress: () => router.push('/khatma') },
            { key: 'idea', icon: <LampIcon size={22} color={p.goldLight} />, title: 'على منهاج الصحابة', sub: 'لماذا سبعة أيام؟', onPress: () => router.push('/idea') },
          ]} />
        </Animated.View>
      </View>
    </ScrollView>
  );
}
