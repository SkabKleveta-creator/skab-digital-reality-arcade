# Swarm Attack

A third-person gothic slasher with classic isometric and over-the-shoulder cameras. **Level I: Hollow Wake** is a complete exploration level with authored encounters and an ending.

## Play

[Open the playable game](https://hollow-wake.kenneth-kleveta.chatgpt.site).

To run a local copy:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Edit the files and reload. There is no build step. The root entry also supports GitHub Pages configured to serve `main` from the repository root; this does not automatically enable Pages.

## Level I

Explore Pilgrim’s Gate, the Forgotten Graves, Ash Market, Mourning Bridge, the Broken Cloister, and Bell Sanctuary. Recover the grave and ash wards in either order to open the cloister gate. Reach the shrine checkpoint, defeat the Bellkeeper, and seal the breach.

The level occupies a 92 × 186 unit footprint. Its 53 enemies have fixed starting positions, with selected patrols and proximity-based encounters. Defeated enemies stay defeated during the run. There are no timed waves or swarm announcements.

See [the level and enemy-placement guide](LEVEL-01.md) for encounter counts, patrols, progression, and exact coordinates.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD or arrow keys | Left stick |
| Aim | Mouse; mouse-look in shoulder view | Nearby-enemy assist in isometric view; drag scene in shoulder view |
| Attack / fire | Hold left click | Hold Slash / Fire |
| Heavy attack | Q | Heavy |
| Guard / aim | Hold right click | Hold Guard / Aim |
| Dodge | Space | Dodge |
| Sprint | Shift while moving | — |
| Swap melee / ranged | F or weapon bar | Weapon bar |
| Heal | E | Heal |
| Take a ward / use shrine / seal breach | G when the prompt appears | Tap the prompt |
| Camera | V or camera button | Camera button |
| Rotate isometric view | R | — |
| Navigation map | M | Map button |
| Pause and change loadout | P, Escape, or pause button | Pause button |

## Weapons and combat

- Longsword, battle axe, iron mace, and war club have different reach, damage, speed, and stamina costs.
- Longbow, crossbow, and sling fire simulated arrows, bolts, and stones. No firearms.
- Zombies guard and shamble, demons patrol and flank, and monsters telegraph heavy attacks. The Bellkeeper guards the final sanctuary and becomes faster below half health.
- Supply caches and ward recovery replenish resources. The cloister shrine is a checkpoint. Returning after death preserves collected wards and defeated enemies while restoring surviving enemies to their home positions and full health.
- A completed level stops combat and shows the result screen. Replay starts the original level again.

## Editing

| File | Responsibility |
| --- | --- |
| `dist/level.mjs` | Room layout, walkable areas, collision, gates, patrols, enemy placements, objective positions, supplies, and navigation. |
| `dist/core.mjs` | Combat simulation, awareness, pursuit, resource rules, objectives, checkpoint recovery, and completion. |
| `dist/world.js` | The rendered environment, ruins, tombs, market stalls, bridge, shrine, gate, and breach. |
| `dist/game.js` | Character models, weapons, cameras, animation, sound, controls, HUD, map, and menus. |
| `dist/style.css` | Responsive interface. |
| `tests/core.test.mjs` | Combat regression tests. |
| `tests/level.test.mjs` | Navigation and level-progression regression tests. |
| `TESTING.md` | Browser and device acceptance checks. |

## Verify changes

```sh
node --check dist/game.js
node --check dist/world.js
node --check dist/core.mjs
node --check dist/level.mjs
node --test tests/*.test.mjs
```

The 26 automated tests cover combat, authored placements, patrols, gate collision, both ward orders, checkpoint recovery, the traversable level route, and completion. They do not measure browser rendering, device performance, or combat balance.

## Dependencies

Three.js 0.180.0 is vendored locally in `dist/three.module.js` and `dist/three.core.js`; its MIT license is preserved in `dist/THREE-LICENSE.txt`. The environment, characters, weapons, effects, and interface are original code-built assets. No Diablo assets are included.
