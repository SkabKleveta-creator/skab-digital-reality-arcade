from pathlib import Path
from html.parser import HTMLParser
import sys

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'evidence'
REQUIRED_PAGES = [
    'index.html',
    'fps-002/index.html',
    'blackbox-squadron/index.html',
    'connection-trace/index.html',
    'anchor-run/index.html',
    'signal-sweeper/index.html',
    'relay-rush/index.html',
    'node-blaster/index.html',
    'breach-drop/index.html',
]
REQUIRED_SECTIONS = [
    'Exhibit',
    'Initial Question',
    'Root Cause',
    'Ken’s Logic',
    'Observed Failure Modes',
    'Corrections Applied',
    'The Proof Is',
    'Finding',
    'Approval Control',
]

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.scripts = []
        self.styles = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and 'href' in attrs:
            self.links.append(attrs['href'])
        if tag == 'script' and 'src' in attrs:
            self.scripts.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet' and 'href' in attrs:
            self.styles.append(attrs['href'])

def rel_exists(current_file: Path, rel: str) -> bool:
    if rel.startswith(('http://','https://','mailto:','#')):
        return True
    if '#' in rel:
        rel = rel.split('#', 1)[0]
    if rel == '':
        return True
    target = (current_file.parent / rel).resolve()
    # Added-pages-only package intentionally omits repo-root files. Allow Home links
    # that resolve to the existing repository root index after the evidence folder is copied.
    if rel in ('../index.html', '../../index.html') and target == ROOT / 'index.html':
        return True
    return target.exists()

failures = []

# Scope test: do not include root homepage replacement.
if (ROOT / 'index.html').exists():
    failures.append('Root index.html exists in package. This violates added-pages-only scope.')
if (ROOT / '404.html').exists():
    failures.append('Root 404.html exists in package. This violates added-pages-only scope.')

for page in REQUIRED_PAGES:
    f = EVIDENCE / page
    if not f.exists():
        failures.append(f'Missing required page: evidence/{page}')
        continue
    text = f.read_text(encoding='utf-8')
    if '<!DOCTYPE html>' not in text[:40]:
        failures.append(f'Missing doctype: evidence/{page}')
    if '<meta name="viewport"' not in text:
        failures.append(f'Missing viewport meta: evidence/{page}')
    if page != 'index.html':
        for section in REQUIRED_SECTIONS:
            if section not in text:
                failures.append(f'Missing section "{section}" in evidence/{page}')
        if 'Pending Ken Review' not in text:
            failures.append(f'Missing approval gate in evidence/{page}')
    parser = LinkParser()
    parser.feed(text)
    for ref in parser.links + parser.scripts + parser.styles:
        if not rel_exists(f, ref):
            failures.append(f'Broken relative reference in evidence/{page}: {ref}')

if failures:
    print('QA RESULT: FAIL')
    for failure in failures:
        print(f'- {failure}')
    sys.exit(1)

print('QA RESULT: PASS')
print(f'Checked {len(REQUIRED_PAGES)} HTML pages.')
print('Scope confirmed: no root index.html or 404.html included.')
print('Required evidence sections confirmed on game pages.')
print('Relative CSS / JS / internal evidence links resolved.')
