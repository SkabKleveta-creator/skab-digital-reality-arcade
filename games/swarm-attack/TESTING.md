# Testing Level I

Run `node --test tests/*.test.mjs` first. Serve the repository over HTTP for browser testing. Check both cameras on desktop and on a touch device.

| Check | Expected result |
| --- | --- |
| Start | The player appears at Pilgrim’s Gate with a route ahead and a persistent ward objective. No swarm announcement appears. |
| Wait at the entrance | No timed waves spawn. Nearby patrols remain on their routes until alerted. |
| Explore both branches | The graveyard and market connect to the crossroads. Neither branch requires the other ward first. |
| Enemy placement | Encounters occupy the positions in `level.mjs`. Distant enemies do not immediately charge the player. |
| Patrol and pursuit | Patrollers move between their waypoints. Alerted enemies follow navigable ground and return when lured too far from home. |
| Melee and ranged | Every weapon works throughout the map. Closed gates, walls, pillars, and other solid obstacles stop attacks passing through them. |
| Ward collection | G or the touch prompt takes a ward after nearby guardians are cleared. The second ward opens the cloister gate. |
| Bridge | The narrow route crosses the dark water. Movement and dodge cannot pass through its side barriers. |
| Checkpoint | The cloister shrine restores resources and becomes the return location after death. |
| Death | Wards and defeated enemies stay recorded. Living enemies return to their home locations at full health. |
| Supplies | Walking over a cache collects it once. Restarting the whole level restores caches. |
| Sanctuary | The Bellkeeper has a boss health bar and a larger attack warning. Its attacks accelerate below half health. |
| Ending | With the wards recovered and Bellkeeper defeated, use the breach prompt. The completion screen appears immediately and gameplay stops. |
| Restart | All original placements, objectives, gate state, and resources reset. |
| Camera | Isometric and shoulder views follow the player across every area. Architecture fades when it hides the player in isometric view. |
| Navigation map | The map shows the route, current position, uncollected wards, shrine, breach, and visible nearby enemies. |
| Touch | Movement, attacks, look-dragging, and interaction work with multiple fingers; releasing one does not cancel another. |
| Resize / rotate | Essential controls, objective, and interaction prompt remain accessible in portrait and landscape. |
| Pause / focus loss | Simulation pauses and resumes without progressing enemies, projectiles, or objectives in the background. |

Report device, browser, area, camera, weapon, and steps to reproduce. Browser/device rendering and balance require live playtesting; the automated simulation tests do not establish those results.
