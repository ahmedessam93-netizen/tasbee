import * as Clipboard from 'expo-clipboard';
import { leave } from '../core/nav';
import { ANDROID_PAGE } from '../core/update';
import { router } from 'expo-router';
import qrcode from 'qrcode-generator';
import React, { useMemo, useState } from 'react';
import { Platform, Share, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { CloseIcon, ShareIcon } from '../components/icons';
import { GlassButton, GoldButton, IconButton, Panel, Txt, useTap } from '../components/ui';
import { F, usePalette } from '../theme';

// Sharing gives the Android download page (the iPhone version is opened from the site itself).
// It lives on GitHub Pages, which opens in Egypt (netlify.app does not).
const APP_LINK = ANDROID_PAGE;
const MESSAGE = `قرآن (تسبيع) لأندرويد: ختمة القرآن كل أسبوع، حزب كل يوم في جلسات بعد الصلوات الخمس، على مصحف المدينة.\n${APP_LINK}`;

function QR({ value, size }: { value: string; size: number }) {
  const { d, n } = useMemo(() => {
    const q = qrcode(0, 'M'); q.addData(value); q.make();
    const n = q.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { d, n };
  }, [value]);
  const pad = 2;
  return (
    <Svg width={size} height={size} viewBox={`${-pad} ${-pad} ${n + pad * 2} ${n + pad * 2}`} accessibilityLabel="رمز QR لرابط تطبيق أندرويد">
      <Rect x={-pad} y={-pad} width={n + pad * 2} height={n + pad * 2} fill="#F3EAD7" />
      <Path d={d} fill="#0B1329" />
    </Svg>
  );
}

export default function ShareScreen() {
  const p = usePalette(); const tap = useTap(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);
  const W = Math.min(width, 480) - 48;
  return (
    <View style={{ flex: 1, paddingTop: (Platform.OS === 'ios' ? 0 : insets.top) + 18, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, alignItems: 'center' }}>
      <View style={{ width: W, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <IconButton label="إغلاق" onPress={() => leave('/settings')}><CloseIcon size={20} color={p.ink} /></IconButton>
      </View>
      <View style={{ width: W, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Txt v="display" align="center" style={{ fontSize: 30, lineHeight: 42 }}>شارك التطبيق</Txt>
        <Panel style={{ marginTop: 24, alignSelf: 'stretch' }} padding={22}>
          <View style={{ alignItems: 'center', gap: 14, paddingVertical: 14 }}>
            <View style={{ borderRadius: 20, overflow: 'hidden' }}><QR value={APP_LINK} size={Math.min(200, W - 80)} /></View>
            <Text style={{ fontFamily: F.display, fontSize: 22, lineHeight: 30, color: p.goldLight }}>قرآن (تسبيع)</Text>
            <Txt v="meta" align="center" style={{ lineHeight: 24 }}>تطبيق أندرويد: ختمة كل أسبوع، حزب كل يوم في جلسات بعد الصلوات، مع إشعارات وويدجت.</Txt>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: F.ui, fontSize: 13, color: p.gold, writingDirection: 'ltr' }}>{APP_LINK.replace(/^https:\/\//, '').replace(/\/$/, '')}</Text>
          </View>
        </Panel>
      </View>
      <View style={{ width: W, gap: 12 }}>
        <GoldButton label="مشاركة" icon={<ShareIcon size={20} color={p.onPrimary} />} onPress={() => { Share.share({ message: MESSAGE }).catch(() => {}); }} />
        <GlassButton label={copied ? 'نُسخ الرابط' : 'نسخ الرابط'} onPress={async () => { await Clipboard.setStringAsync(APP_LINK).catch(() => {}); tap('success'); setCopied(true); setTimeout(() => setCopied(false), 1800); }} />
      </View>
    </View>
  );
}
