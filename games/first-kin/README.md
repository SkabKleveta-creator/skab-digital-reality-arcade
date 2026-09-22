# FIRST KIN

**Family · Tribe · Village**

An original ChatGPT rebuild of Ken's TEACH, THREE NIGHTS and GREAT KILL
prototypes. A prehistoric community simulation with named human characters,
settlement construction, shared discoveries, and a world beyond the hearth.

## Play

## Open the game online

Enable GitHub Pages once: **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
The published address will be `https://skabkleveta-creator.github.io/FirstKinProject/`.
The repository file preview and Raw button are not the playable website.
Changes committed to `main` will update the site automatically.

The web build uses `index.html`, `src/` and `assets/`. No installation is needed to play.
For local development, run `python3 -m http.server 8000` and open `http://localhost:8000`.


1. Choose **Light the first hearth**. Opening AM/PM plans are already set.
2. In **Build**, choose **Family shelter** and place it beside an existing
   path. Nana's opening morning assignment starts construction; assign one
   more Build action to finish it.
3. **Commit the sun**. Grok's fishing and solo hunt can be played directly.
   Untick **Play field trips** to let the simulation resolve providers.
4. Watch the rod, pull when it bends, and bring the result home. During a
   hunt, tap ground to move and use **Strike** when close enough.
5. At dinner, review the day's consequences. Rest to begin the next sun.
6. Give Lug another Firecraft practice after his first lesson. Three
   practiced firekeepers are part of becoming a tribe.
7. Open **Council** for the conditions to welcome families and establish
   a tribe, then a village. **Discover** and **Region** open the wider game.

Drag the map to pan. Use +/− to zoom, and the percentage button to reset.
Solo hunts also support arrow keys/WASD to move and Space to strike.
Space pulls the fishing line. A hidden browser tab pauses a field scene.

For a group hunt, give 2–5 people with practiced Hunting the **Join group
hunt** action in the same half-day. Supply one spear per person. Position
them in the clearing, choose their roles, then commit. A Longarm needs a bow.
The hunt runs autonomously, with pause and ×3 playback controls.

## What the simulation connects

| Layer | Working behavior |
|---|---|
| People | Six founders; six arrivals with distinct names, faces and skill profiles; health, fatigue, learning, work and losses |
| Teaching | Watching a living, skilled demonstration adds understanding; practice develops ability; observation respects the current half-day |
| Settlement | Free building placement; construction work; a path graph that activates housing, storage, water, gardens and workshops |
| Provisioning | Finite gathering grounds; fishing; solo and group hunts; a shared pool of tools; food preservation |
| Field play | Click-to-move hunting, timed fishing, placed party roles; supplies, learning and new injuries return to the same camp exactly once |
| Development | Five linked discoveries unlocking better tools, bows, growing, a gathering circle, trade and outposts |
| Region | Nine named places; scouting reveals reachable ground; two trading neighbors; productive resource outposts |
| Continuity | Four six-sun seasons; food demand follows living population; crops, weather, spoilage, fire, memory and saves |

The village is a milestone, not an end screen. Continue building and caring
for the community after reaching it. The current roster is capped at twelve.

## Saves

**Menu → Save/Load** stores the family in this browser. Planning and dinner
states save automatically. A running sun does not replace the last stable
save. Export/import JSON to move a campaign between browsers or devices.
If local storage is blocked, use Export save.

This rebuild uses save version 6. Earlier TEACH/P0-E saves are not compatible.
The previous builds and original source material remain in `legacy/`.

Run `npm run campaign` to generate `qa/campaign-save.json`, an optional completed test campaign earned from
normal starting resources. Import it to inspect a developed village. It
replaces the current campaign, so export your own family first.

## Project map

| Path | Purpose |
|---|---|
| `index.html` | Hosted game entry point |
| `src/core.js` | Pure campaign simulation, progression, economy and save validation |
| `src/field.js` | Fishing, solo hunt and group hunt simulation |
| `src/render.js` | Isometric map, human sprites, portraits and regional rendering |
| `src/app.js` | Planning controls, field handoffs, input and persistence |
| `src/shell.html`, `src/style.css` | Interface and responsive layout |
| `assets/` | Human character artwork embedded by the builder |
| `data/lore.json` | Empty, attributed lore-entry schema for future world chapters |
| `design/FIRST_KIN_RELEASE.md` | Current review, decisions and implementation limits |
| `legacy/` | Original prototypes, design documents, canonical data tables and upload checksums |
| `tests/` | Simulation, progression, controller integration and optional render checks |
| `qa/` | Canvas renders, campaign evidence and the optional developed-village save |

`src/core.js` is authoritative for this release's rules and costs. Uploaded
matrices and JSON in `legacy/` describe earlier or proposed designs.

## Rebuild and verify

Python 3 and Node.js 22+; no package installation required for the build or tests.

```sh
python3 build.py
npm test
npm run campaign
```

Optional `tests/render.cjs` uses `@napi-rs/canvas` from the Codex runtime,
located via `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. The shipped game has no
runtime dependency on that package.

Verification: **29 simulation/progression checks** and a controller
integration harness passed. A 30-sun route reached tribe on sun 5 and village
on sun 9, retained twelve people through winter, made all five discoveries,
harvested crops, traded, and established an outpost. This proves a working
route, not that every possible strategy is balanced.

The actual canvas renderer was checked at desktop and mobile sizes, including
human portraits, fishing, settlement and region views. **Full browser, touch,
keyboard-focus and responsive-page layout testing remain unverified**: the
available environment did not have a working browser executable. The
controller harness is a minimal DOM simulation, not browser automation.

## Scope

This is a playable vertical slice. It has no births, aging, family tree,
independent rival AI, warfare, procedural world generation, multiple managed
towns or traffic model. Outposts are simple recurring resource producers.
The THREE NIGHTS contribution is the provider's movement, fishing and food
handoff; its complete original multi-night scenario is preserved separately.
Settlement walking is visual presentation; the path graph governs service
activation and a small carrying-effort benefit.

Six full-body founder sprites animate through procedural movement. Twelve
people have individual portraits; arriving settlers currently share founder
body variants on the map. The world uses fictional communities. Specific
Indigenous histories, languages and stories await a named people, place,
period and attributed content direction. The lore schema is reserved data,
not a live content-import system.
