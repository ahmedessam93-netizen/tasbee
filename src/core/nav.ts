// Leaving a screen. "Back" works only when there is a screen behind this one; a page opened
// directly (from the Home Screen icon, a reload, a notification or a link) has none, so it
// goes to a sensible screen instead. Every close and back button uses this.
import { Href, router } from 'expo-router';

export function leave(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
