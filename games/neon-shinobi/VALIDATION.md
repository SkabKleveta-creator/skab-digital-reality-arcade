# Midnight Protocol 2.0.2 validation

## Automated

`npm run check` parses all six JavaScript files. `npm test` runs 38 regression cases against production code, including:

- Complete six-district relay/guardian progression, upgrade intermissions and final victory.
- Equivalent travel at 30, 60, 120 and 144 Hz; a single animation loop through repeated retries.
- Camera backtracking and world-position preservation on resize.
- Jump buffering, launchers, dash invulnerability and air slams.
- Immediate/idempotent death, same-frame pickup safety and checkpoint recovery.
- Enemy reward idempotence, friendly explosions, jumpable brute attacks and offscreen rage protection.
- Boss phases, attack telegraphs and recovery windows.
- Bounded enemies, projectiles and effects during a three-minute simulation.
- Independent input ownership, pointer cancellation, brief taps, blur/visibility pauses and gamepad disconnects.
- Save validation, malformed/denied storage, legacy score import, reloads and retry deduplication.
- Menu pause semantics, new-campaign confirmation and persisted accessibility settings.
- Complete offline asset caching, install assets and cache isolation from other arcade games.

The harness uses DOM/Canvas stubs for deterministic checks. It does not substitute for visual rendering or hardware tests.

## Browser review

The deployed 2.0.0 release was checked in Chrome for title rendering, Story campaign start, keyboard jump input, visible enemy rendering, help/settings pause, an unchanged paused clock, saved settings, checkpoint continuation after reload, and absence of game-origin console errors. The 390 × 844 phone layout fit without menu clipping or horizontal overflow. The 320 × 740 and 844 × 390 reviews identified two small layout refinements delivered in 2.0.2: a tighter small-phone title and a fully visible landscape control deck. Short slash taps also now survive a release between simulation ticks.

Physical multitouch, physical controllers, iOS Safari audio/PWA behavior and extended difficulty balance playtests remain manual release checks. Offline fetch behavior is covered by the service-worker harness; it was not tested by switching the live browser's network offline.

The 2.0.2 service-worker install explicitly reloads every precache request, preventing a browser HTTP-cache copy of an older entry page from being reused in the new offline release. The worker regression asserts that every install request uses reload semantics.
