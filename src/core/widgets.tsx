// Keeps the Android home-screen widgets in step with the app (they also refresh themselves
// every 30 minutes).
import React from 'react';
import { Platform } from 'react-native';
import { snapshot, State } from './plan';

export const ANDROID_WIDGETS = ['Tasbee', 'TasbeeSmall'] as const;

export async function refreshWidgets(s: State) {
  if (!s.settings.onboarded || Platform.OS !== 'android') return;
  const { requestWidgetUpdate } = await import('react-native-android-widget');
  const { TasbeeWidget } = await import('../widget/TasbeeWidget');
  for (const name of ANDROID_WIDGETS) {
    await requestWidgetUpdate({
      widgetName: name,
      renderWidget: () => <TasbeeWidget s={snapshot(s, new Date())} size={name === 'TasbeeSmall' ? 'small' : 'medium'} />,
    }).catch(() => {});
  }
}
