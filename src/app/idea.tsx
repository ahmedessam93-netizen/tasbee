// "The idea behind the app": one page on reading the Quran in seven days, as the Companions did,
// with the narrations and their sources. Opened from onboarding, the home screen and the settings.
import React from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseIcon } from '../components/icons';
import { Shamsa } from '../components/ornaments';
import { IconButton, Panel, Txt } from '../components/ui';
import { leave } from '../core/nav';
import { ORDINALS } from '../core/plan';
import { PARTS } from '../quran';
import { IDEA, IDEA_LETTERS, IDEA_SUB, IDEA_TITLE } from '../quran/idea';
import { F, usePalette } from '../theme';

export default function Idea() {
  const p = usePalette(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const W = Math.min(width, 560) - 44;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: insets.top + 8, right: 16, zIndex: 2 }}>
        <IconButton label="إغلاق" onPress={() => leave('/')}><CloseIcon size={20} color={p.ink} /></IconButton>
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 26, paddingBottom: insets.bottom + 48, alignItems: 'center' }}>
        <Animated.View entering={FadeIn.duration(900)}><Shamsa size={Math.min(W * 0.42, 140)} /></Animated.View>
        <Txt v="display" align="center" style={{ marginTop: 8 }}>{IDEA_TITLE}</Txt>
        <Txt v="meta" align="center" color={p.gold}>{IDEA_SUB}</Txt>
        <View style={{ width: W, marginTop: 16, gap: 12 }}>
          {IDEA.map((b, i) => {
            if (b.k === 'h') return <Txt key={i} v="h2" style={{ marginTop: 12 }}>{b.t}</Txt>;
            if (b.k === 'p') return <Text key={i} maxFontSizeMultiplier={1.4} style={{ fontFamily: F.ui, fontSize: 16, lineHeight: 29, color: p.ink, textAlign: 'right', writingDirection: 'rtl' }}>{b.t}</Text>;
            if (b.k === 'parts') return (
              <Panel key={i} padding={14}>
                {PARTS.map((part, d) => (
                  <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: d === 0 ? 0 : 1, borderTopColor: p.rule }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.goldFaint }}>
                      <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 18, lineHeight: 30, color: p.gold }}>{IDEA_LETTERS[d]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt v="body" style={{ fontFamily: F.uiMed, fontSize: 15.5, lineHeight: 23 }}>{part.name}</Txt>
                      <Txt v="label" style={{ fontSize: 12.5, lineHeight: 18 }}>{`الحزب ${ORDINALS[d]}`}</Txt>
                    </View>
                  </View>
                ))}
              </Panel>
            );
            return (
              <View key={i} style={{ borderRightWidth: 2, borderRightColor: p.gold, paddingRight: 14, paddingVertical: 2, gap: 4 }}>
                {b.by ? <Txt v="label" style={{ fontSize: 13.5, lineHeight: 21 }}>{b.by}</Txt> : null}
                <Text maxFontSizeMultiplier={1.4} style={{ fontFamily: F.serif, fontSize: 19.5, lineHeight: 37, color: p.ink, textAlign: 'right', writingDirection: 'rtl' }}>{b.t}</Text>
                <Txt v="label" color={p.gold} style={{ fontSize: 12.5, lineHeight: 19 }}>{b.src}</Txt>
                {b.note ? <Txt v="label" style={{ fontSize: 12.5, lineHeight: 19 }}>{b.note}</Txt> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
