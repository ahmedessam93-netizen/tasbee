// Prayer-anchored reminders, scheduled on the phone (no server).
// iOS keeps at most 64 pending local notifications, so we keep a rolling window of 60
// and refresh it whenever the app opens, the state changes, or the background task runs.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { State, upcomingNotifications } from './plan';

export const CHANNEL_ID = 'wird';
let configured = false;

export function configureNotifications() {
  if (configured) return; configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'جلسات التسبيع',
      description: 'تذكير بعد كل صلاة بجلسة القرآن',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: '#E2BC6A',
      sound: 'default',
    }).catch(() => {});
  }
}

export async function notificationPermission(ask: boolean): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted || (cur.ios && cur.ios.status === Notifications.IosAuthorizationStatus.PROVISIONAL)) return true;
    if (!ask || !cur.canAskAgain) return false;
    const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return r.granted;
  } catch { return false; }
}

let running: Promise<void> | null = null;
export async function refreshReminders(s: State) {
  if (running) await running.catch(() => {});
  running = (async () => {
    configureNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!s.settings.onboarded || s.settings.notif === false) return;
    if (!(await notificationPermission(false))) return;
    const list = upcomingNotifications(s, new Date(), 60);
    for (const n of list) {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: { title: n.title, body: n.body, data: { url: 'tasbee://' }, sound: 'default' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: CHANNEL_ID },
      });
    }
  })();
  try { await running; } finally { running = null; }
}

// Web-only helpers (see notify.web.ts); the native app never needs them.
export const pushSupported = () => true;
export const isIOS = () => false;
export const isStandalone = () => true;
export const needsHomeScreen = () => false;
export async function sendTest(): Promise<boolean> {
  await Notifications.scheduleNotificationAsync({ content: { title: 'قرآن (تسبيع)', body: 'الإشعارات تعمل. ستصلك بعد كل صلاة إن شاء الله.' }, trigger: null }).catch(() => {});
  return true;
}
