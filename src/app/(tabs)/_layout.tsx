import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookIcon, BookmarkIcon, CrescentIcon, LampIcon, StarIcon } from '../../components/icons';
import { Bar, TabFade, useTap } from '../../components/ui';
import { plan } from '../../core/plan';
import { useStore } from '../../core/store';
import { F, usePalette } from '../../theme';

const ITEMS: Record<string, { label: string; Icon: (p: { size?: number; color: string }) => React.ReactElement }> = {
  index: { label: 'اليوم', Icon: LampIcon },
  week: { label: 'الختمة', Icon: CrescentIcon },
  mushaf: { label: 'المصحف', Icon: BookmarkIcon },
  settings: { label: 'الإعدادات', Icon: StarIcon },
};
// two places on each side of the reading button
const ORDER = ['index', 'week', 'READ', 'mushaf', 'settings'];
const PATHS: Record<string, string> = { index: '/', week: '/week', mushaf: '/mushaf', settings: '/settings' };

function TabBar({ state: nav, navigation }: any) {
  const p = usePalette(); const insets = useSafeAreaInsets(); const tap = useTap(); const { state, now } = useStore();
  const current = nav.routes[nav.index]?.name;
  const read = () => {
    tap('medium');
    const P = plan(state, now);
    // a finished day opens the mushaf where the reader last stopped
    if (P.complete) router.push({ pathname: '/reader', params: { mode: 'mushaf', page: String(state.mushafPage || 1) } });
    else router.push({ pathname: '/reader', params: { day: P.key } });
  };
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom - 6, 12) + 8, alignItems: 'center' }}>
      <TabFade height={Math.max(insets.bottom - 6, 12) + 124} />
      <View>
        <Bar radius={32}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8 }}>
            {ORDER.map((name) => {
              if (name === 'READ') return <View key="gap" style={{ width: 74 }} />;
              const item = ITEMS[name]; const focused = current === name; const { Icon } = item;
              const isTab = nav.routes.some((r: any) => r.name === name);
              return (
                <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={item.label}
                  onPress={() => { tap(); if (focused) return; if (isTab && navigation && navigation.navigate) navigation.navigate(name); else router.push(PATHS[name] as any); }}
                  style={{ width: 66, height: 56, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <Icon size={23} color={focused ? p.goldLight : p.muted} />
                  <Text maxFontSizeMultiplier={1.1} numberOfLines={1} style={{ fontFamily: focused ? F.uiBold : F.ui, fontSize: 11.5, color: focused ? p.goldLight : p.muted }}>{item.label}</Text>
                  <View style={{ position: 'absolute', bottom: 2, width: focused ? 18 : 0, height: 3, borderRadius: 2, backgroundColor: p.gold }} />
                </Pressable>
              );
            })}
          </View>
        </Bar>
        {/* the reading button: always one tap away, on every tab */}
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: -16, alignItems: 'center' }}>
          <Pressable onPress={read} accessibilityRole="button" accessibilityLabel="تابع القراءة"
            style={({ pressed }) => ({ width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: p.sky[3],
              transform: [{ scale: pressed ? 0.95 : 1 }], shadowColor: '#C99C46', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 })}>
            <LinearGradient colors={['#F7E2A6', '#E2BC6A', '#B98E3A']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <View><BookIcon size={28} color="#2A1D07" /></View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { state } = useStore();
  if (!state.settings.onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="week" />
      <Tabs.Screen name="mushaf" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
