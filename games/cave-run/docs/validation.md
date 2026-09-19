# Cave Run upgrade validation

## Intent and scope

The upgrade keeps Cave Run's caveman platform hunt, the ten named stages, carried health and club wear, caves and animal encounters, and the Great Beast as the final confrontation. It gives that game a modern illustrated 2.5D presentation. Cave Run remains distinct from First Kin / TEACH.

Parallax scenery, relics, camp saves, evasion, and the exact final-beast artwork are new design decisions. They are not presented as recovered requirements. The industrial score is newly synthesized music; it contains no artist recordings or copied melodies. `classic.html` preserves the previous game unchanged.

## Confirmed findings in the previous build

| Finding | Resolution |
| --- | --- |
| The final exit could win while every enemy remained alive, and the ending claimed all beasts had fallen. | A distinct Great Beast must be defeated; ordinary animals remain optional. The ending describes that actual achievement. |
| Ordinary tigers carried boss flags across stages; there was no distinct final creature. | The final stage alone has the Great Beast, with windup, lunge and recovery phases. |
| Hovering over a touch button activated input. | Touch begins only on pointer down and ends on release, cancellation or lost capture. |
| Releasing one movement key cancelled a separately held alias. | Each physical keyboard and pointer source is tracked independently. |
| Focus loss cleared keys without pausing the simulation. | Blur and hidden tabs pause play, clear inputs and require deliberate resume. |
| Retry replaced carried resources with new defaults. | Retry restores the camp's actual resources and world state. |
| No persistent campaign save or full music system existed. | Validated, versioned local saves, import/export, and original procedural music. |
| Touch controls extended below an 844×390 landscape viewport. | Controls fit portrait and landscape; action targets remain at least 44 pixels in the checked layouts. |

Earlier discussion raised inaccessible platforms, adjacent pits, narrow landings and knockback. The inspected previous file had flattened its terrain, so those historical concerns were not reported as current confirmed defects. This version restores optional elevated routes with reachable rewards and tests route traversal. Earlier claims of “129/129 tests” were not reused as evidence.

## Completed checks

- **17/17 Node tests pass:** 13 gameplay/save tests and four input tests. All six application modules pass `node --check`.
- The campaign test traverses all ten routes with ordinary movement, jump, strike and evade inputs. It does not teleport the hunter or inject resources. It defeats the final boss and round-trips saves at every reached camp and stage transition. This is deterministic simulation coverage, not a human blind playthrough.
- A separate final-arena test verifies that fists and timed evasion can defeat the Great Beast with no club. Other regressions cover final-exit gating, descending stomps, no pit knockback, pause, exact resource carry, retry rollback, invalid-save rejection and optional shelf access.
- A reproduced one-health checkpoint trap is fixed: retry and restored play grant 1.1 seconds of protection while retaining saved supplies and world state. The regression checks survival and protection expiry.
- **14/14 browser checks pass** in Chromium 153.0.8010.0: launch, active rendering, alias keys, pause and keyboard navigation, focus loss, save export/import/reload, rejected malformed imports, touch hover/cancellation, both phone orientations, cave/boss scenes and error monitoring. No runtime, console or failed-request errors occurred. Active rendering measured 53.6 FPS at 1440×900 in this software-rendered environment.
- Screenshots were inspected for the title, desktop gameplay, phone portrait and landscape layouts, a cave, and the final encounter. Cave/boss browser screenshots use explicit scene fixtures; they do not establish campaign completion.
- All ten stage palettes and enemy/animation variants rendered in native Canvas2D without exceptions. Rendering caches are bounded. Performance measurements are environment-specific rather than device guarantees.
- Audio checks confirmed silence before a gesture, actual nonzero output after activation, bounded voice scheduling, and working pause, mute, re-enable and disposal. The checked music signal had approximately 0.223 peak and 0.029 RMS amplitude, with no audio runtime errors.

## Limits

Browser checks use headless Chromium with viewport and touch emulation. Physical iPhone/Android devices, Safari, and a physical gamepad have not been tested. There is no claim of complete accessibility certification or exhaustive cross-browser coverage.

The software-rendered Chromium adapter can starve screenshots or post-reload pointer acknowledgements during continuous rendering. The test harness temporarily freezes its own frame pump around captures, then resumes it; this is not production behavior. Continue was verified using focused keyboard activation because post-reload mouse dispatch was intermittently unreliable in this adapter. Initial Begin, other mouse-operated menus, and real multi-touch dispatch passed. Integration assertions require actual state and resource outcomes, not merely successful input dispatch.

Progress is local to the browser/device. During a stage, Continue restores the last saved camp, not the exact frame where the page closed. Completed stages and the finished hunt resume at their saved outcome screens. Export is the portable backup. No previous persistent Cave Run save format existed to migrate.
