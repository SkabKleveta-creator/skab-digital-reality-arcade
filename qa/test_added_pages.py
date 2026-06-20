from pathlib import Path
root = Path(__file__).resolve().parents[1]
projects = ["fps-002","blackbox-squadron","connection-trace","anchor-run","signal-sweeper","relay-rush","node-blaster","breach-drop"]
fail = []
for slug in projects:
    p = root / "evidence" / slug / "index.html"
    txt = p.read_text(encoding="utf-8")
    if "External review intake is currently paused" not in txt:
        fail.append(f"{slug}: paused review message missing")
    for marker in ["data-"+"evidence-feedback-form", "form"+"spree", "abcd"+"wxyz", "YOUR_"+"FORM_ID_HERE", 'action="'+'action=']:
        if marker in txt:
            fail.append(f"{slug}: forbidden marker remains")
for root_file in ["index.html", "README.md", "404.html"]:
    if (root / root_file).exists():
        fail.append(f"Root {root_file} should not be included")
if fail:
    print("QA FAIL")
    print("\n".join("- " + x for x in fail))
    raise SystemExit(1)
print("QA PASS")
print("Forms removed/paused and added-pages-only package verified.")
