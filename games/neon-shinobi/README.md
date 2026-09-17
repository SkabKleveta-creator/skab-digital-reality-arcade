# Neon Shinobi: Midnight Protocol

Version 2.0.1 turns the original continuous-field prototype into a complete, replayable browser campaign while retaining its Canvas artwork, sword combat, one ground plane, and optional elevated routes.

## Play

[Launch Neon Shinobi](https://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/neon-shinobi/).

Disable three relays in each district, defeat its guardian when present, and reach extraction. Backtracking is always allowed; ordinary enemies do not lock movement. Six districts culminate in the Neon Regent fight. Optional data shards reward platform exploration. Repair stations restore two hearts once per district.

| Action | Keyboard | Standard gamepad / touch |
| --- | --- | --- |
| Move | A/D or left/right | D-pad or left stick |
| Double jump | Space, W, up | A or up |
| Slash / chain | Hold J or K | Hold B |
| Launcher | Hold jump + slash | Hold A + B |
| Dash / air slam | Shift, L, S, down | X or down |
| Rage | R, when full | Y |
| Pause / resume | Esc or P | Start |
| Mute | M | Settings |

Guardians telegraph a dash, two jumpable ground shockwaves, and falling blades. Their attacks intensify at two health thresholds. Dash grants brief invulnerability; enemy defeat chains increase the score multiplier.

After each district, choose Edge Protocol, Ghost Step, Iron Heart, Overcharge, or a full repair. Story, Arcade, and Ronin offer different health, enemy speed, boss health, and score multipliers. New Game + increases enemy strength after victory.

## Saves and accessibility

- Checkpoints capture district entry, including score, upgrades, health, difficulty, and prior statistics. Retry restores that entry, so partial attempts cannot farm points into the checkpoint.
- Records, six achievements, settings, and the current checkpoint are stored only in this browser. No accounts or network scoring are involved.
- Storage is versioned and validated; denied storage falls back to the current session. The original `neonshinobi_best` record is imported.
- Focus loss, hidden tabs, help/settings, and controller disconnection pause combat. Returning focus does not resume automatically.
- Keyboard, pointer, and gamepad inputs have independent ownership. Cancelled touches cannot leave an action stuck.
- Menus support keyboard focus and standard gamepad navigation. Settings include volume, mute, reduced motion/flashes, and optional vibration. The action game itself is visual and is not a screen-reader-only experience.
- A service worker caches one complete release after the first successful online load. Its scope and cache cleanup are confined to this game. An updated worker waits for existing game tabs to close before replacing the cached release.

## Development

No build step or third-party game dependencies are required. Serve this folder with any static HTTP server, for example `python3 -m http.server 8000`, then visit the served URL. Service workers require HTTPS or localhost.

```sh
cd games/neon-shinobi
npm run check
npm test
```

Node 22 or newer is required for the regression suite; no `npm install` is necessary.

| Module | Responsibility |
| --- | --- |
| `js/store.js` | Validated saves, settings, achievements, local records |
| `js/game.js` | Original art, combat, fixed-step physics, effects and single animation loop |
| `js/campaign.js` | District layouts, relays, shards, guardians, upgrades, progression |
| `js/controls.js` | Keyboard, pointer ownership, standard gamepad, focus lifecycle |
| `js/ui.js` | Menus, pause, HUD, instructions and settings |
| `sw.js` | Versioned offline shell with installation-specific cache scope |

The classic scripts deliberately share the existing engine's lexical scope and must load in the order shown in `index.html`. Campaign state is exposed through `NSCampaign` for the controller/UI and deterministic regression harness. It is not a multiplayer authority or anti-cheat boundary.

`tests/layout.html` embeds the real game at phone portrait, phone landscape, small-phone, and desktop sizes for visual review. This is a layout check, not hardware touch emulation. The Node harness exercises actual production scripts with minimal DOM/Canvas stubs; real rendering and native audio still need browser checks.

The GitHub Actions workflow runs syntax and regression checks only for changes to Neon Shinobi or its workflow. GitHub Pages continues to serve the existing arcade repository.

## Release notes

- Added six finite districts, 18 relays, 18 optional shards, three multi-phase guardians, five upgrade intermissions, a final victory, and New Game +.
- Added three difficulties, six achievements, local records, checkpoint continue/retry, onboarding, pause, settings, controller support, install icons, and offline play.
- Fixed repeated animation loops, delayed death callbacks affecting later runs, same-frame post-death healing, resize-sensitive physics, mixed input releases, missing blur cleanup, offscreen rage kills, friendly explosion damage, ground attacks hitting airborne players, and duplicate enemy rewards.
- Added a 120 Hz fixed simulation with a capped catch-up budget, buffered/coyote jumps, held slash chains, bounded particles, and audio-node cleanup.
- Preserved native neon art, enemy silhouettes, double jumps, launchers, dashes, air slams, rage, and free movement.

Remaining release validation: longer balance playtests across all difficulties; physical multitouch and gamepads; iOS Safari audio/install behavior. Local scores are intentionally editable by the browser owner. There is no backend, online leaderboard, account sync, or multiplayer.
