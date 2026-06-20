from pathlib import Path
import json, re, sys

root = Path(__file__).resolve().parents[1]
evidence = root / "evidence"
projects = [
 "fps-002","blackbox-squadron","connection-trace","anchor-run",
 "signal-sweeper","relay-rush","node-blaster","breach-drop"
]
required_sections = [
 "1. Exhibit","2. Initial Question","3. Root Cause","4. Ken’s Logic",
 "5. Observed Failure Modes","6. Corrections Applied","7. The Proof Is",
 "8. Finding","9. Relevance Beyond the Game","10. Approval Control",
 "Living Review Log","Unbiased Review Request"
]

failures = []

def check(cond, msg):
    if not cond:
        failures.append(msg)

check(evidence.exists(), "Missing /evidence/")
check((evidence / "index.html").exists(), "Missing /evidence/index.html")
check((evidence / "assets" / "evidence.css").exists(), "Missing evidence.css")
check((evidence / "assets" / "evidence.js").exists(), "Missing evidence.js")
check(not (root / "index.html").exists(), "Package should not include root index.html")
check(not (root / "README.md").exists(), "Package should not include root README.md")
check(not (root / "404.html").exists(), "Package should not include root 404.html")

for slug in projects:
    d = evidence / slug
    index = d / "index.html"
    log = d / "review-log.json"
    review = d / "reviews" / "2026-06-19-review-001.md"

    check(index.exists(), f"Missing {slug}/index.html")
    check(log.exists(), f"Missing {slug}/review-log.json")
    check(review.exists(), f"Missing {slug}/reviews/2026-06-19-review-001.md")

    if index.exists():
        text = index.read_text(encoding="utf-8")
        for section in required_sections:
            check(section in text, f"{slug}: missing section {section}")
        check("kenneth.kleveta@gmail.com" in text, f"{slug}: missing Ken feedback email")
        check("Name and email are optional" in text, f"{slug}: missing anonymous feedback wording")
        check("YOUR_FORM_ID_HERE" in text, f"{slug}: missing form endpoint placeholder")
        check("../assets/evidence.css" in text, f"{slug}: CSS link missing or wrong")
        check("../assets/evidence.js" in text, f"{slug}: JS link missing or wrong")
        check('name="project_title"' in text, f"{slug}: missing project hidden field")
        check('name="evidence_page_url"' in text, f"{slug}: missing URL hidden field")
        check('name="permission_to_quote"' in text, f"{slug}: missing quote permission field")

    if log.exists():
        data = json.loads(log.read_text(encoding="utf-8"))
        check(data.get("feedback_destination") == "kenneth.kleveta@gmail.com", f"{slug}: wrong feedback destination in review-log.json")
        check(data.get("current_status") == "Draft / Pending Ken Approval", f"{slug}: wrong status in review-log.json")

if failures:
    print("QA FAIL")
    for f in failures:
        print("-", f)
    sys.exit(1)

print("QA PASS")
print("Checked added pages only, review logs, seeded review markdown files, anonymous feedback wording, Ken routing, and no root overwrite files.")
