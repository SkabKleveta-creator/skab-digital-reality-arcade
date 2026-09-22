"""Import only the two recovered game builds; never recreate missing games."""
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ['GAME_SOURCE_ROOT'])
BUILD = 'underground-2026-09-21-project-games'
PINNED = [
    ('first-kin', 'FirstKinProject', '30e1c707034f9ad6822240bb047345839219db24', ['index.html', 'src', 'assets', 'data', 'README.md']),
    ('swarm-attack', 'swarm_attack', 'af2852ff916b2486cb8a0b7368e570524e2cb2ac', ['index.html', 'dist', 'README.md', 'LEVEL-01.md', 'TESTING.md']),
]
report = {'build': BUILD, 'method': 'Byte-identical copies of pinned upstream runtime files.', 'games': [], 'excluded': ['Castle Realm', 'Terrarium'], 'not_imported': {'Kingdom Maker': 'Existing source unavailable; published build requires authentication.', 'Night Hunt: Reversed': 'Existing source unavailable; published build requires authentication.'}}
for slug, repo, commit, paths in PINNED:
    source = SOURCE / repo
    actual = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    assert actual == commit, (repo, actual, commit)
    destination = ROOT / 'games' / slug
    assert not destination.exists(), f'Refusing to replace existing game: {destination}'
    destination.mkdir(parents=True)
    files = []
    for relative in paths:
        src, dst = source / relative, destination / relative
        assert src.exists(), f'Missing source: {src}'
        if src.is_dir():
            shutil.copytree(src, dst)
            originals = [p for p in src.rglob('*') if p.is_file()]
        else:
            shutil.copy2(src, dst)
            originals = [src]
        for original in sorted(originals):
            assert not original.is_symlink(), original
            rel = original.relative_to(source)
            copied = destination / rel
            assert original.read_bytes() == copied.read_bytes(), rel
            files.append({'path': str(rel), 'bytes': copied.stat().st_size, 'sha256': hashlib.sha256(copied.read_bytes()).hexdigest()})
    provenance = {'source_repository': f'SkabKleveta-creator/{repo}', 'source_commit': commit, 'runtime_changes': 'None', 'files': files}
    (destination / 'ARCADE-SOURCE.json').write_text(json.dumps(provenance, indent=2) + '\n')
    report['games'].append({'id': slug, 'source': provenance['source_repository'], 'commit': commit, 'files': len(files), 'bytes': sum(f['bytes'] for f in files)})

index = ROOT / 'index.html'
original = index.read_text()
blob = hashlib.sha1(b'blob ' + str(len(index.read_bytes())).encode() + b'\0' + index.read_bytes()).hexdigest()
assert blob == '1cc8e3af833aba811cc3326131cb506b95497078', f'Arcade changed; review before importing: {blob}'
match = re.search(r'const catalog=(\[.*?\n\]);', original, re.S)
assert match, 'Catalog marker not found'
existing = json.loads(match.group(1))
assert not {'first-kin', 'swarm-attack'} & {g['id'] for g in existing}
base = 'https://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/'
new_games = [
    {'id': 'first-kin', 'section': 'live-playable-systems', 'format': 'Playable Prototype', 'status': 'Playable Candidate', 'evidence': 'Community Simulation', 'kicker': 'Family · Tribe · Village', 'title': 'FIRST KIN', 'description': 'Build a prehistoric community with named people. Teach skills, plan work, gather food, fish, hunt, construct a settlement, and grow from a family into a tribe and village.', 'howTo': 'Choose Light the first hearth. Assign morning and afternoon work, then Commit the sun. Build beside paths. Tap or click to manage people; drag to pan and use +/− to zoom. Hunts support WASD/arrows and Space to strike; Space also pulls the fishing line.', 'href': base + 'first-kin/', 'cover': './assets/arcade-covers/cards/29-first-kin.png', 'genre': 'Simulation', 'available': True},
    {'id': 'swarm-attack', 'section': 'live-playable-systems', 'format': 'Playable Prototype', 'status': 'Playable Candidate', 'evidence': 'Authored First Level', 'kicker': 'Hollow Wake · Third-Person Slasher', 'title': 'SWARM ATTACK', 'description': 'Explore a gothic first level with authored enemy encounters, two ward seals, a shrine checkpoint, and the Bellkeeper. Fight with melee weapons, bows, crossbows, or a sling. No firearms or timed swarms.', 'howTo': 'Enter the ruins. Move with WASD/arrows, hold click to attack, Space to dodge, Q for heavy attack, E to heal, F to swap weapons, and G to interact. V switches isometric/shoulder cameras. Touch uses the left stick and action buttons.', 'href': base + 'swarm-attack/', 'cover': './assets/arcade-covers/cards/30-swarm-attack.png', 'genre': 'Action', 'available': True},
]
combined = new_games + existing
updated = original[:match.start(1)] + json.dumps(combined, ensure_ascii=False, indent=2) + original[match.end(1):]
changes = [
    ("const order=[", "const order=['first-kin','swarm-attack',"),
    ('img.src=artwork[g.id];', 'img.src=artwork[g.id]||g.cover;'),
    ('underground-2026-09-18-01', BUILD),
]
for old, new in changes:
    expected = 2 if old.startswith('underground-') else 1
    assert updated.count(old) == expected, (old, updated.count(old))
    updated = updated.replace(old, new)
filter_tag = '<button class="ug-filter" type="button" data-filter="Experiments" aria-pressed="false">Experiments</button>'
assert updated.count(filter_tag) == 1
updated = updated.replace(filter_tag, '<button class="ug-filter" type="button" data-filter="Simulation" aria-pressed="false">Simulation</button>' + filter_tag)
index.write_text(updated)
assert json.loads(re.search(r'const catalog=(\[.*?\n\]);', updated, re.S).group(1))[2:] == existing
assert len({g['id'] for g in combined}) == len(combined)
report['catalog'] = {'before': len(existing), 'after': len(combined), 'existing_entries_unchanged': True}
(ROOT / '.nojekyll').touch(exist_ok=True)
(ROOT / 'assets/arcade-covers/cards').mkdir(parents=True, exist_ok=True)
(ROOT / 'qa/project-games-import.json').write_text(json.dumps(report, indent=2) + '\n')
for i, script in enumerate(re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', updated, re.S)):
    temp = SOURCE / f'arcade-script-{i}.js'
    temp.write_text(script)
    subprocess.run(['node', '--check', str(temp)], check=True)
print(json.dumps(report, indent=2))
