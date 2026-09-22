# Emoji Shift — Reaction Expansion 01

Release: 2026.09.22. Static browser game, no build step or third-party runtime dependencies.

## Included

- Original 25 campaign definitions, plus five Foundry conveyor runs (26–30).
- Six power-pair combinations with confirmation previews and recursive power activation.
- Daily Shift Challenge: 30 moves, 65 clears, 10 target signals, five static tiles.
- Daily seed and refill sequence use `daily-v1` plus the UTC date. Resets at midnight UTC; retries use the same puzzle. Results are local and shareable, with no global leaderboard or account.
- Free Play, per-run score and fewest-shift records, three mastery medals.
- Original inline vector signal art, movement/fall effects, reduced-motion support, touch, keyboard, and gamepad controls.
- Separate campaign/daily/free saved grids. A settled turn is saved before its animation begins.
- Automatic migration from `emoji-shift-runs-v02`; original run-25 completion unlocks run 26.
- Dead-board reroutes preserve every tile, power, and static marker.

## Local testing

Serve the arcade repository with an HTTP server and open `/games/emoji-shift/`.

```
node --test games/emoji-shift/tests/engine.test.mjs
node games/emoji-shift/tests/playthrough.mjs
node games/emoji-shift/tests/browser.cjs
```

The browser suite requires Playwright and Chromium. `BROWSER_EXECUTABLE` optionally selects an installed Chromium. `EMOJI_BASE` optionally targets the deployed game URL. It uses isolated browser contexts and changes only local browser saves.

`playthrough-results.json` records a complete winning move sequence for all 30 campaign runs and a 31-date daily sample. This demonstrates tested paths, not a guarantee that every random campaign board can be solved by any move sequence. The move-selection test agent can examine possible next outcomes, so its success rate is not a human difficulty measurement.

## Save and daily rules

`emoji-shift-expansion-v1` stores profile records and separate session snapshots. The older key is read for migration and never removed. Browser-local records can be cleared by browser storage deletion and do not sync between devices.

A daily game opened before midnight can be finished under its original date. Selecting Daily Shift after midnight opens the new puzzle. Saved RNG state ensures that reloads do not change the next tiles. No paid boosts, lives, or time locks.

The first expansion is 30 runs. Portal and gravity chapters from the longer-term concept are future work.
