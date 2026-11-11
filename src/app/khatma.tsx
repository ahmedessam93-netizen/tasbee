// The khatm dua, shown when a week's khatma is complete (and from the week screen at any time).
import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon } from '../components/icons';
import { Shamsa } from '../components/ornaments';
import { IconButton, Txt } from '../components/ui';
import { leave } from '../core/nav';
import { ar } from '../core/plan';
import { useStore } from '../core/store';
import { DUA, DUA_SOURCE, DUA_TITLE } from '../quran/dua';
import { F, usePalette } from '../theme';

export default function Khatma() {
  const p = usePalette(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const { state } = useStore();
  const W = Math.min(width, 560) - 40;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: insets.top + 8, right: 16, zIndex: 2 }}>
        <IconButton label="إغلاق" onPress={() => leave('/week')}><CloseIcon size={20} color={p.ink} /></IconButton>
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 30, paddingBottom: insets.bottom + 40, alignItems: 'center' }}>
        <Animated.View entering={FadeIn.duration(900)}><Shamsa size={Math.min(W * 0.6, 200)} /></Animated.View>
        {state.khatma.count ? <Txt v="label" align="center" color={p.gold} style={{ marginTop: 10 }}>{`ختمات مكتملة: ${ar(state.khatma.count)}`}</Txt> : null}
        <Txt v="display" align="center" style={{ marginTop: 6 }}>{DUA_TITLE}</Txt>
        <Txt v="label" align="center">{DUA_SOURCE}</Txt>
        <View style={{ width: W, marginTop: 18, gap: 14 }}>
          {DUA.map((para, i) => (
            <Text key={i} maxFontSizeMultiplier={1.4} style={{ fontFamily: F.serif, fontSize: i === 0 ? 19 : 20, lineHeight: 38, color: p.ink, textAlign: i === 0 ? 'center' : 'justify', writingDirection: 'rtl' }}>{para}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
