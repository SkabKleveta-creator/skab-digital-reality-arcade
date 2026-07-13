# GATOR RAID v0.4.4 — Command Board + Placement UX

## Purpose

Reduce left-sidebar cognitive load without removing instructional support or changing gameplay mechanics.

## Changes

- Renames the left sidebar to **Command Board**.
- Organizes the interface into collapsible Mission, Planning, Execution, Recovery, AAR, and About sections.
- Preserves instructional text inside collapsible **Planning Guidance**.
- Groups planning tools into Control Points, Support, and Friction.
- Adds click → cursor change → ghost preview → place behavior.
- Keeps single-placement markers distinct from repeatable friction placement.
- Moves developer/prototype information into **About This Prototype**.
- Automatically emphasizes Execution, Recovery, and AAR as those states become active.

## Guardrails

- No mechanics changes.
- No timing changes.
- No disruption/recovery logic changes.
- No AAR logic changes.
- No production overwrite.
- This version depends on the same-origin `v0.4.3-aar` test build and applies the Command Board as a focused UI patch.

## Acceptance Test

A first-time player should be able to:

1. Read the mission.
2. Open Planning Guidance when needed.
3. Select a planning tool.
4. See the cursor/preview change.
5. Place the item on the board.
6. Lock and execute the plan without searching through unrelated prototype notes.
