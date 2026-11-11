// Web version: reminders after each prayer need a server to deliver them while the page is
// closed. This app has none yet, so on the web it shows no notifications (the Android app does).
import type { State } from './plan';

export const CHANNEL_ID = 'wird';
export const pushSupported = () => false;
export const isIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);
export const needsHomeScreen = () => false;
export function configureNotifications() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) navigator.serviceWorker.register(`${process.env.EXPO_BASE_URL || ''}/sw.js`).catch(() => {});
}
export async function notificationPermission(_ask: boolean): Promise<boolean> { return false; }
export async function refreshReminders(_s: State) {}
export async function sendTest(): Promise<boolean> { return false; }
