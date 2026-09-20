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

## Expedition expansion validation

- **33/33 Node tests pass** across gameplay, input, progression and environmental hazards. All application modules pass syntax checking. This count supersedes the original rebuild count below.
- The normal-input ten-stage campaign and the fists-only final fight pass with the alternating charge/slam boss. The campaign receives no teleports, resource injections or survival overrides.
- Real version 2 fixtures validate automatic migration. The saved health, club, enemies, items and stage are retained. Only a reliably identifiable current-stage relic receives a name; earlier totals remain explicitly unidentified. Corrupt legacy and version 3 saves reject without altering the active hunt.
- Skills use secured relics. Selection changes only the equipped skill, cannot secure carried finds, and cannot overwrite camp supplies with later resources. Tests cover each actual mechanical benefit and retry/import persistence.
- Hazard tests cover all actual level placements, full warnings before damage, active collision, wait-and-cross and held-jump movement through real physics, pause, retreat cancellation and strict saved identity/timing validation. Seven sites fit the safety criteria across four lands; unsafe candidate sites are skipped.
- Independent review reproduced an early jump instruction that would land the hunter before the slam. The interface now distinguishes early preparation from the final 0.28-second **HOLD JUMP NOW** cue. Grounded evasion takes slam damage; a correctly timed held jump clears it.
- Keyboard event handling preserves native button/checkbox activation while keeping gameplay responsive after HUD/menu use.
- **21/21 expansion browser checks pass**, with no runtime, console or failed-request errors. Checks include native button/checkbox keyboard activation, HUD-to-game focus, exact camp reload, legacy migration, skill persistence, rejected forged progression/hazards, simultaneous touch, both phone layouts and the three distinct boss cue states. Rendering measured 57.6 FPS at 1440×900 in the test environment.
- Reviewed the journal at 390×844 and 844×390, including scrolling to the final relic while Close, tabs and Resume remain visible. Desktop/portrait warning and active hazard scenes and prepare/jump/impact boss scenes were also inspected. Scene fixtures are not campaign playthrough evidence.
- New rockfall/steam/slam audio effects executed without runtime errors. Gesture gating, nonzero audio output, pause, mute, re-enable and disposal passed the audio check.
- The final browser run used multi-process Chromium after intermittent input-dispatch failures in the packaged single-process configuration. Continue used the native focused button with keyboard activation and a temporary test-only frame freeze; exact restored state and supplies were required to pass. Failed adapter runs were retained separately during review, not counted as successful runs.

## Original rebuild checks

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
