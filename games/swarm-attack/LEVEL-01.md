# Level I — Hollow Wake

The first complete level replaces the original stationary arena. North is negative z. Room bounds and exact placements are defined in `dist/level.mjs`; that file is the authoritative map source.

## Route and progression

1. Enter through Pilgrim’s Gate and move toward the crossroads.
2. Explore the Forgotten Graves and Ash Market in either order. Clear the ward guardians and use G or the touch prompt to collect each ward.
3. Return to the central route and cross Mourning Bridge. Both wards unlock the cloister gate.
4. Reach the cloister shrine for a checkpoint and restored supplies.
5. Pass through the Broken Cloister into Bell Sanctuary. Defeat the Bellkeeper.
6. Approach the breach and interact to finish Level I.

There are no timed waves, random spawns around the player, or swarm announcements. Encounters are present from the start. Players can choose when to approach them; distant enemies remain at home or patrol.

## Encounter plan

| Area | Zombies | Demons | Brutes | Boss | Role |
| --- | ---: | ---: | ---: | ---: | --- |
| Pilgrim’s Gate | 6 | 0 | 0 | 0 | Opening encounters with room to learn movement and defense. |
| The Forgotten Graves | 10 | 2 | 1 | 0 | Slow pressure around tombs; a demon pair and brute guard the grave ward. |
| Ash Market | 6 | 5 | 1 | 0 | Flanking patrols and mixed enemies use stalls as cover around the ash ward. |
| Mourning Bridge | 3 | 2 | 1 | 0 | A narrow traversal route with separated encounters and a brute before the gate. |
| The Broken Cloister | 6 | 3 | 2 | 0 | Checkpoint approach, patrol lanes, mixed enemy groups, and the sanctuary entrance. |
| Bell Sanctuary | 2 | 2 | 0 | 1 | Outer guards and the Bellkeeper protect the final breach. |

**Total: 53 enemies.** The entrance is safe when the player first arrives. Awareness ranges are 9 units for zombies, 12 for demons, 10 for brutes, and 17 for the Bellkeeper. Nearby allies in the same area can be alerted by combat. Obstacles and the closed gate block sight and pursuit. Enemies return home if the player is too far away or they leave their intended area by more than 34 units.

The Bellkeeper has 850 life, a 4.3-unit attack reach, and a telegraphed strike. Below half life it pursues faster and shortens its windup. Heavy attacks do not permanently stun it.

## Exact placements

Coordinates are world-space x/z. Patrols are listed in order; all other enemies guard their home positions.

| ID | Enemy | x | z | Patrol waypoints |
| --- | --- | ---: | ---: | --- |
| gate-zombie-1 | zombie | -4 | 32 | (-4, 32) → (-4, 26) |
| gate-zombie-2 | zombie | 4 | 30 | Guard |
| gate-zombie-3 | zombie | -8 | 24 | Guard |
| gate-zombie-4 | zombie | 8 | 23 | (8, 23) → (6, 18) |
| gate-zombie-5 | zombie | -2 | 21 | Guard |
| gate-zombie-6 | zombie | 3 | 18 | Guard |
| graves-zombie-1 | zombie | -22 | 15 | (-22, 15) → (-28, 16) |
| graves-zombie-2 | zombie | -29 | 16 | Guard |
| graves-zombie-3 | zombie | -24 | 4 | Guard |
| graves-zombie-4 | zombie | -33 | 6 | Guard |
| graves-zombie-5 | zombie | -42 | 8 | (-42, 8) → (-43, 0) |
| graves-zombie-6 | zombie | -41 | -1 | Guard |
| graves-zombie-7 | zombie | -34 | -5 | Guard |
| graves-zombie-8 | zombie | -27 | -5 | Guard |
| graves-zombie-9 | zombie | -20 | -11 | Guard |
| graves-zombie-10 | zombie | -43 | -11 | Guard |
| graves-demon-1 | demon | -30 | -9 | Guard |
| graves-demon-2 | demon | -39 | -7 | Guard |
| graves-monster-1 | monster | -36 | -10 | Guard |
| market-zombie-1 | zombie | 21 | 14 | Guard |
| market-zombie-2 | zombie | 29 | 16 | Guard |
| market-zombie-3 | zombie | 39 | 10 | Guard |
| market-zombie-4 | zombie | 24 | 0 | Guard |
| market-zombie-5 | zombie | 33 | -3 | Guard |
| market-zombie-6 | zombie | 43 | -8 | Guard |
| market-demon-1 | demon | 28 | 7 | (28, 7) → (31, 1) |
| market-demon-2 | demon | 37 | 3 | (37, 3) → (42, 0) |
| market-demon-3 | demon | 40 | -3 | Guard |
| market-demon-4 | demon | 30 | -10 | Guard |
| market-demon-5 | demon | 21 | -7 | (21, -7) → (22, 1) |
| market-monster-1 | monster | 36 | -11 | Guard |
| bridge-zombie-1 | zombie | 0 | -5 | Guard |
| bridge-zombie-2 | zombie | -3 | -10 | Guard |
| bridge-zombie-3 | zombie | 3 | -13 | Guard |
| bridge-demon-1 | demon | -2 | -27 | (-2, -27) → (2, -31) |
| bridge-demon-2 | demon | 3 | -35 | Guard |
| bridge-monster-1 | monster | 0 | -46 | Guard |
| cloister-zombie-1 | zombie | -12 | -63 | Guard |
| cloister-zombie-2 | zombie | 12 | -65 | Guard |
| cloister-zombie-3 | zombie | -9 | -77 | Guard |
| cloister-zombie-4 | zombie | 8 | -73 | Guard |
| cloister-zombie-5 | zombie | -14 | -84 | Guard |
| cloister-zombie-6 | zombie | 12 | -88 | Guard |
| cloister-demon-1 | demon | -5 | -69 | (-5, -69) → (5, -69) |
| cloister-demon-2 | demon | 4 | -81 | Guard |
| cloister-demon-3 | demon | 0 | -90 | (0, -90) → (6, -89) |
| cloister-monster-1 | monster | -11 | -81 | Guard |
| cloister-monster-2 | monster | 12 | -77 | Guard |
| sanctuary-zombie-1 | zombie | -10 | -110 | Guard |
| sanctuary-zombie-2 | zombie | 10 | -112 | Guard |
| sanctuary-demon-1 | demon | -8 | -123 | Guard |
| sanctuary-demon-2 | demon | 8 | -120 | Guard |
| bellkeeper | Bellkeeper | 0 | -119 | Guard |

## Resource and checkpoint rules

Seven fixed supply placements supplement enemy drops. Ward collection restores some life and ammunition. The shrine fully restores life, stamina, ammunition, and healing charges once per level attempt. Death returns the player to the most recent checkpoint, preserves collected wards and defeated enemies, and resets surviving enemies to full health at their home positions. Restarting the entire level resets everything.

## Verification

The automated level suite checks every enemy home and patrol point, both ward orders, gate collision, the complete traversable route, checkpoint preservation, finite supplies, and the ending. See `TESTING.md` for browser, touch, rendering, and balance checks.
