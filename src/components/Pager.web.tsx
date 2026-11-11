// Book pager for the web version (iPhone Home Screen app).
// The page follows the finger and turns like a leaf of an Arabic book: drag left-to-right for the
// next page. The page being left slides away over the one beneath it, which rises into place.
// The current page and its neighbours stay mounted, so the next page is already drawn when it
// comes into view. Arrow keys work too.
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, runOnJS, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type PagerHandle = { setPage: (i: number) => void };
type Props = { style?: ViewStyle; initialPage?: number; scrollEnabled?: boolean; onPageSelected: (i: number) => void; children: React.ReactNode[];
  /** the paper behind each page; pages overlap while turning, so each needs its own ground */
  paper?: string };

const TURN = { duration: 340, easing: Easing.out(Easing.cubic) };

/** One leaf. `pos` is the reader's place as a moving number: 3.4 is 40% of the way from page 3 to 4. */
function Leaf({ i, pos, width, current, paper, children }: { i: number; pos: SharedValue<number>; width: SharedValue<number>; current: boolean; paper?: string; children: React.ReactNode }) {
  const st = useAnimatedStyle(() => {
    const d = i - pos.value;                       // 0: in place, <0: already turned (off to the right), >0: still beneath
    if (d <= 0) {
      const x = -d * width.value;                  // a turned leaf leaves to the right
      return { transform: [{ translateX: x }, { scale: 1 }], opacity: d <= -1 ? 0 : 1 };
    }
    const t = Math.min(1, d);                       // the leaf beneath rises as the one above leaves
    return { transform: [{ translateX: -t * width.value * 0.18 }, { scale: interpolate(t, [0, 1], [1, 0.94]) }], opacity: d >= 1.5 ? 0 : interpolate(t, [0, 1], [1, 0.35]) };
  });
  // the soft shade a lifted leaf throws on the page beneath it
  const shade = useAnimatedStyle(() => { const d = i - pos.value; return { opacity: d < 0 && d > -1 ? 0.5 * (1 + d) + 0.15 : 0 }; });
  return (
    <Animated.View pointerEvents={current ? 'auto' : 'none'}
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 - i, backgroundColor: paper }, st]}>
      {children}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: -28, width: 28,
        // @ts-ignore web only
        backgroundImage: 'linear-gradient(to left, rgba(0,0,0,0.28), rgba(0,0,0,0))' }, shade]} />
    </Animated.View>
  );
}

export const Pager = forwardRef<PagerHandle, Props>(function Pager({ style, initialPage = 0, scrollEnabled = true, onPageSelected, children, paper }, ref) {
  const kids = React.Children.toArray(children);
  const last = kids.length - 1;
  const [page, setPageState] = useState(initialPage);
  const pageRef = useRef(initialPage);
  const pos = useSharedValue(initialPage);
  const start = useSharedValue(initialPage);
  const width = useSharedValue(390);

  const select = useCallback((n: number) => {
    if (n === pageRef.current) return;
    pageRef.current = n; setPageState(n); onPageSelected(n);
  }, [onPageSelected]);
  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(last, i));
    if (n === pageRef.current) { pos.value = withTiming(n, TURN); return; }
    // a far jump has nothing to slide past: land there directly
    if (Math.abs(n - pageRef.current) > 2) pos.value = n; else pos.value = withTiming(n, TURN);
    select(n);
  }, [last, pos, select]);
  useImperativeHandle(ref, () => ({ setPage: go }), [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') go(pageRef.current + 1); if (e.key === 'ArrowRight') go(pageRef.current - 1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const drag = Gesture.Pan().enabled(scrollEnabled).activeOffsetX([-10, 10]).failOffsetY([-16, 16])
    .onStart(() => { start.value = Math.round(pos.value); })
    .onUpdate((e) => {
      let v = start.value + e.translationX / Math.max(1, width.value);   // dragging right moves forward in the book
      v = Math.max(start.value - 1, Math.min(start.value + 1, v));       // one leaf at a time
      if (v < 0) v = v * 0.25; else if (v > last) v = last + (v - last) * 0.25;   // the covers resist
      pos.value = v;
    })
    .onEnd((e) => {
      const moved = pos.value - start.value;
      let n = start.value;
      if (moved > 0.28 || (moved > 0.04 && e.velocityX > 420)) n = start.value + 1;
      else if (moved < -0.28 || (moved < -0.04 && e.velocityX < -420)) n = start.value - 1;
      n = Math.max(0, Math.min(last, n));
      pos.value = withTiming(n, { duration: 260, easing: Easing.out(Easing.cubic) });
      runOnJS(select)(n);
    });

  return (
    <GestureDetector gesture={drag}>
      <View style={[{ flex: 1, overflow: 'hidden' }, style]} onLayout={(e) => { width.value = e.nativeEvent.layout.width; }}>
        {kids.map((k, i) => (Math.abs(i - page) <= 2 ? (
          <Leaf key={i} i={i} pos={pos} width={width} current={i === page} paper={paper}>{k}</Leaf>
        ) : null))}
      </View>
    </GestureDetector>
  );
});
