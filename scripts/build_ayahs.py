#!/usr/bin/env python3
# Where each ayah sits on the pages of the mushaf, for listening: the ayah being recited is lit
# on the page, and a long press on any word finds its ayah.
# Source: the same Quran.com data the pages were built from (scripts/build_quran.py keeps a copy
# of it in its work folder). Nothing here is typed by hand.
#   python3 scripts/build_ayahs.py <work dir of build_quran.py>
# Writes src/quran/ayahs.json: for each surah, for each ayah, [first, last] where a place is
# page * 10000 + line * 100 + word, the same numbering the app uses for every word (quran/pos).
import collections, json, os, sys
W = sys.argv[1]; OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'quran')
words = {}
for p in range(1, 605):
    for v in json.load(open(f'{W}/api/p{p:03d}.json'))['verses']:
        for w in v['words']:
            words[(v['verse_key'], w['position'])] = w
vkey = lambda vk: tuple(map(int, vk.split(':')))
order = sorted(words, key=lambda k: (*vkey(k[0]), k[1]))
assert len(order) == 77429 + 6236, len(order)
# the same correction as build_quran.py: the end mark of 84:21 belongs on the line of its last word
_fix = words[('84:21', 7)]
if _fix['line_number'] == 13 and words[('84:21', 6)]['line_number'] == 14: _fix['line_number'] = 14

# the lines of each page, exactly as build_quran.py lays them out (titles and basmalas take a line)
lines = collections.defaultdict(lambda: collections.defaultdict(list))
for k in order:
    w = words[k]; lines[w['page_number']][w['line_number']].append(k)
special = set()
prev = lambda p, l: (p, l - 1) if l > 1 else (p - 1, 15)
for s in range(1, 115):
    w = words[(f'{s}:1', 1)]; pl = (w['page_number'], w['line_number'])
    if s not in (1, 9): pl = prev(*pl); special.add(pl)
    pl = prev(*pl); special.add(pl)
place = {}
pages = json.load(open(f'{OUT}/pages.json'))
for p in range(1, 605):
    li = 0
    for l in range(1, 16):
        if l in lines[p]:
            row = pages[p - 1][li]
            assert row[0] not in ('s', 'b') and len(row) == len(lines[p][l]), f'page {p} line {l}: the app has {len(row)} words, the source {len(lines[p][l])}'
            for wi, k in enumerate(lines[p][l]):
                assert row[wi][0] == words[k]['code_v2'], f'page {p} line {l} word {wi}: glyph differs'
                place[k] = p * 10000 + li * 100 + wi
            li += 1
        elif (p, l) in special:
            assert pages[p - 1][li][0] in ('s', 'b'); li += 1
    assert li == len(pages[p - 1]), f'page {p}: line count'

out = [[] for _ in range(114)]
last = 0
for k in order:
    s, a = vkey(k[0]); x = place[k]
    assert x > last, f'{k}: out of order'; last = x
    if len(out[s - 1]) < a: out[s - 1].append([x, x])
    else: out[s - 1][a - 1][1] = x
meta = json.load(open(f'{OUT}/meta.json'))
for s in range(114): assert len(out[s]) == meta['surahs'][s][2], f'surah {s + 1}: {len(out[s])} ayahs'
assert sum(map(len, out)) == 6236
json.dump(out, open(f'{OUT}/ayahs.json', 'w'), separators=(',', ':'))
print('ayahs.json:', sum(map(len, out)), 'ayahs,', os.path.getsize(f'{OUT}/ayahs.json'), 'bytes')
