import * as Location from 'expo-location';
import { CITIES } from './cities';

function nearest(la: number, lo: number) {
  let best = 0, bd = 1e9;
  CITIES.forEach((c, i) => { const d = (c[1] - la) ** 2 + (c[2] - lo) ** 2; if (d < bd) { bd = d; best = i; } });
  return { i: best, close: bd < 0.6 };
}
function place(la: number, lo: number) {
  const n = nearest(la, lo);
  return { lat: la, lng: lo, method: CITIES[n.i][3], cityName: n.close ? CITIES[n.i][0] : 'موقعي الحالي' };
}

// Current position, matched to the nearest known city for its calculation method.
export async function locateMe(): Promise<{ lat: number; lng: number; method: string; cityName: string } | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return place(pos.coords.latitude, pos.coords.longitude);
}

// Travel: when the app opens far (over 30 km) from the saved place, follow the person.
// Never asks for permission here; only works once location was allowed.
export function km(a: [number, number], b: [number, number]) {
  const R = 6371, rad = Math.PI / 180;
  const dLa = (b[0] - a[0]) * rad, dLo = (b[1] - a[1]) * rad;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export async function travelCheck(lat: number | null, lng: number | null) {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos = (await Location.getLastKnownPositionAsync({ maxAge: 6 * 3600 * 1000 }))
      || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    if (!pos) return null;
    const { latitude: la, longitude: lo } = pos.coords;
    if (typeof lat === 'number' && typeof lng === 'number' && km([lat, lng], [la, lo]) < 30) return null;
    return place(la, lo);
  } catch { return null; }
}
