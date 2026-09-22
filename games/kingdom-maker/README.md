# Kingdom Maker

A standalone 3D castle and realm management game, rebuilt from the original Kingdom Maker prototype. All runtime assets are included in this repository; no CDN, account, API key, or build service is required to play.

## Play locally

Run `npm start` (Python 3 required), then visit `http://localhost:8080`. Serve the folder over HTTP; opening `index.html` directly as a file will block JavaScript modules in many browsers.

## GitHub Pages

The included workflow tests the simulation, packages only the game files, and deploys to GitHub Pages on pushes to `main`. If Pages has not been enabled for this repository, select **Settings → Pages → Source → GitHub Actions**, then run **Test and publish Kingdom Maker** from Actions.

Expected Pages address after a successful deployment: https://skabkleveta-creator.github.io/Kingdom_Maker/

Alternatively, the game also supports **Deploy from a branch → main → / (root)** because `index.html` and its relative asset paths are at the repository root.

## Game systems

- Rotatable 3D castle and 36 × 36 plot map with 16 claimable territories.
- Timed construction, upgrades, repairs, queues, cancellation, and prioritization.
- Timber, stone, iron, food, gold, stockpile limits, seasons, and trading.
- Builders, farmers, woodcutters, quarry workers, miners, blacksmiths, and healers.
- Housing, water, health, morale, migration, taxation, and food rations.
- Walls, palisades, towers, gatehouses, perimeter protection, and recurring raids.
- Spearmen, archers, cavalry, training, and provisioned expeditions that reduce the home garrison.
- Automatic local saving and restoration. Restored games start paused.

This remains a development prototype. Combat resolves automatically. Paths are decorative, and inhabitants are visual representations rather than individually simulated agents. Saves belong to the browser and site address; progress on the original hosted prototype does not automatically transfer to GitHub Pages.

## Controls

| Action | Mouse / keyboard | Touch |
| --- | --- | --- |
| Orbit | Drag; Q / E | One-finger drag |
| Pan | Right-drag, Shift-drag, or arrow keys | Two-finger drag |
| Zoom | Scroll, + / −, or camera buttons | Pinch or camera buttons |
| Place / inspect | Click a plot / structure | Tap a plot / structure |
| Rotate placement | R or rotate button | Rotate button |
| Draw walls / paths | Select the structure, then drag | Select the structure, then drag |
| Pause | Space or pause button | Pause button |
| Exit build mode | Escape or inspect button | Inspect button |

Management dialogs pause simulation while open. Use People to assign workers after completing a workplace. More builders complete the queue faster; deploying troops leaves fewer defenders at home.

## Development

Run `npm test` with Node.js 22 or newer. There are no npm dependencies to install.

| File | Purpose |
| --- | --- |
| `index.html`, `style.css` | Game interface and responsive layout |
| `app.mjs` | Input, dialogs, simulation loop, and local saves |
| `sim.mjs` | Resources, population, construction, military, and save validation |
| `scene.mjs` | Three.js rendering, camera, picking, and scene updates |
| `models.mjs` | Procedural buildings, terrain details, and inhabitants |
| `tests/simulation.test.mjs` | Simulation and geometry regression checks |
| `vendor/` | Bundled Three.js and Lucide, with their license notices |

Third-party license notices remain in `vendor/`. The original Hearthfield and Kingdom Maker deployments are separate from this repository.
