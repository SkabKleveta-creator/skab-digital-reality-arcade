# Moon Trash: Salvage Run — Build Lock

**Status:** ACTIVE BASELINE LOCK  
**Decision ID:** `MTR-LOCK-2026-08-09-01`  
**Date / UTC:** 2026-08-09  
**Session lane:** Design Lock / Release Handoff

## BLUF

`moon-trash-mtr-patch-2026-08-09-03.html` is the authoritative build from which all Moon Trash work continues. It is one self-contained, six-route lunar-salvage campaign—not six unrelated games and not six separately accepted production levels.

## Current Source of Truth

| Item | Locked value |
|---|---|
| Artifact | `moon-trash-mtr-patch-2026-08-09-03.html` |
| Build ID | `MTR-PATCH-2026-08-09-03 — TUNNEL EXIT RECOVERY` |
| SHA-256 | `2f8a84d8bfa7cd70da27db679c5d9408bba42f5bf4cbe2b5f94ef3f68eaf640e` |
| Prior baseline retained | `moon-trash-mtr-patch-2026-08-09-02.html` |
| Delivery model | Local standalone HTML; no external dependencies |

## Official Content Count and Terminology

The code internally stores the campaign in `levels[]`, but external design and player-facing language use **routes**.

| Route | Name | Salvage required | Cart progression |
|---:|---|---:|---|
| 01 | Spoonbill Crater | 3 | Scrap Sled → Rattle Cart |
| 02 | Sneezy Rille | 4 | Rattle Cart → Moon Mule |
| 03 | Wobble Ridge | 5 | Moon Mule → Wobble Wagon |
| 04 | Rickety Sea | 6 | Wobble Wagon → Big Moon Wagon |
| 05 | Silent Parking Lot | 7 | Big Moon Wagon → Powered Hauler |
| 06 | Exit Ramp | 8 | Powered Hauler → Escape Ship |

**Current answer:** six consecutive routes, totaling 33 recoverable salvage parts. A route is cleared by collecting and loading every required part, then building the next cart or the escape ship.

## Locked Identity and Loop

- Original 16-bit, left-to-right lunar salvage game.
- No combat; obstacles are moved or cleared rather than fought.
- The player gathers salvage, carries it back to the cart, loads it, builds a larger cart, and advances to the next route.
- Jump, scan, cart progression, tunnels, and absurd salvage names belong to this game and remain in scope.

## Locked Player Controls and Emulator Presentation

- Fixed `800 × 640` 5:4 CRT-style game output.
- Screen-first emulator shell with a joined slide-capable D-pad.
- **A:** moon jump.
- **B:** use / pick up / move obstacle / enter tunnel / exit tunnel.
- **X:** load carried salvage into the cart.
- **Y:** scan.
- **START:** pause or resume. **SELECT:** controls.
- Keyboard equivalents: WASD or arrows, Z jump, X use, C load, V scan.

## Locked Reliability Behavior

- `B USE` exits safely from anywhere inside a tunnel.
- A tunnel scan retains the `B EXIT` instruction.
- Salvage pickup has priority over tunnel entry.
- All six routes passed the deterministic route harness for salvage reachability, obstacle clearing, tunnel entry/scan/exit, cart loading, and route completion.

## Change Control

Every future gameplay, UI, content, visual, or reliability change starts from the authoritative artifact above and receives a new ID using this format:

```text
MTR-PATCH-YYYY-MM-DD-##
```

Each patch must state its objective, allowed and forbidden changes, source baseline, verification, manual gates, and final status. Do not overwrite Patch 03 or silently replace the locked source.

## Known Release Gates and Parked Work

1. **Manual gate:** Play Route 01 on an iPhone using the physical on-screen controls; confirm touch feel, readable prompts, and tunnel exit guidance.
2. **Copy defect:** the win card states “36 PARTS RECOVERED,” but the route data contains 33 parts (3 + 4 + 5 + 6 + 7 + 8). Correct it only in a new narrow copy patch.
3. **Parked:** new routes, mechanics, characters, content, level geometry, controller redesign, and emulator redesign. None are authorized by this lock.

## Next Authorized Objective

Complete the iPhone Route 01 playthrough and report only a route-blocking, touch, or readability defect. If none is found, issue the narrow 33-part completion-card patch before any content expansion.

## Do Not Do

- Do not merge Moon Trash with any other arcade game or project canon.
- Do not treat the earlier “Level 01” label as proof that only one route exists.
- Do not claim physical-device acceptance before the manual gate is completed.
- Do not change gameplay or presentation under the build-lock decision.
