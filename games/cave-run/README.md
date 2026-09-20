# Cave Run · The Ten-Sun Hunt

A modern illustrated 2.5D caveman action adventure. Ten authored wildlands form one hunt: health and club wear carry forward, safe camps record the journey, and the Great Beast awaits only in the tenth land.

[Play Cave Run](https://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/cave-run/).

## Expedition expansion

Every land now has a named relic with its own illustrated journal entry. Discoveries travel with you until the next camp; only secured relics unlock trail skills. Choose one skill in **Pause → Relics & skills**. Relics are kept rather than spent:

| Skill | Secured relics | Effect |
| --- | --- | --- |
| Forager | 1 | Meat restores up to 6 health instead of 4. |
| Long Breath | 3 | Stamina recovers at 32 per second instead of 23. |
| Stone Edge | 6 | Armed strike reach increases by 6 world units; damage and club wear are unchanged. |

Seven environmental hazards occupy clear ground across Deep Dark, River of Stone, Long Night, and The Narrows. Loose stone and steam give a 1.05-second warning before their brief active period. Leave the marked rockfall column; jump over steam or wait for a safe crossing. Camps, nearby supplies, narrow pit landings, and the final arena remain clear of these hazards.

The Great Beast alternates charges and ground slams. Evade a charge. During a slam warning, wait for **HOLD JUMP NOW**, then hold Jump to clear the low shockwave. A grounded evade cannot avoid the slam. Both moves leave a recovery opening.

The journal, trail skills, hazards and second boss move extend the approved game; they are new design decisions, not claims about earlier requirements. Stage names, route geometry, enemy/item identities and carried supplies remain stable.

## What changed

The 160×144 handheld presentation has been replaced with a full-window, antialiased canvas scene: layered landscapes, illustrated animated people and animals, stage-specific lighting, caves, campfires, and a responsive interface. The game remains a side-on adventure. Its 2.5D depth is illustration and parallax, not a freely navigable 3D world.

The original ten names and authored route foundations remain. Optional elevated shelves return in The Cold Climb and The High Hunt without blocking the main route. Trail relics reward exploration. The title subtitle, modern art, relics, checkpoint design, combat tuning, and final-beast design are implementation choices for this upgrade, not recovered user requirements.

Combat has deterministic damage, repeated strikes while held, descending-only stomps on small creatures, telegraphed predator attacks, and stamina-based evasion. A broken club leaves usable fists. Ordinary animals can be avoided; the distinct Great Beast must be defeated before the final exit opens. The final ending makes no claim that every ordinary enemy was killed.

The score is original procedural industrial music, with low distorted riffs, percussion, bass, and atmospheric pads. It contains no borrowed recordings or melodies. Audio begins only after a player gesture; music, sound, and volume can be changed in Settings.

## Play and controls

| Action | Keyboard | Touch | Standard controller |
| --- | --- | --- | --- |
| Move | A/D or left/right arrows | Left/right | Left stick / D-pad |
| Jump | Space, W, or up arrow; hold for height | Hold Jump | A |
| Strike | Hold J or X | Hold Strike | X |
| Evade | K or Shift | Evade | B |
| Pause | Escape or P | Top-right pause | Start |

Collect food when injured, replacement clubs when worn, and optional relics. Follow the trail marker at each route's end. The Field Guide explains the journey and final encounter.

## Saving and recovery

The game saves at a new hunt, reached campfires, stage completion, and stage entry. During a stage, Continue and Retry restore the most recent stable camp, including its actual health, club, enemies, and pickups. Completed stages and the finished hunt resume at their saved outcome screens. They do not resume the exact point where the page was closed. Elapsed time and death counts persist; rewards collected after camp roll back with that part of the world, preventing duplication by retrying.

Returning to camp grants 1.1 seconds of protection so a saved nearby attack cannot cause an immediate death; supplies remain exactly as saved.

Settings provides JSON export and import. Imported data is fully validated before replacing the active journey. Storage failures leave the game playable and display an export reminder. Progress is local to the browser and device. Version 3 saves add the relic journal, equipped skill, hazard timing and boss attack sequence. Existing version 2 saves are validated and migrated automatically, keeping their actual supplies and world state. Version 2 recorded only a relic total: the current land’s find can be identified from its saved pickup, while earlier finds remain explicitly unidentified and still count toward skill unlocks. The original handheld game had no persistent campaign saves.

Focus loss and hidden tabs pause simulation and clear held input. Resume is deliberate. A failed module load or render loop shows a recovery control without overwriting the saved camp.

## Development

Serve the repository root over HTTP and visit `games/cave-run/`:

```sh
python3 -m http.server 8000
node --test games/cave-run/tests/*.test.mjs
```

No package installation, build step, CDN, or external asset requests are needed to run the game. Browser tests require Playwright and an available Chromium executable; see `tests/browser.cjs`. Add `?debug` locally to expose the explicit test interface. Normal play does not expose mutable game globals.

| File | Role |
| --- | --- |
| `js/data.mjs` | Ten authored routes, themes, enemy definitions |
| `js/core.mjs` | Fixed-step simulation, combat, progression, checkpoints, save validation |
| `js/render.mjs` | Original Canvas2D artwork, camera, lighting and animation |
| `js/progression.mjs` | Ten named relics and selectable trail skills |
| `js/hazards.mjs` | Safe placement, warnings, collision and save validation for environmental hazards |
| `js/input.mjs` | Separate keyboard, pointer, and gamepad input sources |
| `js/app.mjs` | Interface, persistence, lifecycle, accessibility and fixed-step loop |
| `js/audio.mjs` | Original procedural music and effects |
| `tests/` | Gameplay, input and browser checks |
| `docs/validation.md` | Findings, completed checks and limits |
| `classic.html` | Unmodified previous version retained for comparison |

The GitHub workflow checks simulation, progression, hazard and input regressions and module syntax on game changes. It does not claim physical-phone or Safari verification.
