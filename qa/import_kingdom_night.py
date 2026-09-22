"""One-time pinned import of the approved Kingdom Maker and Night Hunt builds."""
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ['GAME_SOURCE_ROOT'])
BUILD = 'underground-2026-09-21-four-project-games'
VERSION = '2026.09.21.002'
PINNED = [
    ('kingdom-maker', 'Kingdom_Maker', 'bf608966457b208cbb32d284b300feee69e88a5c', ['index.html', 'style.css', 'app.mjs', 'sim.mjs', 'scene.mjs', 'models.mjs', 'vendor', 'README.md', 'VALIDATION.md']),
    ('night-hunt', 'Night_Hunt-Reverse_Horror', 'baf18fba5c81e94d468e8011caf8f7fdea2a4edd', ['index.html', 'game.js', 'levels.js', 'modern.js', 'modern.css', 'assets', 'README.md']),
]
index = ROOT / 'index.html'
raw = index.read_bytes()
blob = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
assert blob == '1482b9f94ad9ecd53280fdca16dad5faf8c1fbc7', 'Arcade changed: review before importing'
original = raw.decode('utf-8')
match = re.search(r'const catalog=(\[.*?\n\]);', original, re.S)
assert match, 'Catalog marker missing'
existing = json.loads(match.group(1))
assert len(existing) == 26
assert not {'kingdom-maker', 'night-hunt'} & {g['id'] for g in existing}

report = {'build': BUILD, 'version': VERSION, 'method': 'Byte-identical copies of pinned upstream runtime and documentation. Source repositories are unchanged.', 'games': []}
for slug, repo, commit, paths in PINNED:
    source = SOURCE / repo
    actual = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    assert actual == commit, (repo, actual, commit)
    destination = ROOT / 'games' / slug
    assert not destination.exists(), f'Refusing to replace an existing game: {slug}'
    destination.mkdir(parents=True)
    files = []
    for relative in paths:
        src, dst = source / relative, destination / relative
        assert src.exists() and not src.is_symlink(), src
        if src.is_dir():
            assert not any(p.is_symlink() for p in src.rglob('*'))
            shutil.copytree(src, dst)
            originals = sorted(p for p in src.rglob('*') if p.is_file())
        else:
            shutil.copy2(src, dst)
            originals = [src]
        for original_file in originals:
            rel = original_file.relative_to(source)
            copied = destination / rel
            assert original_file.read_bytes() == copied.read_bytes(), rel
            files.append({'path': rel.as_posix(), 'bytes': copied.stat().st_size, 'sha256': hashlib.sha256(copied.read_bytes()).hexdigest()})
    provenance = {'source_repository': f'SkabKleveta-creator/{repo}', 'source_commit': commit, 'runtime_changes': 'None', 'files': files}
    (destination / 'ARCADE-SOURCE.json').write_text(json.dumps(provenance, indent=2) + '\n')
    report['games'].append({'id': slug, 'source': provenance['source_repository'], 'commit': commit, 'files': len(files), 'bytes': sum(f['bytes'] for f in files)})
    for path in destination.rglob('*'):
        if path.suffix in ('.js', '.mjs'):
            subprocess.run(['node', '--check', str(path)], check=True)

base = 'https://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/'
additions = [
    {'id': 'kingdom-maker', 'section': 'live-playable-systems', 'format': 'Playable Prototype', 'status': 'Playable Candidate', 'evidence': 'Castle & Realm', 'kicker': '3D Castle and Settlement Management', 'title': 'KINGDOM MAKER', 'description': 'Build a 3D castle realm with timed construction, expanding territories, resource production, jobs, and care for your people. Fortify the grounds, train a garrison, trade, and send provisioned expeditions.', 'howTo': 'Choose a structure and click or tap a claimed plot to queue construction. People assigns workers; Military manages troops and expeditions; Economy handles trade. Drag to orbit, right-drag or two-finger drag to pan, and scroll or pinch to zoom. Space pauses. Progress saves in this browser.', 'href': base + 'kingdom-maker/', 'cover': './assets/arcade-covers/cards/31-kingdom-maker.png', 'genre': 'Simulation', 'available': True},
    {'id': 'night-hunt', 'section': 'live-playable-systems', 'format': 'Playable Prototype', 'status': 'Playable Candidate', 'evidence': 'Four-Level Campaign', 'kicker': 'Reverse Horror · Play as the Monster', 'title': 'NIGHT HUNT: REVERSED', 'description': 'Choose Vampire, Werewolf, Zombie, or Reptilian and stalk four connected levels while human hunters pursue you. Climb, strike, unleash a special move, and explore without kill-gates or mandatory enemy clears. No guns.', 'howTo': 'Select your monster with the arrows or D-pad; press Z/A or X/B to begin. Arrows move and climb, Z/A attacks, X/B jumps, and Up + attack uses your special. Walk past the right edge to advance or the left edge to return. Death retries the current level with the same monster.', 'href': base + 'night-hunt/', 'cover': './assets/arcade-covers/cards/32-night-hunt.png', 'genre': 'Action', 'available': True},
]
combined = additions + existing
updated = original[:match.start(1)] + json.dumps(combined, ensure_ascii=False, indent=2) + original[match.end(1):]
assert updated.count('const order=[') == 1
updated = updated.replace('const order=[', "const order=['kingdom-maker','night-hunt',", 1)
assert updated.count('underground-2026-09-21-project-games') == 2
updated = updated.replace('underground-2026-09-21-project-games', BUILD)
assert 'img.src=artwork[g.id]||g.cover;' in updated
index.write_text(updated)
assert json.loads(re.search(r'const catalog=(\[.*?\n\]);', updated, re.S).group(1))[2:] == existing
assert len({g['id'] for g in combined}) == len(combined)
assert not any(g['id'] in ('castle-realm', 'terrarium') for g in combined)
report['catalog'] = {'before': len(existing), 'after': len(combined), 'existing_entries_unchanged': True}
report['excluded'] = ['Castle Realm', 'Terrarium']
(ROOT / 'qa/kingdom-night-import.json').write_text(json.dumps(report, indent=2) + '\n')
# The cumulative report supersedes the earlier source-access blockers.
cumulative_path = ROOT / 'qa/project-games-import.json'
cumulative = json.loads(cumulative_path.read_text())
cumulative['build'] = BUILD
cumulative['games'].extend(report['games'])
cumulative['not_imported'] = {}
cumulative['catalog'] = {'before': 24, 'after': 28, 'existing_entries_unchanged': True}
cumulative_path.write_text(json.dumps(cumulative, indent=2) + '\n')
(ROOT / 'site-version.json').write_text(json.dumps({'version': VERSION, 'label': 'Underground arcade; all four project games published; 28-title lineup', 'updated': '2026-09-21'}, indent=2) + '\n')
for i, script in enumerate(re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>', updated, re.S)):
    temp = SOURCE / f'arcade-check-{i}.js'
    temp.write_text(script)
    subprocess.run(['node', '--check', str(temp)], check=True)
print(json.dumps(report, indent=2), flush=True)
