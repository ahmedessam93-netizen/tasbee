import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon, ChevronIcon, PinIcon, PRAYER_ICONS } from '../components/icons';
import { Lamp } from '../components/ornaments';
import { GlassButton, GoldButton, Panel, Txt, useTap } from '../components/ui';
import { CITIES } from '../core/cities';
import { locateMe } from '../core/location';
import { notificationPermission } from '../core/notify';
import { DAY_NAMES, fmtTime, times, WIN_KEYS, WIN_NAMES } from '../core/plan';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';

export default function Onboarding() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width, height } = useWindowDimensions();
  const { state, setSettings } = useStore(); const s = state.settings;
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notifAsked, setNotifAsked] = useState(false);
  const W = Math.min(width, 480) - 48;

  const hasCity = typeof s.lat === 'number';
  const ensureCity = () => { if (!hasCity) { const c = CITIES[0]; setSettings({ city: 0, cityName: c[0], lat: c[1], lng: c[2], method: c[3] }); } };
  const t = times({ ...s, lat: s.lat ?? CITIES[0][1], lng: s.lng ?? CITIES[0][2], method: hasCity ? s.method : CITIES[0][3] }, new Date());

  const auto = async () => {
    setBusy(true);
    try { const r = await locateMe(); if (r) setSettings({ lat: r.lat, lng: r.lng, method: r.method, city: 'geo', cityName: r.cityName, travel: true }); }
    catch {} finally { setBusy(false); }
  };
  const finish = () => { tap('success'); ensureCity(); setSettings({ onboarded: true }); router.replace('/'); };
  const lampW = Math.min(220, height * 0.26);

  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, alignItems: 'center' }}>
      <View style={{ width: W, flex: 1, justifyContent: step === 0 ? 'flex-start' : 'center', paddingTop: step === 0 ? 0 : insets.top + 24 }}>
        {step === 0 && (
          <Animated.View key="s0" exiting={FadeOut.duration(200)} style={{ alignItems: 'center' }}>
            <Animated.View entering={FadeIn.duration(1200)}><Lamp width={lampW} /></Animated.View>
            <Animated.View entering={FadeInDown.delay(300).duration(800)} style={{ alignItems: 'center', marginTop: 12 }}>
              <Txt v="meta" align="center" color={p.gold} style={{ fontSize: 14 }}>تسبيع القرآن الكريم</Txt>
              <Txt v="hero" align="center" style={{ textShadowColor: 'rgba(242,196,107,0.35)', textShadowRadius: 24 }}>قرآن</Txt>
              <Txt v="body" align="center" style={{ fontSize: 17, lineHeight: 30 }}>ختمة كل أسبوع: حزب كل يوم، في جلسات بعد الصلوات الخمس.</Txt>
              <Txt v="meta" align="center" style={{ marginTop: 2, lineHeight: 26 }}>على مصحف المدينة كما طُبع، ويحفظ التطبيق موضعك في كل صفحة.</Txt>
            </Animated.View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View key="s-idea" entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)}>
            <Txt v="display">على منهاج الصحابة</Txt>
            <Txt v="meta">أوصى النبي ﷺ بختم القرآن في سبع، وكان كثير من أصحابه يختمونه كل أسبوع، في سبعة أحزاب من سور تامة.</Txt>
            <Panel style={{ marginTop: 18 }}>
              <Text maxFontSizeMultiplier={1.3} style={{ fontFamily: F.serif, fontSize: 20, lineHeight: 38, color: p.ink, textAlign: 'center', writingDirection: 'rtl', paddingTop: 12 }}>«فَاقْرَأْهُ فِي سَبْعٍ وَلاَ تَزِدْ عَلَى ذَلِكَ»</Text>
              <Txt v="label" align="center" color={p.gold} style={{ paddingBottom: 12 }}>صحيح البخاري (٥٠٥٤)</Txt>
            </Panel>
            <GlassButton style={{ marginTop: 12 }} label="اقرأ الفكرة والروايات" tone="gold" onPress={() => { tap(); router.push('/idea'); }} />
            <Txt v="label" style={{ marginTop: 10 }}>تجدها دائمًا في الإعدادات.</Txt>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="s1" entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)}>
            <Txt v="display">أين تصلّي؟</Txt>
            <Txt v="meta">لحساب مواقيت الصلاة على هاتفك، دون إنترنت.</Txt>
            <Panel style={{ marginTop: 18 }}>
              <Pressable onPress={() => { tap(); router.push('/city'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }} accessibilityRole="button" accessibilityLabel="اختر المدينة">
                <PinIcon size={22} color={p.gold} />
                <View style={{ flex: 1 }}>
                  <Txt v="label">المدينة</Txt>
                  <Txt v="h2">{hasCity ? s.cityName : CITIES[0][0]}</Txt>
                </View>
                <ChevronIcon size={18} color={p.faint} />
              </Pressable>
              <View style={{ flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderTopColor: p.rule }}>
                {WIN_KEYS.map((k, i) => { const Icon = PRAYER_ICONS[i]; return (
                  <View key={k} style={{ alignItems: 'center', flex: 1 }}>
                    <Icon size={20} color={p.gold} />
                    <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.ui, fontSize: 11.5, color: p.muted, marginTop: 4 }}>{WIN_NAMES[i]}</Text>
                    <Text maxFontSizeMultiplier={1.1} style={{ fontFamily: F.uiBold, fontSize: 13, color: p.ink }}>{fmtTime(t[k])}</Text>
                  </View>
                ); })}
              </View>
            </Panel>
            <GlassButton style={{ marginTop: 12 }} label={busy ? 'جارٍ تحديد موقعك…' : 'استخدم موقعي الحالي'} tone="gold" icon={<PinIcon size={18} color={p.gold} />} onPress={auto} />
            <Txt v="label" style={{ marginTop: 10 }}>إن سمحت بالموقع، تتبعك المواقيت إذا سافرت.</Txt>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View key="s2" entering={FadeIn.duration(500)} exiting={FadeOut.duration(200)}>
            <Txt v="display">يوم البداية</Txt>
            <Txt v="meta">في أي يوم تقرأ الحزب الأول (من الفاتحة إلى النساء)؟ ثم حزب كل يوم حتى تختم في سبعة أيام.</Txt>
            <Panel style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 }}>
                {[6, 0, 1, 2, 3, 4, 5].map((d) => (
                  <Pressable key={d} onPress={() => { tap(); setSettings({ startDay: d }); }} accessibilityRole="button" accessibilityState={{ selected: s.startDay === d }}
                    style={{ paddingHorizontal: 14, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: s.startDay === d ? p.turq : p.chipBorder, backgroundColor: s.startDay === d ? p.turqSoft : p.chip }}>
                    <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: s.startDay === d ? F.uiBold : F.ui, fontSize: 14.5, color: s.startDay === d ? p.turqHi : p.ink }}>{DAY_NAMES[d]}</Text>
                  </Pressable>
                ))}
              </View>
              <Txt v="label" style={{ paddingBottom: 12 }}>السبت هو المعتاد. يمكنك تغييره لاحقًا من الإعدادات.</Txt>
            </Panel>
            <Panel style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                <BellIcon size={22} color={p.gold} />
                <View style={{ flex: 1 }}>
                  <Txt v="h3">إشعار بعد كل صلاة</Txt>
                  <Txt v="label">{notifAsked ? (s.notif ? 'تم. يمكنك تغيير ذلك من الإعدادات.' : 'لم يُسمح بالإشعارات. يمكنك تفعيلها لاحقًا.') : 'إشعار هادئ بالجلسة: من أي سورة إلى أين، وعدد صفحاتها.'}</Txt>
                </View>
              </View>
              {!notifAsked ? <GlassButton style={{ marginBottom: 12 }} label="السماح بالإشعارات" tone="gold" onPress={async () => { const ok = await notificationPermission(true); setSettings({ notif: ok }); setNotifAsked(true); }} /> : null}
            </Panel>
          </Animated.View>
        )}
      </View>

      <View style={{ width: W, alignItems: 'center', gap: 18 }}>
        <View style={{ alignSelf: 'stretch', gap: 10 }}>
          <GoldButton label={step === 0 ? 'ابدأ' : step < 3 ? 'التالي' : 'تمّ'} onPress={() => { if (step === 2) ensureCity(); if (step < 3) setStep(step + 1); else finish(); }} />
          {step > 0 ? <GlassButton label="رجوع" onPress={() => setStep(step - 1)} /> : null}
        </View>
        <View accessible accessibilityLabel={`الخطوة ${step + 1} من ٤`} style={{ flexDirection: 'row', gap: 8 }}>
          {[0, 1, 2, 3].map((k) => <View key={k} style={{ width: k === step ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: k === step ? p.gold : p.faint, opacity: k === step ? 1 : 0.6 }} />)}
        </View>
      </View>
    </View>
  );
}
