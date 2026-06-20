# Prompt Used

Build an added-pages-only Evidence Archive package for the Skab Digital Reality Arcade GitHub Pages repository.

Goal:
Create a zip package that can be copied into the repository root and tested without modifying the current homepage, existing game files, 404 page, README, or version file.

Repository context:
- Public arcade repository: `skab-digital-reality-arcade`
- Existing repository root already contains `index.html`, `404.html`, and `README.md`.
- Current arcade materials identify live/current/demo projects including Digital Reality Run / FPS-002, Blackbox Squadron, Connection Trace, Anchor Run, Signal Sweeper, Relay Rush, Node Blaster, and Breach Drop.

Required structure:
```text
/evidence/
  index.html
  /assets/
    evidence.css
    evidence.js
  /fps-002/
    index.html
  /blackbox-squadron/
    index.html
  /connection-trace/
    index.html
  /anchor-run/
    index.html
  /signal-sweeper/
    index.html
  /relay-rush/
    index.html
  /node-blaster/
    index.html
  /breach-drop/
    index.html
/qa/
  test_added_pages.py
  QA_RESULT.txt
  QA_ONLY_ADDED_PAGES.md
README_INSTALL.md
MANIFEST.md
OPTIONAL_ROOT_INDEX_PATCH_NOT_APPLIED.md
```

Evidence page requirement:
Each game evidence page must read like a professional exhibit page, not a blog post. Use the same section structure on every page:
1. Exhibit
2. Initial Question
3. Root Cause
4. Ken’s Logic
5. Observed Failure Modes
6. Corrections Applied
7. The Proof Is
8. Finding
9. Relevance Beyond the Game
10. Approval Control

Approval rule:
All pages must be clearly marked Draft / Pending Ken Approval. Do not represent any evidence as final or approved.

Style:
Match the Skab Digital Reality Arcade tone: browser-first prototype hub, systems, signal, route logic, recovery, proof trail, and disciplined AI-assisted execution. Keep the visual style arcade-compatible but professional enough for an evidence archive.

Loop setting:
Run a goal-locked build loop until the package passes QA or a blocking issue appears:
1. Inspect repository context.
2. Build only the added Evidence pages.
3. Test only the added pages.
4. Patch any QA failures.
5. Re-run QA.
6. Stop after PASS and package the zip.

QA requirements:
- Confirm required Evidence files exist.
- Confirm no root `index.html` or `404.html` is included.
- Confirm every game page contains the required evidence sections.
- Confirm every game page includes Pending Ken Review language.
- Confirm CSS, JS, and internal Evidence links resolve.
- Allow parent `../index.html` and `../../index.html` links because those resolve after copying `/evidence/` into the existing repository root.
- Produce a QA report.

Final deliverable:
Create a zip file containing the package, provide the download link, summarize the QA result, and show this prompt at the end.
