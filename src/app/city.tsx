import { leave } from '../core/nav';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckIcon, CloseIcon, PinIcon, SearchIcon } from '../components/icons';
import { IconButton, Txt, useTap } from '../components/ui';
import { CITIES } from '../core/cities';
import { useStore } from '../core/store';
import { F, usePalette } from '../theme';
import { locateMe } from '../core/location';

const norm = (s: string) => s.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim();

export default function CityPicker() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets();
  const { state, setSettings } = useStore();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);
  const list = useMemo(() => {
    const nq = norm(q);
    return CITIES.map((c, i) => ({ c, i })).filter(({ c }) => !nq || norm(c[0]).includes(nq));
  }, [q]);
  const pick = (i: number) => { tap('medium'); const c = CITIES[i]; setSettings({ city: i, cityName: c[0], lat: c[1], lng: c[2], method: c[3] }); leave('/'); };
  const auto = async () => {
    tap(); setBusy(true); setFail(false);
    try { const r = await locateMe(); if (r) { setSettings({ lat: r.lat, lng: r.lng, method: r.method, city: 'geo', cityName: r.cityName, travel: true }); leave('/'); return; } }
    catch {} finally { setBusy(false); }
    // refused or unavailable: say so, and point to the list
    setFail(true);
  };
  return (
    <View style={{ flex: 1, paddingTop: (Platform.OS === 'ios' ? 0 : insets.top) + 18, paddingHorizontal: 16 }}>
      {Platform.OS === 'ios' ? <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: p.faint, marginBottom: 14 }} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Txt v="display" style={{ fontSize: 30, lineHeight: 42, flexShrink: 1 }}>اختر مدينتك</Txt>
        <IconButton label="إغلاق" onPress={() => leave('/')}><CloseIcon size={20} color={p.ink} /></IconButton>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 12, height: 46, borderRadius: 14, backgroundColor: p.chip, borderWidth: 1, borderColor: p.chipBorder }}>
        <SearchIcon size={18} color={p.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="ابحث عن مدينة" placeholderTextColor={p.faint} style={{ flex: 1, fontFamily: F.ui, fontSize: 16, color: p.ink, textAlign: 'right', writingDirection: 'rtl' }} autoCorrect={false} returnKeyType="search" />
      </View>
      <Pressable onPress={auto} disabled={busy} accessibilityLabel="استخدم موقعي الحالي" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 6 }} accessibilityRole="button">
        <PinIcon size={20} color={p.gold} />
        <Text style={{ fontFamily: F.uiBold, fontSize: 15, color: p.gold }}>{busy ? 'جارٍ تحديد موقعك…' : 'استخدم موقعي الحالي'}</Text>
      </Pressable>
      {fail ? <Txt v="label" style={{ marginTop: -6, marginBottom: 8, paddingHorizontal: 6, lineHeight: 20 }}>تعذّر تحديد موقعك. اسمح بالوصول إلى الموقع من إعدادات الهاتف أو المتصفح، أو اختر مدينتك من القائمة.</Txt> : null}
      <FlatList data={list} keyExtractor={(x) => String(x.i)} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item, index }) => {
          const on = state.settings.city === item.i;
          const showHeader = index === 0 || (list[index - 1].c[3] === 'egypt') !== (item.c[3] === 'egypt');
          return (
            <View>
              {showHeader && !q ? <Txt v="label" style={{ marginTop: 12, marginBottom: 4, paddingHorizontal: 6 }}>{item.c[3] === 'egypt' ? 'مصر' : 'مدن أخرى'}</Txt> : null}
              <Pressable onPress={() => pick(item.i)} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 8, borderRadius: 12, backgroundColor: on ? p.turqSoft : pressed ? p.chip : 'transparent' })}>
                <Txt v="body" style={{ flex: 1, color: on ? p.goldLight : p.ink, fontFamily: on ? F.uiBold : F.ui }}>{item.c[0]}</Txt>
                {on ? <CheckIcon size={18} color={p.gold} /> : null}
              </Pressable>
            </View>
          );
        }} />
    </View>
  );
}
