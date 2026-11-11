// One page of the Madinah mushaf, laid out like the printed page:
//   top margin: the surah (right) and the juz (left); the 15 lines inside a fine gold frame;
//   bottom margin: the page number.
// Every word is a glyph of the King Fahd Complex's page font. Its width is known exactly from the
// font (scripts/build_quran.py), so the app places each word itself: the line is justified the same
// way on every phone, and nothing depends on how a phone measures text. Positions are physical
// (left to right, inside a left-to-right box) so they mean the same thing on Android, iPhone and web.
import React, { memo, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { isBasmala, isTitle, juzOf, PAGES, pos, surahName, surahsOn, Word } from '../quran';
import { family, loadPage, usePageFonts } from '../quran/fonts';
import { F } from '../theme';

export const BSML = 'QCF_BSML';
const UPM = 2500;
const LINE_UNITS = 38914 * 1.06;   // a full printed line, with a little air between its words
const MIN_GAP = 150;                // the least space between two words, in font units
const ROW = 1.72;                   // the least line spacing (the printed page's), in font sizes
const ROW_MAX = 2.15;               // on tall screens the lines spread out to fill the page, up to this
const PART_GAP = 700;               // the space after a ۞ sign, in font units
const BASMALA = String.fromCharCode(0xf3);   // the basmala as drawn by the Complex (title font)
const AD = '٠١٢٣٤٥٦٧٨٩';
const ar = (n: number) => String(n).replace(/[0-9]/g, (d) => AD[+d]);

export type Sheet = { fs: number; row: number; textW: number; blockH: number; top: number; left: number; margin: number };
/** Where everything goes on a page of the given size. All pages share the same size. */
export function sheetFor(width: number, height: number): Sheet {
  const margin = Math.max(26, Math.min(40, height * 0.045));   // top and bottom margins (surah, page number)
  const side = Math.max(14, width * 0.045);
  const frame = 10;                                              // space between frame and text
  const availW = width - 2 * side - 2 * frame;
  const availH = height - 2 * margin - 2 * frame;
  const fs = Math.max(10, Math.min((availW * UPM) / LINE_UNITS, availH / 15 / ROW));
  const row = Math.min(fs * ROW_MAX, availH / 15);
  const textW = (fs * LINE_UNITS) / UPM;
  const blockH = row * 15;
  return { fs, row, textW, blockH, top: margin + frame + (availH - blockH) / 2, left: (width - textW) / 2, margin };
}

type Props = {
  page: number; width: number; height: number;
  ink: string; faint: string; gold: string; muted: string;
  /** words before `from` or after `to` (positions, see quran/pos) are shown faint */
  from?: number; to?: number;
};

const wordW = (w: Word) => (Array.isArray(w[1]) ? w[1].reduce((a, b) => a + b, 0) + PART_GAP * (w[1].length - 1) : w[1]);

/** A surah title: a slim cartouche of double gold lines with the surah's name. */
function Title({ name, w, h, gold, ink }: { name: string; w: number; h: number; gold: string; ink: string }) {
  const H = Math.min(h * 0.86, w * 0.12); const y = (h - H) / 2; const r = H / 2; const x0 = 2, x1 = w - 2;
  const pt = (inset: number) => `M${x0 + r + inset} ${y + inset} L${x1 - r - inset} ${y + inset} Q${x1 - inset} ${y + H / 2} ${x1 - r - inset} ${y + H - inset} L${x0 + r + inset} ${y + H - inset} Q${x0 + inset} ${y + H / 2} ${x0 + r + inset} ${y + inset} Z`;
  return (
    <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={w} height={h} style={{ position: 'absolute' }}>
        <Path d={pt(0)} stroke={gold} strokeWidth={1.3} fill="none" />
        <Path d={pt(H * 0.13)} stroke={gold} strokeWidth={0.7} fill="none" opacity={0.75} />
        <Rect x={w / 2 - H * 0.08} y={y - H * 0.08} width={H * 0.16} height={H * 0.16} transform={`rotate(45 ${w / 2} ${y})`} fill={gold} />
        <Rect x={w / 2 - H * 0.08} y={y + H - H * 0.08} width={H * 0.16} height={H * 0.16} transform={`rotate(45 ${w / 2} ${y + H})`} fill={gold} />
      </Svg>
      <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: H * 0.5, lineHeight: H * 0.9, color: ink, textAlign: 'center', includeFontPadding: false }}>{`سورة ${name}`}</Text>
    </View>
  );
}

function MushafPageImpl({ page, width, height, ink, faint, gold, muted, from, to }: Props) {
  const [ready] = usePageFonts([page]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true; setFailed(false);
    loadPage(page).then((ok) => { if (alive && !ok) setFailed(true); });
    return () => { alive = false; };
  }, [page]);
  const S = sheetFor(width, height);
  const lines = PAGES[page - 1];
  const centered = page <= 2;                      // the first two pages: short centred lines
  const fam = family(page);
  const inRange = (x: number) => (from == null || x >= from) && (to == null || x <= to);
  const surahs = surahsOn(page);
  // the first two pages sit in the middle of the frame
  const y0 = centered ? S.top + (S.blockH - lines.length * S.row) / 2 : S.top;
  const box = S.fs * 2.4;                          // a word's text box: tall enough for every mark

  return (
    <View style={{ width, height, direction: 'ltr' }} accessible accessibilityLabel={`صفحة ${page}`}>
      {/* margins: surah (right), juz (left), page number (bottom) */}
      <View style={{ position: 'absolute', top: 0, left: S.left, width: S.textW, height: S.margin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: F.title, fontSize: 13.5, color: muted }}>{`الجزء ${ar(juzOf(page))}`}</Text>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: F.title, fontSize: 13.5, color: muted, textAlign: 'right' }}>{surahs.map(surahName).join('، ')}</Text>
      </View>
      <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
        <Rect x={S.left - 9} y={S.top - 9} width={S.textW + 18} height={S.blockH + 18} rx={3} stroke={gold} strokeWidth={0.9} fill="none" opacity={0.55} />
        <Rect x={S.left - 6} y={S.top - 6} width={S.textW + 12} height={S.blockH + 12} rx={2} stroke={gold} strokeWidth={0.5} fill="none" opacity={0.4} />
      </Svg>
      <View style={{ position: 'absolute', bottom: 0, left: 0, width, height: S.margin, alignItems: 'center', justifyContent: 'center' }}>
        <Text allowFontScaling={false} style={{ fontFamily: F.title, fontSize: 14, color: muted }}>{ar(page)}</Text>
      </View>

      {!ready ? (
        <View style={{ position: 'absolute', top: S.top, left: S.left, width: S.textW, height: S.blockH, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.uiMed, fontSize: 15, color: ink, textAlign: 'center' }}>
            {failed ? 'تحتاج هذه الصفحة إلى الإنترنت مرة واحدة' : 'جارٍ تجهيز الصفحة…'}
          </Text>
          {failed ? (
            <Pressable accessibilityRole="button" onPress={() => { setFailed(false); loadPage(page).then((ok) => setFailed(!ok)); }}
              style={{ marginTop: 12, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: gold }}>
              <Text style={{ fontFamily: F.uiBold, fontSize: 14, color: gold }}>إعادة المحاولة</Text>
            </Pressable>
          ) : null}
        </View>
      ) : lines.map((line, li) => {
        const top = y0 + li * S.row;
        if (isTitle(line)) {
          return (
            <View key={li} style={{ position: 'absolute', top, left: S.left, opacity: inRange(pos(page, li, 0)) ? 1 : 0.3 }}>
              <Title name={surahName(line[1])} w={S.textW} h={S.row} gold={gold} ink={ink} />
            </View>
          );
        }
        if (isBasmala(line)) {
          const fsB = (S.textW * 0.5) / 5.07;          // its letters span about half the line
          const bw = fsB * 6.42;                       // the glyph's advance (13131 / 2048 em)
          return (
            <Text key={li} allowFontScaling={false}
              style={{ position: 'absolute', top: top + (S.row - fsB * 2.6) / 2, left: S.left + (S.textW - bw) / 2, width: bw, height: fsB * 2.6, lineHeight: fsB * 2.6,
                fontFamily: BSML, fontSize: fsB, color: ink, textAlign: 'center', includeFontPadding: false, opacity: inRange(pos(page, li, 0)) ? 1 : 0.3 }}>{BASMALA}</Text>
          );
        }
        // place the words from the right edge leftwards, spreading the spare width between them
        const words = line as Word[];
        const widths = words.map(wordW);
        const sum = widths.reduce((a, b) => a + b, 0);
        let scale = S.fs / UPM;                               // font units → points
        let gap = 0;
        if (centered) gap = S.fs * 0.3;
        else {
          const gaps = Math.max(1, words.length - 1);
          // a few lines are a little wider than the rest: draw them a little smaller
          if ((sum + MIN_GAP * gaps) * scale > S.textW) scale = S.textW / (sum + MIN_GAP * gaps);
          gap = words.length > 1 ? (S.textW - sum * scale) / gaps : 0;
        }
        const fsl = scale * UPM;
        const lineW = sum * scale + gap * (words.length - 1);
        let x = S.left + (S.textW + lineW) / 2;               // right edge of the first word
        const pad = fsl * 0.5;
        return words.map((w, wi) => {
          const color = inRange(pos(page, li, wi)) ? ink : faint;
          const parts = Array.isArray(w[1]) ? w[0].split(' ') : [w[0]];
          const pw = Array.isArray(w[1]) ? w[1] : [w[1]];
          const out = parts.map((g, k) => {
            const ww = pw[k] * scale;
            const el = (
              <Text key={`${li}-${wi}-${k}`} allowFontScaling={false}
                style={{ position: 'absolute', top: top + (S.row - box * (fsl / S.fs)) / 2, left: x - ww - pad, width: ww + 2 * pad,
                  height: box * (fsl / S.fs), lineHeight: box * (fsl / S.fs), fontFamily: fam, fontSize: fsl, color, textAlign: 'center', includeFontPadding: false }}>{g}</Text>
            );
            x -= ww + (k < parts.length - 1 ? PART_GAP * scale : 0);
            return el;
          });
          x -= gap;
          return out;
        });
      })}
    </View>
  );
}

export const MushafPage = memo(MushafPageImpl);
