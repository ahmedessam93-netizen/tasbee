# Builds the app's Quran data from the Madinah mushaf (King Fahd Complex, 1421H print, "QCF V2").
#
#   python3 scripts/build_quran.py <work dir>
#
# Sources (nothing is typed by hand):
#   - quran.com API v4: every word of every page with its glyph code (code_v2) and line number.
#   - The Complex's page fonts QCF2001.ttf … QCF2604.ttf (one font per page; each word is one glyph).
#
# Checks (the build stops if any fails):
#   - 6,236 verses and 77,429 words (+ one verse-end mark per verse).
#   - On every page, the word glyphs used are exactly the page font's glyphs FC41, FC42, … in
#     reading order, each used once. So no word is missing, repeated or out of order.
#   - Every one of the 15 lines of every page (from page 3) is a line of text, a surah title or a
#     basmala, and the titles and basmalas fall exactly where a surah begins.
#   - Every font file matches its SHA-256 (the same bytes are served by quran.com and jsDelivr).
#
# Output (in src/quran/):
#   pages.json    [page][line] = ["s", surah] | ["b", surah] | [word glyphs…]
#   meta.json     surah names and first pages, juz of each page, page line widths, font hashes,
#                 the seven weekly parts and their five sittings.
import hashlib, json, os, sys, time, urllib.request, collections
from fontTools.ttLib import TTFont

W = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'quran')
FONT_COMMIT = '8a4f39d563ea69c994416a1692827e38156c548d'  # github.com/nuqayah/qpc-fonts
os.makedirs(f'{W}/api', exist_ok=True); os.makedirs(f'{W}/fonts', exist_ok=True); os.makedirs(OUT, exist_ok=True)

def get(url, path, binary=False):
    if os.path.exists(path) and os.path.getsize(path) > 0: return
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'curl/8.5.0'})
            data = urllib.request.urlopen(req, timeout=90).read()
            open(path, 'wb').write(data); return
        except Exception:
            time.sleep(2 + 3 * i)
    raise SystemExit('download failed: ' + url)

# code_v2 (and no code_v1) so that line_number is the 1421H line
API = 'https://api.quran.com/api/v4/verses/by_page/%d?words=true&word_fields=code_v2,line_number,page_number,text_uthmani&fields=juz_number,hizb_number,rub_el_hizb_number,page_number&per_page=300&translations='
for p in range(1, 605):
    get(API % p, f'{W}/api/p{p:03d}.json')
    get(f'https://raw.githubusercontent.com/nuqayah/qpc-fonts/{FONT_COMMIT}/mushaf-v2/QCF2{p:03d}.ttf', f'{W}/fonts/QCF2{p:03d}.ttf', True)
get('https://api.quran.com/api/v4/chapters?language=ar', f'{W}/api/chapters.json')

words, verses = {}, {}
for p in range(1, 605):
    for v in json.load(open(f'{W}/api/p{p:03d}.json'))['verses']:
        verses[v['verse_key']] = v
        for w in v['words']:
            words[(v['verse_key'], w['position'])] = w
vkey = lambda vk: tuple(map(int, vk.split(':')))
order = sorted(words, key=lambda k: (*vkey(k[0]), k[1]))
types = collections.Counter(words[k]['char_type_name'] for k in order)
assert len(verses) == 6236, len(verses)
assert types['word'] == 77429 and types['end'] == 6236, types

# ---- glyph completeness per page ----
fonts = {}
for p in range(1, 605):
    f = TTFont(f'{W}/fonts/QCF2{p:03d}.ttf'); fonts[p] = f
    seq = [ord(c) for k in order if words[k]['page_number'] == p for c in words[k]['code_v2'] if c != ' ']
    assert seq == list(range(0xFC41, 0xFC41 + len(seq))), f'page {p}: word glyphs not in order'
    cm = f.getBestCmap()
    assert all(c in cm for c in seq), f'page {p}: glyph missing from font'

# ---- lines ----
lines = collections.defaultdict(lambda: collections.defaultdict(list))
for k in order:
    w = words[k]; lines[w['page_number']][w['line_number']].append(w['code_v2'])
special = {}
prev = lambda p, l: (p, l - 1) if l > 1 else (p - 1, 15)
for s in range(1, 115):
    w = words[(f'{s}:1', 1)]; pl = (w['page_number'], w['line_number'])
    if s not in (1, 9):
        pl = prev(*pl); special[pl] = ['b', s]
    pl = prev(*pl); special[pl] = ['s', s]
pages = []
for p in range(1, 605):
    L = []
    for l in range(1, 16):
        if l in lines[p]:
            assert (p, l) not in special, f'page {p} line {l}: title over text'
            L.append(lines[p][l])
        elif (p, l) in special:
            L.append(special[(p, l)])
        else:
            assert p <= 2, f'page {p} line {l} is empty'
    pages.append(L)
    if p > 2: assert len(L) == 15

# ---- widths: each page's full line, in font units ----
def adv(p):
    cm = fonts[p].getBestCmap(); hm = fonts[p]['hmtx'].metrics
    return lambda s: sum(hm[cm[ord(c)]][0] for c in s if c != ' ')
lineW = []
for p in range(1, 605):
    a = adv(p); ws = sorted(sum(a(w) for w in L) for L in pages[p - 1] if L and L[0] not in ('s', 'b'))
    lineW.append(ws[len(ws) // 2])

# lines wider than the page's usual line (a few, by up to ~13%): drawn slightly smaller to fit
wide = {}
for p in range(1, 605):
    a = adv(p)
    for li, L in enumerate(pages[p - 1]):
        if L and L[0] not in ('s', 'b'):
            r = sum(a(w) for w in L) / 38914
            if r > 1.02: wide[f'{p}:{li}'] = round(r, 4)

# ---- the seven parts and their five sittings ----
# stream of (page, line index, word index, verse key, word position, weight in lines)
stream = []
for p in range(1, 605):
    a = adv(p); Wp = lineW[p - 1]
    for li, L in enumerate(pages[p - 1]):
        if L[0] == 'b': stream.append((p, li, 0, None, 0, 0.5)); continue
        if L[0] == 's': stream.append((p, li, 0, None, 0, 0.0)); continue
        # words of this line, in order, with their verse key
        for wi, code in enumerate(L): stream.append((p, li, wi, None, -1, a(code) / Wp))
# attach verse keys to word entries (same order as `order`)
it = iter(order); fixed = []
for t in stream:
    if t[4] == -1:
        k = next(it); t = (t[0], t[1], t[2], k[0], k[1], t[5])
    fixed.append(t)
stream = fixed
PARTS = [1, 5, 10, 17, 26, 37, 50, 115]
PART_NAMES = ['الفاتحة – النساء', 'المائدة – التوبة', 'يونس – النحل', 'الإسراء – الفرقان', 'الشعراء – يس', 'الصافات – الحجرات', 'ق – الناس']
parts = []
for d in range(7):
    s0, s1 = PARTS[d], PARTS[d + 1]
    idx = [i for i, t in enumerate(stream) if t[3] and s0 <= vkey(t[3])[0] < s1]
    a0, b0 = idx[0], idx[-1]
    while a0 > 0 and stream[a0 - 1][3] is None: a0 -= 1  # the first surah's title and basmala
    seg = stream[a0:b0 + 1]
    cum = [0.0]
    for t in seg: cum.append(cum[-1] + t[5])
    total = cum[-1]
    cands = []
    for i, t in enumerate(seg):
        if i == 0 or not t[3] or t[4] != 1: continue
        s, ay = vkey(t[3])
        rub = ay > 1 and verses[t[3]]['rub_el_hizb_number'] != verses[f'{s}:{ay - 1}']['rub_el_hizb_number']
        if ay == 1 or rub:
            j = i
            while j > 0 and seg[j - 1][3] is None: j -= 1  # a surah keeps its title and basmala
            cands.append((j, cum[j], 'surah' if ay == 1 else 'rub'))
    chosen, last = [], 0.0
    for k in range(1, 5):
        target = total * k / 5
        pool = [c for c in cands if c[1] > last + total * 0.08]
        left = 4 - k
        usable = pool[:max(1, len(pool) - left)] if left else pool
        best = min(usable, key=lambda c: abs(c[1] - target)); chosen.append(best); last = best[1]
    bounds = [0] + [c[0] for c in chosen] + [len(seg)]
    sits = []
    for k in range(5):
        x, y = bounds[k], bounds[k + 1]
        vs = [t[3] for t in seg[x:y] if t[3]]
        sits.append({'from': list(seg[x][:3]), 'to': list(seg[y - 1][:3]), 'w': round(cum[y] - cum[x], 2), 'v': [vs[0], vs[-1]]})
    parts.append({'name': PART_NAMES[d], 'surahs': [s0, s1 - 1], 'pages': [seg[0][0], seg[-1][0]], 'w': round(total, 2), 'sittings': sits})

chapters = json.load(open(f'{W}/api/chapters.json'))['chapters']
assert len(chapters) == 114
pageMeta = []
for p in range(1, 605):
    vs = [v for v in verses.values() if v['page_number'] == p]
    pageMeta.append(min(v['juz_number'] for v in vs))
# surahs whose verses appear on each page (for the page header)
pageSurahs = [sorted({vkey(k[0])[0] for k in order if words[k]['page_number'] == p}) for p in range(1, 605)]
fontsMeta = []
for p in range(1, 605):
    b = open(f'{W}/fonts/QCF2{p:03d}.ttf', 'rb').read()
    fontsMeta.append([len(b), hashlib.sha256(b).hexdigest()])
meta = {
    'source': 'Madinah Mushaf, King Fahd Glorious Quran Printing Complex, 1421H print (QCF V2 page fonts)',
    'fontCommit': FONT_COMMIT,
    'upm': 2500,
    'surahs': [[c['name_arabic'], c['pages'][0], c['verses_count']] for c in chapters],
    'juz': pageMeta,
    'pageSurahs': pageSurahs,
    'lineW': lineW,
    'wide': wide,
    'fonts': fontsMeta,
    'parts': parts,
}
# Each word goes out with its width in font units, so the app places every word itself (exactly
# as the line is laid out in print) instead of relying on each phone's text measuring.
# A word written with a quarter-hizb sign before it ("۞ word") is two parts: [glyphs, [w1, w2]].
out_pages = []
for p in range(1, 605):
    a = adv(p); outL = []
    for L in pages[p - 1]:
        if L[0] in ('s', 'b'): outL.append(L); continue
        ws = []
        for code in L:
            bits = code.split(' ')
            ws.append([code, a(code)] if len(bits) == 1 else [code, [a(x) for x in bits]])
        outL.append(ws)
    out_pages.append(outL)
json.dump(out_pages, open(f'{OUT}/pages.json', 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump(meta, open(f'{OUT}/meta.json', 'w'), ensure_ascii=False, separators=(',', ':'))
for d, pt in enumerate(parts):
    print(d + 1, pt['name'], 'pages', pt['pages'], 'lines', pt['w'])
    for s in pt['sittings']: print('   ', s['v'][0], '→', s['v'][1], 'p', s['from'][0], '–', s['to'][0], 'lines', s['w'])
print('ok: 604 pages, 6236 verses, 77429 words; every page glyph-complete')
