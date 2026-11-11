// Anonymous help for improving the app: a count of what is used, and reports of errors.
// No account, no name, no location, nothing typed or read: only the app, its version, the kind
// of device, and the name of the step ("reader opened"). The reader can turn it off in Settings.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const APP = 'tasbee';
export const VERSION: string = (Constants.expoConfig && Constants.expoConfig.version) || '';
const PH = { host: 'https://eu.i.posthog.com', key: 'phc_vKvH8GcsmmLf7v9Dc7ULrSgK8wxXM6g7gToSHWTkW5mX' };

let on = true;            // the reader's choice (Settings)
let id = '';              // a random number for this install: it says "the same phone", never who
export function setSharing(v: boolean, anon: string) { on = v; id = anon; }
export const newId = () => 'a' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);

/** Count one step. Never throws, never waits, never sends anything about the reader. */
export function track(event: string, props: Record<string, string | number | boolean> = {}) {
  if (!on || !id || typeof fetch === 'undefined') return;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return;
  try {
    fetch(`${PH.host}/i/v0/e/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ api_key: PH.key, event, distinct_id: id, properties: { app: APP, version: VERSION, os: Platform.OS, $process_person_profile: false, $ip: null, ...props } }),
    }).catch(() => {});
  } catch {}
}
export const sharing = () => on;
