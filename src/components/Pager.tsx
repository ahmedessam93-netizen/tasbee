// Book pager. Native: react-native-pager-view (right-to-left, like the book).
import React, { forwardRef } from 'react';
import { ViewStyle } from 'react-native';
import PagerView from 'react-native-pager-view';

export type PagerHandle = { setPage: (i: number) => void };
type Props = { style?: ViewStyle; initialPage?: number; scrollEnabled?: boolean; onPageSelected: (i: number) => void; children: React.ReactNode[]; paper?: string };

export const Pager = forwardRef<PagerHandle, Props>(function Pager({ style, initialPage = 0, scrollEnabled = true, onPageSelected, children }, ref) {
  return (
    <PagerView ref={ref as any} style={style} initialPage={initialPage} layoutDirection="rtl" offscreenPageLimit={2} scrollEnabled={scrollEnabled}
      onPageSelected={(e) => onPageSelected(e.nativeEvent.position)}>
      {children}
    </PagerView>
  );
});
