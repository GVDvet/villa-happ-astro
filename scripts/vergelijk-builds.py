"""Vergelijkt de zichtbare tekst van twee builds.

Gebruik:
    npm run build
    python scripts/tekst-uit-build.py .tmp/voor
    # wijzigingen doorvoeren
    npm run build
    python scripts/tekst-uit-build.py .tmp/na
    python scripts/vergelijk-builds.py .tmp/voor .tmp/na

Bedoeld voor wijzigingen die de opmaak niet horen te raken: een
dependency-upgrade, een refactor, een compilerwissel. Verschilt er iets,
dan is dat per definitie een regressie.

Let op: dit werkt alleen als de tekst met scripts/tekst-uit-build.py is
gemaakt. Die verwijdert tags ZONDER vervangende spatie. Zet je er wel een
spatie voor in de plaats, dan is de vergelijking blind voor precies de
fout die je zoekt. Zie docs/astro-7-migratie.md.
"""
import sys
import pathlib
import re
import difflib

if len(sys.argv) != 3:
    print(__doc__)
    sys.exit(1)

voor = pathlib.Path(sys.argv[1])
na = pathlib.Path(sys.argv[2])


def tekst(p):
    return re.sub(r'\s+', ' ', p.read_text(encoding='utf-8')).strip()


bestanden = sorted(voor.glob('*'))
verschillen = []

for f in bestanden:
    g = na / f.name
    if not g.exists():
        verschillen.append((f.name, ['      ONTBREEKT in de tweede build']))
        continue
    a, b = tekst(f), tekst(g)
    if a == b:
        continue
    sm = difflib.SequenceMatcher(None, a, b)
    stukken = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            continue
        stukken.append('      voor: ...' + repr(a[max(0, i1 - 45):i2 + 45]))
        stukken.append('      na  : ...' + repr(b[max(0, j1 - 45):j2 + 45]))
    verschillen.append((f.name, stukken[:6]))

extra = sorted(p.name for p in na.glob('*') if not (voor / p.name).exists())

print(f"Pagina's vergeleken : {len(bestanden)}")
print(f"Met een verschil    : {len(verschillen) or 'geen'}")
if extra:
    print(f"Nieuw in de tweede  : {', '.join(extra)}")
print()

for naam, stukken in verschillen[:10]:
    print(' !!', naam)
    for s in stukken:
        print(s)
    print()

if verschillen:
    print('Elk verschil hierboven is een regressie, tenzij je hem bewust hebt')
    print('aangebracht. Klaar is het pas bij nul.')
    sys.exit(1)

print('Geen verschil. De zichtbare tekst is op elke pagina gelijk gebleven.')
