# Validation — September 22, 2026

## Automated simulation and geometry checks

`npm test`: **14 tests passed, 0 failed** on Node.js 24.19.0.

Coverage includes starting resources and defenses; timed construction; worker and workplace limits; cancellation refunds; upgrades and repairs; neighboring territory claims; perimeter breaches; recruitment; expeditions and the home garrison; trade and storage limits; seasonal and policy effects; raids and a full year of bounded resources; save restoration and invalid-save rejection.

Geometry validation exercised **232 combinations** of structure type, supported level, and rotation. All generated meshes contained finite vertices.

## Browser checks

Headless Chromium with software WebGL rendered the game over HTTP under `/Kingdom_Maker/`, matching the GitHub Pages subdirectory layout.

| Viewport | Results |
| --- | --- |
| Desktop, 1440 × 900 | Loaded; all five management dialogs; cottage placement; placement rotation; camera controls; rename and save reload passed |
| Phone portrait, 390 × 844 | Loaded; all five management dialogs; touch cottage placement; placement rotation; camera controls; rename and save reload passed |
| Phone landscape, 844 × 390 | Loaded; all five management dialogs; touch cottage placement; placement rotation; visible camera controls; rename and save reload passed |

No page exceptions, failed asset responses, or document-level horizontal overflow were observed. Desktop, portrait, and landscape screenshots were inspected. Narrow build categories and the building catalog scroll horizontally.

These are emulated viewport checks, not physical iPhone/Safari or Android device testing. Hosting status is separate from local validation and is reported by the repository's Pages workflow.
