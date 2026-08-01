"""Haalt de zichtbare tekst uit elke gebouwde HTML-pagina.

Gebruik:  node/npm run build  &&  python scripts/tekst-uit-build.py <map>
Daarna twee builds vergelijken met scripts/vergelijk-builds.py.

Strikte extractie: tags worden verwijderd ZONDER vervangende spatie.

De vorige versie zette wel een spatie terug, en was daardoor precies blind
voor de fout die we zoeken: een spatie die tussen tekst en een inline
element wegvalt. "stel je via <a>adres</a>" en "stel je via<a>adres</a>"
leverden allebei "stel je via adres" op.
"""
import sys
import pathlib
import re
import html

uit = pathlib.Path(sys.argv[1])
uit.mkdir(parents=True, exist_ok=True)
basis = pathlib.Path('.vercel/output/static')

for f in sorted(basis.rglob('*.html')):
    s = f.read_text(encoding='utf-8', errors='replace')
    s = re.sub(r'<(script|style)\b.*?</\1>', '\n', s, flags=re.S | re.I)
    s = re.sub(r'<[^>]+>', '', s)
    s = re.sub(r'[ \t]+', ' ', html.unescape(s))
    s = re.sub(r'\s*\n\s*', '\n', s).strip()
    naam = str(f.relative_to(basis)).replace('\\', '_').replace('/', '_')
    (uit / naam).write_text(s, encoding='utf-8')

print(len(list(uit.glob('*'))), 'pagina-teksten (strikt) in', uit.name)
