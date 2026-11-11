#!/usr/bin/env python3
# Al-Tafsir al-Muyassar (King Fahd Complex for the Printing of the Holy Quran), ayah by ayah,
# for the "meaning of this ayah" sheet in the reader. Nothing here is typed by hand.
# Source: Quran.com API, tafsir 16 (ar-tafsir-muyassar). A copy of each download is kept in the
# work folder; the text is written out exactly as received, with only HTML tags removed.
#   python3 scripts/build_tafsir.py <work dir>
# Writes src/quran/tafsir/h0.json .. h6.json: one file per weekly part, loaded only when asked for.
import json, os, re, sys, time, urllib.request
W = sys.argv[1]; OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'quran')
os.makedirs(f'{W}/tafsir16', exist_ok=True); os.makedirs(f'{OUT}/tafsir', exist_ok=True)
meta = json.load(open(f'{OUT}/meta.json'))

def chapter(n):
    path = f'{W}/tafsir16/c{n:03d}.json'
    if os.path.exists(path): return json.load(open(path))
    rows = []; page = 1
    while True:
        url = f'https://api.quran.com/api/v4/tafsirs/16/by_chapter/{n}?per_page=50&page={page}'
        for attempt in range(4):
            try:
                d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'tasbee-build'}), timeout=40)); break
            except Exception as e:
                if attempt == 3: raise
                time.sleep(2 + attempt * 2)
        rows += d['tafsirs']
        nxt = (d.get('pagination') or {}).get('next_page')
        if not nxt: break
        page = nxt
    json.dump(rows, open(path, 'w'), ensure_ascii=False)
    return rows

g_text = {}
def group(k):
    path = f'{W}/tafsir16/a{k.replace(":", "_")}.json'
    if os.path.exists(path): d = json.load(open(path))
    else:
        d = json.load(urllib.request.urlopen(urllib.request.Request(f'https://api.quran.com/api/v4/tafsirs/16/by_ayah/{k}', headers={'User-Agent': 'tasbee-build'}), timeout=40))
        json.dump(d, open(path, 'w'), ensure_ascii=False)
    g_text[k] = d['tafsir']['text']
    return list(d['tafsir']['verses'].keys())

grouped = []
clean = lambda t: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', t or '')).strip()
text = {}; empty = []
for s in range(1, 115):
    rows = chapter(s); want = meta['surahs'][s - 1][2]
    seen = {}
    for r in rows:
        assert r['resource_id'] == 16 and r['slug'] == 'ar-tafsir-muyassar', r
        seen[r['verse_key']] = clean(r['text'])
    for a in range(1, want + 1):
        k = f'{s}:{a}'
        if k not in seen:
            # the tafsir explains a few runs of ayahs together: the text is filed under the first
            # ayah of the run, and the others point to it ("@4:66")
            g = group(k); first = min(g, key=lambda x: int(x.split(':')[1]))
            assert first in seen and first != k and all(x.split(':')[0] == str(s) for x in g), (k, g)
            assert clean(g_text[k]) == seen[first], f'{k}: the run text differs from {first}'
            text[k] = '@' + first; grouped.append(k); continue
        if not seen[k]: empty.append(k)
        text[k] = seen[k]
assert len(text) == 6236
total = 0
for d, part in enumerate(meta['parts']):
    out = {k: v for k, v in text.items() if part['surahs'][0] <= int(k.split(':')[0]) <= part['surahs'][1]}
    total += len(out)
    json.dump(out, open(f'{OUT}/tafsir/h{d}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'h{d}.json', len(out), 'ayahs', os.path.getsize(f'{OUT}/tafsir/h{d}.json') // 1024, 'KB')
assert total == 6236
print('empty entries:', len(empty), empty[:12])
print('ayahs explained with the ayah before them:', len(grouped), grouped[:10])
print('tags left:', sum(1 for v in text.values() if '<' in v or '>' in v))
