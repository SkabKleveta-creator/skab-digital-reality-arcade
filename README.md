# SKAB DIGITAL REALITY ARCADE

Play original browser-based mini-games, arcade prototypes, and testable browser demos built around systems, signal, recovery, route logic, and experimental gameplay.

Built and maintained by Kenneth Kleveta.

Public arcade:

https://skabkleveta-creator.github.io/skab-digital-reality-arcade/

---

## PURPOSE

Skab Digital Reality Arcade started as a practical experiment:

Can small browser games become a low-cost way to learn game design, test ideas quickly, and turn creative momentum into playable proof?

This is not a studio launch or storefront. It is a public workshop for browser-first prototypes, rough playable loops, mobile testing, design iteration, and direct developer feedback.

The goal is not to pretend every prototype is complete.

The goal is to create enough playable evidence to learn what deserves to grow, what needs to be redesigned, and what should be retired.

---

## PLAY IN YOUR BROWSER

No downloads.

No installs.

Designed to run directly in modern browsers on:

* Phone browsers
* Tablets
* Laptops
* Desktops
* Connected displays

---

## LIVE PLAYABLE

### DIGITAL REALITY RUN

A first-person recovery run through fractured digital sectors. Cut the command signal, collapse Replicator Stations, shut down Automatons, and enter the Signal Gate.

Play:

https://skabkleveta-creator.github.io/FPS-002/

Status:

Live playable

---

### BLACKBOX SQUADRON

A retro vertical shooter with power-ups, quick restarts, mobile controls, and score-chasing arcade pressure.

Play:

https://skabkleveta-creator.github.io/BLACKBOX_SQUADRON_Public_Game/

Status:

Live playable

---

### ANCHOR RUN

A compact route-running prototype built around unstable floors, recovery anchors, sector validation, and keeping the route alive.

Play:

https://skabkleveta-creator.github.io/ANCHOR_RUN_Public_Game/

Status:

Live playable

---

## INTERNAL ARCADE DEMOS

These demos live inside this arcade repository under the `games/` folder.

### SIGNAL SWEEPER

Fast containment arcade prototype about sweeping corrupted data, restoring signal fragments, and escaping before the grid closes.

Play:

https://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/signal_sweeper/

Status:

In Build Queue / demo folder available

---

### RELAY RUSH

Signal-routing arcade demo focused on timing, pressure, and clean mobile-friendly control flow.

Play:

https://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/relay-rush/

Status:

Testable Demo

---

### NODE BLASTER

Side-scrolling digital tunnel action demo built around continuous movement, pressure, and node-clearing.

Play:

https://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/node-blaster/

Status:

Testable Demo

---

### BREACH DROP

Downward-flowing route breach demo focused on movement, recovery space, and no-dead-end path design.

Play:

https://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/breach-drop/

Status:

Testable Demo

---

## DESIGN REVIEW

### CONNECTION TRACE

Connection Trace is being redesigned as a compact diagnostic puzzle about finding the one broken relationship that prevents a system from validating truth.

Current design direction:

* Observe
* Scan
* Reveal
* Mark
* Stabilize
* Validate

Core rule:

The player does not fix everything. The player identifies the critical bad connection.

Status:

Concept Under Review

---

## FEEDBACK

Public feedback is handled by email only.

Email:

[skabdigitalarcade@gmail.com](mailto:skabdigitalarcade@gmail.com)

Please include:

* Game name
* Device
* Browser
* Link used
* Wi-Fi or cellular
* What happened
* Expected result

GitHub Issues are not the public feedback path for the arcade.

---

## REPOSITORY STRUCTURE

Expected structure:

```text
/
├─ index.html
├─ 404.html
├─ README.md
├─ site-version.json
└─ games/
   ├─ signal_sweeper/
   │  └─ index.html
   ├─ relay-rush/
   │  └─ index.html
   ├─ node-blaster/
   │  └─ index.html
   └─ breach-drop/
      └─ index.html
```

---

## FRESH VERSION SYSTEM

The homepage uses `site-version.json` to help visitors receive the newest version without needing to manually clear browser cache.

When the arcade homepage is updated, update both:

```text
index.html
site-version.json
```

Current homepage version:

```text
2026.06.19.008
```

If the version in `site-version.json` is newer than the loaded page, the homepage redirects itself with a versioned URL.

---

## DEVELOPMENT METHOD

The arcade is built using a lightweight disciplined process:

```text
IDEA → LOOP → TEST → PATCH → PROOF
```

Working principles:

* Small enough to finish
* Real enough to judge
* Phone-first testing matters
* One focused patch at a time
* Design locks prevent drift
* Field testing beats assumption
* Broken prototypes are data

---

## BUILT WITH

* HTML
* CSS
* JavaScript
* GitHub Pages

---

Routes still move.

Purpose does not.
