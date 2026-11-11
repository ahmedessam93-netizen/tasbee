// @ts-nocheck
// Prayer times from solar position (standard algorithm; same approach as the
// widely used calculators). All maths in UTC; returns Date objects.
const PT = (() => {
  const METHODS = {
    // The UAE's published timetable adds a few minutes of caution to the computed times:
    // sunrise 3 minutes earlier, Dhuhr 2 and Maghrib 3 minutes later (checked against the
    // published Dubai table for 11 and 12 Nov 2026). `shift` is in whole minutes, after rounding.
    dubai:  { name: 'الإمارات (الهيئة العامة)', fajr: 18.2, isha: 18.2, shift: { sunrise: -3, dhuhr: 2, maghrib: 3 } },
    egypt:  { name: 'الهيئة المصرية العامة للمساحة', fajr: 19.5, isha: 17.5 },
    makkah: { name: 'أم القرى (السعودية)', fajr: 18.5, ishaMin: 90 },
    mwl:    { name: 'رابطة العالم الإسلامي', fajr: 18, isha: 17 },
    karachi:{ name: 'جامعة العلوم الإسلامية (كراتشي)', fajr: 18, isha: 18 },
    kuwait: { name: 'الكويت', fajr: 18, isha: 17.5 },
    qatar:  { name: 'قطر', fajr: 18, ishaMin: 90 },
    turkey: { name: 'تركيا (ديانت)', fajr: 18, isha: 17 },
    isna:   { name: 'أمريكا الشمالية (ISNA)', fajr: 15, isha: 15 },
  };
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
  const dsin = d => Math.sin(rad(d)), dcos = d => Math.cos(rad(d)), dtan = d => Math.tan(rad(d));
  const darcsin = x => deg(Math.asin(x)), darccos = x => deg(Math.acos(x)), darccot = x => deg(Math.atan(1 / x));

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  // Sun declination and equation of time (minutes) for a Julian date (US NOAA simplification, as in PrayTimes)
  function sun(jd) {
    const D = jd - 2451545.0;
    const g = fix(357.529 + 0.98560028 * D, 360);
    const q = fix(280.459 + 0.98564736 * D, 360);
    const L = fix(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g), 360);
    const e = 23.439 - 0.00000036 * D;
    const decl = darcsin(dsin(e) * dsin(L));
    const RA = darctan2(dcos(e) * dsin(L), dcos(L)) / 15;
    const eqt = q / 15 - fix(RA, 24);
    return { decl, eqt };
  }
  function darctan2(y, x) { return deg(Math.atan2(y, x)); }

  // hour angle time (in hours, UTC-based fraction of day) for sun angle below horizon
  function timeForAngle(angle, decl, lat, noon, afternoon) {
    const v = (-dsin(angle) - dsin(decl) * dsin(lat)) / (dcos(decl) * dcos(lat));
    if (v < -1 || v > 1) return NaN;
    const t = darccos(v) / 15;
    return noon + (afternoon ? t : -t);
  }
  function asrAngle(factor, decl, lat) { return -darccot(factor + dtan(Math.abs(lat - decl))); }

  /**
   * compute(dateLocal, lat, lng, opts) -> { fajr, sunrise, dhuhr, asr, maghrib, isha } as Date
   * opts: { method: key of METHODS, asr: 1|2 }
   */
  function compute(date, lat, lng, opts = {}) {
    const m = METHODS[opts.method] || METHODS.dubai;
    const y = date.getFullYear(), mo = date.getMonth() + 1, d = date.getDate();
    const jd0 = julian(y, mo, d);
    // iterate once with time-of-day refinement for accuracy (declination varies within the day)
    const out = {};
    const defs = {
      fajr:    (s, noon) => timeForAngle(m.fajr, s.decl, lat, noon, false),
      sunrise: (s, noon) => timeForAngle(0.833, s.decl, lat, noon, false),
      dhuhr:   (s, noon) => noon,
      asr:     (s, noon) => timeForAngle(asrAngle(opts.asr || 1, s.decl, lat), s.decl, lat, noon, true),
      maghrib: (s, noon) => timeForAngle(0.833, s.decl, lat, noon, true),
      isha:    (s, noon) => m.ishaMin ? NaN : timeForAngle(m.isha, s.decl, lat, noon, true),
    };
    const guess = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 15, maghrib: 18, isha: 19 };
    for (const k of Object.keys(defs)) {
      let t = guess[k] - lng / 15;              // UTC hours guess
      for (let i = 0; i < 2; i++) {
        const s = sun(jd0 + t / 24);
        const noon = 12 - lng / 15 - s.eqt;     // UTC hours of solar noon
        t = defs[k](s, noon);
        if (isNaN(t)) break;
      }
      out[k] = t;
    }
    if (m.ishaMin) out.isha = out.maghrib + m.ishaMin / 60;
    // high latitudes in summer: no solution for the twilight angle -> angle-based share of the night
    const night = 24 - (out.maghrib - out.sunrise);
    if (isNaN(out.fajr)) out.fajr = out.sunrise - night * (m.fajr / 60);
    if (isNaN(out.isha)) out.isha = out.maghrib + night * ((m.isha || 17) / 60);
    // rounding: minutes, ceil for all but sunrise (safer: slightly later), floor for sunrise
    const res = {};
    for (const k of Object.keys(out)) {
      let h = out[k];
      if (isNaN(h)) { res[k] = null; continue; }
      const mins = (k === 'sunrise' ? Math.floor(h * 60) : Math.ceil(h * 60 - 1e-9)) + ((m.shift && m.shift[k]) || 0);
      res[k] = new Date(Date.UTC(y, mo - 1, d, 0, mins, 0));
    }
    return res;
  }
  return { compute, METHODS };
})();
export default PT;
