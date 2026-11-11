// Runs in the background when Android asks a widget to draw (added, resized, periodic update, tap).
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { snapshot } from '../core/plan';
import { loadState } from '../core/store';
import { TasbeeWidget } from './TasbeeWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetAction === 'WIDGET_DELETED') return;
  const s = await loadState();
  const snap = s.settings.onboarded
    ? snapshot(s, new Date())
    : { day: 'قرآن (تسبيع)', title: 'افتح التطبيق', detail: 'لإعداد ختمة الأسبوع', progress: 0, next: '', complete: false };
  props.renderWidget(<TasbeeWidget s={snap} size={props.widgetInfo.widgetName === 'TasbeeSmall' ? 'small' : 'medium'} />);
}
