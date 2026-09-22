# Reaction Expansion 01 validation

- 19 engine tests: matching, invalid moves, six power combinations, recursive activation, static accounting, reroutes, conveyor timing, save migration and restoration, daily determinism and UTC dates, separate records, free play, and generated board stability.
- Winning automated playthroughs for all 30 campaign runs. Exact seeds and move sequences are in `../tests/playthrough-results.json`.
- 31 daily dates sampled from September 22 through October 22, 2026; automated playthrough completed all 31. The automated player evaluates prospective outcomes, so this is a solvability sample rather than human difficulty evidence.
- Chromium browser validation at desktop and 320/390/430px mobile widths: real touch events, tap and swipe input, keyboard play, save reload, legacy unlocks, combo confirmation, daily completion and clipboard sharing, and reload during animation.
- Physical iPhone/Safari testing was not available in this environment. Mobile checks use Chromium touch emulation.

No live account data is used. Browser test saves are isolated from players' devices.
