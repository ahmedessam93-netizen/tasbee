import * as BackgroundTask from 'expo-background-task';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sky } from '../components/ui';
import { configureNotifications, refreshReminders } from '../core/notify';
import { loadState, StoreProvider, useStore } from '../core/store';
import { refreshWidgets } from '../core/widgets';
import { travelCheck } from '../core/location';
import { plan } from '../core/plan';
import { downloadRange } from '../quran/fonts';
import { PARTS } from '../quran';
import { usePalette } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();

// Runs every few hours even when the app is closed: keeps the rolling window of
// reminders filled and the widgets on the right sitting.
const REFRESH_TASK = 'tasbee-refresh';
if (Platform.OS !== 'web') TaskManager.defineTask(REFRESH_TASK, async () => {
  try {
    const s = await loadState();
    await refreshReminders(s);
    await refreshWidgets(s);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

function Shell() {
  const p = usePalette();
  const { ready, state, setSettings } = useStore();
  const latest = useRef(state); latest.current = state;
  const [fontsLoaded] = useFonts({
    ReemKufi_600SemiBold: require('../../assets/fonts/ReemKufi_600SemiBold.ttf'),
    ReemKufi_700Bold: require('../../assets/fonts/ReemKufi_700Bold.ttf'),
    Amiri_400Regular: require('../../assets/fonts/Amiri_400Regular.ttf'),
    Amiri_700Bold: require('../../assets/fonts/Amiri_700Bold.ttf'),
    IBMPlexSansArabic_400Regular: require('../../assets/fonts/IBMPlexSansArabic_400Regular.ttf'),
    IBMPlexSansArabic_500Medium: require('../../assets/fonts/IBMPlexSansArabic_500Medium.ttf'),
    IBMPlexSansArabic_600SemiBold: require('../../assets/fonts/IBMPlexSansArabic_600SemiBold.ttf'),
    // the King Fahd Complex font of surah titles and the basmala
    QCF_BSML: require('../../assets/fonts/QCF_BSML.ttf'),
  });

  useEffect(() => { if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {}); }, [fontsLoaded, ready]);

  useEffect(() => {
    if (Platform.OS === 'web') return; // web: the service worker handles notification taps
    BackgroundTask.registerTaskAsync(REFRESH_TASK, { minimumInterval: 15 }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(() => { router.navigate('/'); });
    return () => sub.remove();
  }, []);

  // Travelling: follow the person to their new city (only if they allowed location before).
  useEffect(() => {
    if (!ready) return;
    const check = async () => {
      const s = latest.current.settings;
      if (!s.onboarded || s.travel === false) return;
      const r = await travelCheck(s.lat, s.lng);
      if (r) setSettings({ lat: r.lat, lng: r.lng, method: r.method, city: 'geo', cityName: r.cityName });
    };
    check();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') check(); });
    return () => sub.remove();
  }, [ready]);

  // Get today's and tomorrow's pages onto the phone quietly, so reading never waits.
  useEffect(() => {
    if (!ready || !state.settings.onboarded || Platform.OS === 'web') return;
    const P = plan(latest.current);
    const t = PARTS[(P.d + 1) % 7];
    const sig = { stop: false };
    downloadRange(P.part.pages[0], P.part.pages[1], undefined, sig).then(() => { if (!sig.stop) downloadRange(t.pages[0], t.pages[1], undefined, sig); });
    return () => { sig.stop = true; };
  }, [ready, state.settings.onboarded, state.settings.startDay]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!fontsLoaded || !ready) return <View style={{ flex: 1, backgroundColor: p.sky[2] }} />;

  const base = p.dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, colors: { ...base.colors, background: 'transparent', card: 'transparent', primary: p.gold, text: p.ink, border: 'transparent' } };
  return (
    <ThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: p.sky[2] }}>
        <Sky />
        <StatusBar style={p.statusBar} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="reader" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: p.pageBg } }} />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="city" options={{ presentation: 'modal', contentStyle: { backgroundColor: p.dark ? '#0B2D27' : '#F8F3E4' } }} />
          <Stack.Screen name="khatma" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="idea" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="share" options={{ presentation: 'modal', contentStyle: { backgroundColor: p.dark ? '#0B2D27' : '#F8F3E4' } }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
