import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon } from '../../components/icons';
import { Head, Heat, HeatCell, HeroButton, HeroCard, Meter } from '../../components/dash';
import { Panel, Txt, useTap } from '../../components/ui';
import { addDays, ar, cnt, DAY_NAMES, dkey, ORDINALS, PG, weekOf } from '../../core/plan';
import { usePlan, useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

export default function Week() {
  const p = usePalette(); const P = usePlan(); const { state, setViewDay } = useStore(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const W = Math.min(width, 520) - 48;
  const days = weekOf(state, P).map((x) => {
    const today = x.key === P.key; const future = x.date > P.date;
    const st: 'done' | 'today' | 'future' | 'missed' = x.full ? 'done' : today ? 'today' : future ? 'future' : 'missed';
    return { ...x, today, st, name: DAY_NAMES[x.date.getDay()] };
  });
  const full = days.filter((x) => x.st === 'done').length;
  const sat = days.reduce((a, x) => a + (x.full ? 5 : x.n), 0);
  const SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  // the last five weeks of the khatma, ending with this one
  const heat: HeatCell[][] = [4, 3, 2, 1, 0].map((w) => days.map((x) => {
    const d = addDays(x.date, -7 * w); const done = state.days[dkey(d)]?.done || {}; const n = [0, 1, 2, 3, 4].filter((k) => done[k]).length;
    return { key: dkey(d), num: ar(d.getDate()), today: dkey(d) === P.key, state: d > P.date ? 'future' : n === 5 ? 'full' : n > 0 ? 'some' : 'none' } as HeatCell;
  }));

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 150, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Txt v="label">{`يبدأ التسبيع يوم ${DAY_NAMES[state.settings.startDay]}`}</Txt>
          <Txt v="display">ختمة الأسبوع</Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(70).duration(600)}>
          <View accessible accessibilityLabel={`أتممت ${cnt(full, 'حزبًا واحدًا', 'حزبين', 'أحزاب')} من سبعة هذا الأسبوع`}>
            <HeroCard style={{ marginTop: 14 }} eyebrow={state.khatma.count ? `ختمات مكتملة: ${ar(state.khatma.count)}` : 'ختمتك الأولى'} tone={full > 0 ? 'done' : 'plain'}
              title={full === 7 ? 'اكتملت الختمة' : `الختمة رقم ${ar(state.khatma.count + 1)}`}
              line={full === 7 ? 'تقبّل الله. اقرأ دعاء ختم القرآن.' : `قرأت ${ar(sat)} من ٣٥ جلسة هذا الأسبوع. تكتمل الختمة حين تكتمل الأحزاب السبعة.`}
              frac={sat / 35} done={full === 7} big={full ? ar(full) : '–'} small="من ٧ أحزاب">
              <HeroButton quiet label="دعاء ختم القرآن" onPress={() => { tap(); router.push('/khatma'); }} />
            </HeroCard>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(600)}>
          <Head title="الأحزاب السبعة" />
          <Panel>
            {days.map((x, i) => {
              const label = x.st === 'done' ? 'اكتمل' : x.st === 'today' ? `${ar(x.n)} من ٥ جلسات` : x.st === 'missed' ? (x.n ? `${ar(x.n)} من ٥` : 'فات') : PG(Math.round(x.part.w / 15));
              const color = x.st === 'done' ? p.gold : x.st === 'today' ? p.turqHi : p.faint;
              return (
                <Pressable key={x.key} onPress={() => { tap(); setViewDay(x.today ? null : x.key); router.navigate('/'); }} accessibilityRole="button" accessibilityLabel={`افتح الحزب ${ORDINALS[x.d]}، ${x.name}`}
                  style={({ pressed }) => ({ paddingVertical: 13, opacity: pressed ? 0.6 : 1, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: p.rule })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: x.st === 'done' ? p.gold : x.st === 'today' ? p.turqSoft : 'transparent', borderWidth: x.st === 'done' ? 0 : 1, borderColor: x.st === 'today' ? p.turq : p.goldFaint }}>
                      <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 15, color: x.st === 'done' ? (p.dark ? '#2A1D07' : '#FFF8E8') : x.st === 'today' ? p.turqHi : p.muted }}>{ar(x.d + 1)}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt v="body" numberOfLines={1} style={{ fontFamily: x.today ? F.uiBold : F.uiMed, color: x.st === 'future' ? p.muted : p.ink }}>{x.part.name}</Txt>
                      <Txt v="label" style={{ lineHeight: 19 }}>{`${x.name}${x.today ? '، اليوم' : ''}`}</Txt>
                    </View>
                    <Text maxFontSizeMultiplier={1.2} style={{ fontFamily: x.today ? F.uiBold : F.ui, fontSize: 13, color }}>{label}</Text>
                    <ChevronIcon size={16} color={p.faint} />
                  </View>
                  <View style={{ marginTop: 9 }}><Meter frac={x.full ? 1 : x.n / 5} color={x.st === 'done' ? p.gold : p.turq} height={5} /></View>
                </Pressable>
              );
            })}
          </Panel>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Head title="آخر خمسة أسابيع" />
          <Panel padding={14}>
            <View style={{ paddingVertical: 8 }}><Heat head={days.map((x) => SHORT[x.date.getDay()])} weeks={heat} /></View>
          </Panel>
        </Animated.View>

        <Txt v="label" style={{ marginTop: 16, marginHorizontal: 4, lineHeight: 21 }}>لكل يوم حزبه، ويبدأ بعد الفجر. اضغط أي يوم لتفتحه؛ ما فاتك يبقى متاحًا.</Txt>
      </View>
    </ScrollView>
  );
}
