// Error reports on the web (iPhone Home Screen app): when something breaks on a real phone,
// the report says which screen and which line, so it can be fixed. Nothing about the reader.
import * as Sentry from '@sentry/browser';
import { APP, sharing, VERSION } from './track';

let started = false;
export function startMonitor() {
  if (started || (typeof __DEV__ !== 'undefined' && __DEV__)) return;
  if (typeof location !== 'undefined' && /^(localhost|127\.|.*\.test$)/.test(location.hostname)) return;
  started = true;
  try {
    Sentry.init({
      dsn: 'https://293e7cbe67e687b508f697467e080fee@o4512392803778560.ingest.de.sentry.io/4512414057693264',
      release: `${APP}@${VERSION}`, environment: 'web', tracesSampleRate: 0,
      beforeSend: (e) => (sharing() ? e : null),
    });
  } catch {}
}
export function reportError(e: unknown) { try { if (started && sharing()) Sentry.captureException(e); } catch {} }
