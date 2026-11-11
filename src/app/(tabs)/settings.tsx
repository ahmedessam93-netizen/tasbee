import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronIcon, PRAYER_ICONS, ShareIcon } from '../../components/icons';
import { Panel, Row, SectionTitle, Segmented, Toggle, Txt, useTap } from '../../components/ui';
import { RecitationDownloads } from '../../components/RecitationDownloads';
import { RECITER } from '../../core/recite';
import { downloadedCount, downloadRange, TOTAL_BYTES } from '../../quran/fonts';
import { needsHomeScreen, notificationPermission } from '../../core/notify';
import { ar, DAY_NAMES, fmtTime, ORDINALS, partIndex, times, WIN_KEYS, WIN_NAMES } from '../../core/plan';
import PT from '../../core/prayer';
import { usePlan, useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

// Saturday first, as on the printed schedule
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

export default function Settings() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const { state, setSettings, resetDay } = useStore(); const P = usePlan(); const s = state.settings;
  const W = Math.min(width, 520) - 48;
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [note, setNote] = useState<{ k: string; t: string } | null>(null);
  const t = times(s, new Date());

  const toggleNotif = async (v: boolean) => {
    if (v && !(await notificationPermission(true))) { setNote({ k: 'notif', t: needsHomeScreen() ? 'الإشعارات متاحة في تطبيق أندرويد.' : 'الإشعارات مغلقة لهذا التطبيق في إعدادات الهاتف. افتحها من هناك ثم عد.' }); setSettings({ notif: true }); return; }
    setNote(null); setSettings({ notif: v });
  };
  const toggleTravel = async (v: boolean) => {
    if (v) {
      const r = await Location.requestForegroundPermissionsAsync().catch(() => null);
      if (!r || !r.granted) { setNote({ k: 'travel', t: 'يحتاج هذا إلى إذن الموقع. افتحه من إعدادات الهاتف.' }); }
      else setNote(null);
    }
    setSettings({ travel: v });
  };

  const methodName = (PT.METHODS as Record<string, { name: string }>)[s.method]?.name;
  const NoteLine = ({ k }: { k: string }) => note && note.k === k ? (
    <Pressable onPress={() => Linking.openSettings()}><Txt v="label" color={p.danger} style={{ marginBottom: 8 }}>{note.t}</Txt></Pressable>
  ) : null;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130, paddingHorizontal: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
      <View style={{ width: W }}>
        <Animated.View entering={FadeInDown.duration(500)}><Txt v="display">الإعدادات</Txt></Animated.View>

        <SectionTitle>المكان والمواقيت</SectionTitle>
        <Panel>
          <Row first title="المدينة" sub="تُحسب المواقيت على هاتفك دون إنترنت" onPress={() => router.push('/city')}
            right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Txt v="meta" color={p.gold}>{s.cityName || '—'}</Txt><ChevronIcon size={16} color={p.faint} /></View>} />
          <Row title="تحديث المدينة عند السفر" sub="تتغير المواقيت تلقائيًا إذا انتقلت إلى مدينة أخرى" right={<Toggle label="تحديث المدينة عند السفر" value={s.travel !== false} onChange={toggleTravel} />}>
            <NoteLine k="travel" />
          </Row>
          <Row title="طريقة الحساب" onPress={() => setMethodsOpen(!methodsOpen)}
            right={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '58%' }}><Txt v="meta" numberOfLines={1} color={p.gold}>{methodName}</Txt><ChevronIcon size={16} color={p.faint} /></View>} />
          {methodsOpen && Object.entries(PT.METHODS).map(([k, m]: [string, any]) => (
            <Pressable key={k} onPress={() => { tap(); setSettings({ method: k }); setMethodsOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: k === s.method }}
              style={{ paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, backgroundColor: k === s.method ? p.turqSoft : 'transparent' }}>
              <Txt v="body" style={{ fontSize: 15, color: k === s.method ? p.goldLight : p.ink }}>{m.name}</Txt>
            </Pressable>
          ))}
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

        <SectionTitle>التسبيع</SectionTitle>
        <Panel>
          <Txt v="h3" style={{ paddingTop: 12 }}>يوم الحزب الأول</Txt>
          <Txt v="label">{`اليوم ${P.dayName}: الحزب ${ORDINALS[partIndex(s, P.date)]}. يتغير حزب كل يوم إذا غيّرت هذا.`}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 12 }}>
            {WEEK_ORDER.map((d) => (
              <Pressable key={d} onPress={() => { tap(); setSettings({ startDay: d }); }} accessibilityRole="button" accessibilityState={{ selected: s.startDay === d }}
                style={{ paddingHorizontal: 14, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: s.startDay === d ? p.turq : p.chipBorder, backgroundColor: s.startDay === d ? p.turqSoft : p.chip }}>
                <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: s.startDay === d ? F.uiBold : F.ui, fontSize: 14, color: s.startDay === d ? p.turqHi : p.ink }}>{DAY_NAMES[d]}</Text>
              </Pressable>
            ))}
          </View>
          <Txt v="label" style={{ paddingBottom: 12, fontSize: 12.5 }}>كل حزب مقسوم على الصلوات الخمس، وكل جلسة تنتهي بنهاية سورة أو عند ربع حزب.</Txt>
        </Panel>

        <SectionTitle>المصحف على الهاتف</SectionTitle>
        <Panel>
          <OfflineRow />
        </Panel>

        <SectionTitle>التلاوة</SectionTitle>
        <Panel>
          <Row first title="القارئ" sub="مرتّل، آية بعد آية. في المصحف: اضغط السمّاعة لتستمع، أو اضغط مطوّلًا على آية." right={<Txt v="label" color={p.goldLight}>{RECITER.short}</Txt>} />
          <View style={{ borderTopWidth: 1, borderTopColor: p.rule, paddingTop: 12 }}>
            <Txt v="body" style={{ fontFamily: F.uiMed }}>الاستماع بلا إنترنت</Txt>
            <Txt v="label" style={{ marginBottom: 2 }}>نزّل تلاوة حزب لتسمعه دون اتصال. التنزيل كبير، ويُفضّل أن يكون على شبكة واي فاي.</Txt>
            <RecitationDownloads />
          </View>
        </Panel>

        <SectionTitle>الإشعارات</SectionTitle>
        <Panel>
          <Row first title="إشعار بعد كل صلاة" sub="لا يصل إن أتممت ورد اليوم" right={<Toggle label="إشعار بعد كل صلاة" value={s.notif !== false} onChange={toggleNotif} />}>
            <NoteLine k="notif" />
          </Row>
          <Row title="بعد الأذان بـ" right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="أقل" hitSlop={6} onPress={() => { tap(); setSettings({ offset: Math.max(0, (s.offset || 0) - 5) }); }} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder }}><Text style={{ color: p.ink, fontSize: 18 }}>−</Text></Pressable>
              <Text maxFontSizeMultiplier={1.15} style={{ fontFamily: F.uiBold, fontSize: 15, color: p.gold, minWidth: 70, textAlign: 'center' }}>{s.offset ? `${ar(s.offset)} دقيقة` : 'مع الأذان'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="أكثر" hitSlop={6} onPress={() => { tap(); setSettings({ offset: Math.min(90, (s.offset || 0) + 5) }); }} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder }}><Text style={{ color: p.ink, fontSize: 18 }}>+</Text></Pressable>
            </View>} />
        </Panel>

        <SectionTitle>القراءة والعرض</SectionTitle>
        <Panel>
          <Row first title="المظهر" right={<Segmented value={s.theme || 'auto'} onChange={(v) => setSettings({ theme: v })} options={[{ v: 'auto', label: 'تلقائي' }, { v: 'dark', label: 'الليل' }, { v: 'light', label: 'الفجر' }]} />} />
          <Row title="إبقاء الشاشة مضاءة" sub="أثناء القراءة" right={<Toggle label="إبقاء الشاشة مضاءة" value={s.wake !== false} onChange={(v) => setSettings({ wake: v })} />} />
          <Row title="اهتزاز خفيف" sub="عند اللمس وتقليب الصفحات" right={<Toggle label="الاهتزاز" value={s.haptics !== false} onChange={(v) => setSettings({ haptics: v })} />} />
          <Row title="المساعدة في تحسين التطبيق" sub="عدّ مجهول لما يُستعمل، وتقارير الأعطال. بلا اسم ولا حساب ولا موقع." right={<Toggle label="المساعدة في تحسين التطبيق" value={s.share !== false} onChange={(v) => setSettings({ share: v })} />} />
        </Panel>

        <SectionTitle>التطبيق</SectionTitle>
        <Panel>
          <Row first title="فكرة التطبيق" sub="على منهاج الصحابة: لماذا سبعة أيام؟" onPress={() => router.push('/idea')} right={<ChevronIcon size={16} color={p.faint} />} />
          <Row title="شارك التطبيق" sub="رابط ورمز QR" onPress={() => router.push('/share')} right={<ShareIcon size={20} color={p.gold} />} />
          {!confirmReset ? (
            <Row title="مسح تقدّم اليوم" sub={`الحزب ${ORDINALS[P.d]}، ${P.dayName}`} onPress={() => setConfirmReset(true)} right={<Txt v="meta" color={p.danger}>مسح</Txt>} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: p.rule }}>
              <Txt v="body" style={{ flex: 1 }}>مسح تقدّم اليوم؟</Txt>
              <Pressable accessibilityRole="button" onPress={() => { tap('medium'); resetDay(P.key); setConfirmReset(false); }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: p.danger }}><Text style={{ fontFamily: F.uiBold, color: '#fff' }}>نعم، امسح</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setConfirmReset(false)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ fontFamily: F.uiMed, color: p.muted }}>إلغاء</Text></Pressable>
            </View>
          )}
        </Panel>

        <Txt v="label" style={{ marginTop: 18, marginHorizontal: 6, lineHeight: 21 }}>مصحف المدينة النبوية برواية حفص عن عاصم، بخطوط مجمع الملك فهد لطباعة المصحف الشريف (طبعة ١٤٢١هـ)، تُعرض كما هي دون أي تعديل. أرقام الصفحات هي أرقام المصحف المطبوع. يعمل التطبيق على هاتفك، دون حساب ودون إرسال أي بيانات؛ يتصل بالإنترنت فقط لتنزيل صفحات المصحف أول مرة.</Txt>
      </View>
    </ScrollView>
  );
}

// Download the whole mushaf now (for reading offline), with progress.
function OfflineRow() {
  const p = usePalette(); const tap = useTap();
  const [have, setHave] = useState(() => downloadedCount());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const stop = useRef({ stop: false });
  useEffect(() => () => { stop.current.stop = true; }, []);
  const mb = Math.round(TOTAL_BYTES / 1e6);
  const all = have >= 604;
  const go = async () => {
    tap(); setBusy(true); setMsg(''); stop.current = { stop: false };
    const r = await downloadRange(1, 604, () => setHave(downloadedCount()), stop.current);
    setHave(downloadedCount()); setBusy(false);
    if (r.failed) setMsg('تعذّر تنزيل بعض الصفحات. تأكد من الاتصال ثم أعد المحاولة.');
  };
  return (
    <View style={{ paddingVertical: 12, gap: 8 }}>
      <Txt v="h3">{all ? 'المصحف كاملًا على هاتفك' : `على هاتفك ${ar(have)} من ٦٠٤ صفحة`}</Txt>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: p.chip, overflow: 'hidden', flexDirection: 'row', direction: 'rtl' }}>
        <View style={{ width: `${Math.round((have / 604) * 100)}%`, backgroundColor: all ? p.gold : p.turq }} />
      </View>
      <Txt v="label">{all ? 'تعمل كل الصفحات دون إنترنت.' : `تُنزَّل كل صفحة أول مرة تفتحها. لتقرأ دون إنترنت، نزّل المصحف كاملًا (نحو ${ar(mb)} ميغابايت، ويفضل على الواي فاي).`}</Txt>
      {msg ? <Txt v="label" color={p.danger}>{msg}</Txt> : null}
      {!all ? (
        <Pressable accessibilityRole="button" disabled={busy} onPress={busy ? undefined : go}
          style={{ alignSelf: 'flex-start', paddingHorizontal: 16, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.turq, backgroundColor: p.turqSoft, opacity: busy ? 0.7 : 1 }}>
          <Text style={{ fontFamily: F.uiBold, fontSize: 14, color: p.turqHi }}>{busy ? 'جارٍ التنزيل…' : 'تنزيل المصحف كاملًا'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
