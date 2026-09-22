# Night Hunt: Reversed

A browser-based horror action platformer. Play as a monster while unarmed human hunters pursue you across four connected levels.

## Current build

- Four starting characters: Vampire, Werewolf, Zombie, and Reptilian, each with a special move.
- Upgraded illustrated characters, atmospheric environments, and high-resolution canvas rendering.
- Separated directional controls and larger attack/jump buttons with multitouch support.
- Free movement between areas: no kill-gates or mandatory enemy-clear conditions.
- Optional destructible health caches that never block movement.
- Platforms, climbable routes, an elevator, melee combat, and blood effects.
- Humans pursue in both directions, climb after you, drop to lower platforms, and signal melee attacks before striking. Your attacks can interrupt their windup.
- Protection on arrival until you begin moving or attacking, followed by a short grace period. Death retries the current level with the same monster and full health.

## Four-level campaign

| Level | Area | Layout and difficulty |
| --- | --- | --- |
| I | The Gallows Ward | Gothic terraces, vines and chains; 11 human hunters |
| II | The Drowned Foundry | Industrial shafts, turning machinery, furnace light; 14 hunters |
| III | Thornwood Ascent | Tall canopy routes, hanging vines and upper caches; 17 hunters |
| IV | The Ashen Cathedral | Belfry galleries, stained glass and dense patrols; 20 hunters |

Each level has its own platform layout, climb routes, elevator, two secret caches, health pickups, and human commander. Later levels increase human speed, health, and attack frequency. Humans carry no guns or weapons.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move / climb | Arrow keys | Direction buttons |
| Attack (hold to repeat) | Z | A |
| Jump | X | B |
| Special | Up + Z | Up + A |
| Grab a climbable | Up while airborne | Up while airborne |
| Crouch / descend | Down | Down |

Choose your monster once at the beginning. Walk past the right edge to enter the next level; walk past the left edge to return. Defeated hunters and opened caches stay cleared when you return. First entry to a new level restores two health; retries restore full health. Walk out of Level IV to complete the campaign. No exit requires defeating a boss or clearing enemies.

## Run

No build step or runtime dependencies. Serve this directory with any static HTTP server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`.

For GitHub Pages, select **Settings → Pages → Deploy from a branch → main → / (root)**. All asset references are relative so project-subpath hosting works. Repository import alone does not confirm Pages is enabled.

## Test

`npm test` runs dependency-free input checks, 192 unrestricted crossings, 16 protected spawns, 32 human pursuit cases, climbing, melee windups/interrupts, all level exits, backtracking, retries, special moves, health caches, elevator rides, and a full campaign for each monster.

`npm install` then `npm run test:render` runs the actual canvas renderer using Skia and writes images into `test-results/`.

After `npm install`, run `npx playwright install chromium` then `npm run test:browser` for real Chromium checks. An existing browser can be selected with `CHROMIUM_PATH`. The browser suite tests project-subpath hosting, mobile/desktop layouts at 375, 430, 844, and 1280px, two-finger special input, keyboard movement, all four levels, and console/asset failures. Physical iPhone/Safari testing is still separate.

## Code layout

- `levels.js`: authored maps, population, difficulty themes, caches and health placements.
- `game.js`: movement, combat, pursuing humans and campaign state.
- `modern.js` / `modern.css`: canvas rendering and responsive presentation.
- `tests/`: simulation, rendering and browser checks. Test instrumentation is injected by the test harness and is not served as part of the game.

## Source baseline

Imported from the September 20, 2026 gate-free build of Night Hunt: Reversed (source revision `d34f6f69405bafe348fddca86823ecc0f9f647ad`). The original hosted game is unchanged by this import. No hosting credentials or original hosting configuration are included.
