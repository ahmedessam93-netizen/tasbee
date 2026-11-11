// For the Android version shared by download link (not the store): checks the download page
// for a newer version and offers it. Store installs update through the store instead.
import * as Application from 'expo-application';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// GitHub Pages: opens in Egypt too
export const ANDROID_PAGE = 'https://ahmedessam93-netizen.github.io/Awradna/quran/';
export const DIRECT = process.env.EXPO_PUBLIC_CHANNEL === 'direct';

export type Release = { versionCode: number; version: string; url: string; notes?: string };

export function useUpdate(): Release | null {
  const [rel, setRel] = useState<Release | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'android' || !DIRECT) return;
    const mine = Number(Application.nativeBuildVersion || 0);
    fetch(`${ANDROID_PAGE}version.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<Release>) : null))
      .then((j) => { if (j && Number(j.versionCode) > mine) setRel(j); })
      .catch(() => {});
  }, []);
  return rel;
}
