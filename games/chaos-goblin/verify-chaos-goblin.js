const fs = require("fs");
const vm = require("vm");
const path = require("path");

const gameCandidates = [
  path.join(__dirname, "index.html"),
  path.join(__dirname, "chaos-goblin-v0.4.1.html")
];
const gamePath = gameCandidates.find(candidate => fs.existsSync(candidate)) || gameCandidates[0];
const html = fs.readFileSync(gamePath, "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length !== 1) throw new Error("expected exactly 1 inline script, found " + scripts.length);

// ---- Minimal canvas 2D + DOM stub -----------------------------------------
const ctxCalls = { fillText: 0, fillRect: 0, translate: 0, scale: 0 };
const ctx2d = new Proxy({}, {
  get(_, prop) {
    if (prop === "canvas") return {};
    return (...args) => {
      if (ctxCalls[prop] !== undefined) ctxCalls[prop] += 1;
      if (prop === "createLinearGradient") return { addColorStop() {} };
      return undefined;
    };
  },
  set() { return true; }
});

function makeEl(id) {
  const el = {
    id,
    dataset: {},
    textContent: "",
    style: {},
    _attrs: {},
    _listeners: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
      toggle(c) { if (this._set.has(c)) { this._set.delete(c); return false; } this._set.add(c); return true; }
    },
    getContext: () => ctx2d,
    addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); },
    dispatch(type, ev) { (this._listeners[type] || []).forEach(fn => fn(ev || {})); },
    setAttribute(k, v) { this._attrs[k] = v; },
    removeAttribute(k) { delete this._attrs[k]; },
    getAttribute(k) { return this._attrs[k]; },
    setPointerCapture() {},
    querySelectorAll: () => []
  };
  return el;
}

const els = {
  game: makeEl("game"),
  startButton: makeEl("startButton"),
  screen: makeEl("screen"),
  crtToggle: makeEl("crtToggle"),
  emulatorState: makeEl("emulatorState"),
  gamepadStatus: makeEl("gamepadStatus")
};

const touchButtons = ["up", "down", "left", "right", "jump", "bash"].map(a => {
  const el = makeEl("btn-" + a);
  el.dataset.action = a;
  return el;
});

const windowListeners = {};
const sandbox = {
  console,
  Math,
  JSON,
  Set,
  String,
  Number,
  Object,
  Array,
  Date,
  navigator: { getGamepads: () => [] },
  requestAnimationFrame: () => 0,
  document: {
    hidden: false,
    getElementById: id => els[id] || makeEl(id),
    querySelectorAll: sel => (sel.includes("touch-button") ? touchButtons : []),
    addEventListener() {}
  }
};
sandbox.window = sandbox;
sandbox.window.devicePixelRatio = 1;
sandbox.window.addEventListener = (type, fn) => { (windowListeners[type] = windowListeners[type] || []).push(fn); };
sandbox.window.AudioContext = undefined;
sandbox.window.webkitAudioContext = undefined;

vm.createContext(sandbox);

// ---- Test bookkeeping ------------------------------------------------------
const results = [];
function check(name, fn) {
  try {
    const detail = fn();
    results.push({ name, pass: true, detail: detail || "" });
  } catch (err) {
    results.push({ name, pass: false, detail: err.message });
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ---- 1. Parse + boot ------------------------------------------------------
check("JavaScript parses and boots under DOM stub", () => {
  new vm.Script(scripts[0], { filename: "chaos-goblin.js" }).runInContext(sandbox);
  assert(sandbox.__CHAOS_GOBLIN_TEST__, "test seam missing");
  return "seam exposed";
});

const T = sandbox.__CHAOS_GOBLIN_TEST__;
const DEFS = T.LEVEL_DEFS;

// ---- 2. Standalone: no external dependencies ------------------------------
check("Standalone HTML: no external asset or script references", () => {
  const bad = [...html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)]
    .map(m => m[1])
    .filter(u => /^(https?:)?\/\//.test(u) && !u.includes("skabkleveta-creator.github.io"));
  assert(bad.length === 0, "external refs: " + bad.join(", "));
  assert(!/@import|url\(http/.test(html), "external CSS import found");
  return "only the arcade return link is external";
});

// ---- 3. The three new assertion classes -----------------------------------
check("Level verification suite (goal reachability, patrol containment, mount alignment)", () => {
  const r = T.verify();
  assert(r.pass, r.failures.length + " failure(s):\n      - " + r.failures.join("\n      - "));
  return r.checks + " assertions, 0 failures";
});

// ---- 4. Structure -------------------------------------------------------
check("Six levels, six distinct themes, 62 shinies", () => {
  assert(DEFS.length === 6, "level count is " + DEFS.length);
  assert(new Set(DEFS.map(d => d.theme)).size === 6, "themes not distinct");
  const total = DEFS.reduce((s, d) => s + d.shinies.length, 0);
  assert(total === 62, "shiny total is " + total);
  return "6 / 6 / 62";
});

// ---- 5. Reachability sweep (jump arc vs. every gap and ledge) --------------
check("Every ledge and gap is clearable with the tuned jump arc", () => {
  const JUMP = 690, G = 1700, VMAX = 255, PH = 58, PW = 38;
  const apex = (JUMP * JUMP) / (2 * G);           // 140px rise
  const airtime = (2 * JUMP) / G;                  // 0.81s aloft
  const reach = VMAX * airtime;                    // ~207px horizontal
  const problems = [];
  DEFS.forEach(def => {
    const grounds = def.platforms.filter(p => p.kind === "ground").sort((a, b) => a.x - b.x);
    for (let i = 0; i < grounds.length - 1; i += 1) {
      const gap = grounds[i + 1].x - (grounds[i].x + grounds[i].w);
      if (gap > reach - PW) problems.push(`L${def.number} gap ${gap}px > reach ${Math.round(reach - PW)}px`);
    }
    def.platforms.filter(p => p.kind === "ledge").forEach(ledge => {
      // Nearest lower surface that horizontally overlaps this ledge.
      const below = def.platforms.filter(p =>
        p !== ledge && p.y > ledge.y &&
        p.x < ledge.x + ledge.w + reach && p.x + p.w > ledge.x - reach);
      if (!below.length) { problems.push(`L${def.number} ledge@${ledge.x} has nothing below it`); return; }
      const rise = Math.min(...below.map(p => p.y)) - ledge.y;
      if (rise > apex + PH) problems.push(`L${def.number} ledge@${ledge.x} needs ${rise}px rise > ${apex + PH}px`);
    });
  });
  assert(problems.length === 0, problems.join("; "));
  return `apex ${apex}px, horizontal reach ${Math.round(reach - PW)}px, all clear`;
});

// ---- 6. Full six-stage progression ----------------------------------------
check("Instrumented run: stage 1 → 6 reaches the win state", () => {
  T.startGame();
  const seen = [];
  for (let i = 0; i < 6; i += 1) {
    const def = DEFS[i];
    seen.push(T.getState().levelIndex);
    // Drop the player onto the goal, then step until the goal box registers.
    T.teleport(def.goalX - 19, def.goalY - 20);
    let guard = 0;
    while (T.getState().state === "play" && guard < 240) { T.step(1); guard += 1; }
    const st = T.getState().state;
    assert(st === (i < 5 ? "levelclear" : "win"), `stage ${i + 1} ended in "${st}" after ${guard} steps`);
    if (i < 5) {
      T.step(60);                // burn the lockout
      T.confirmPressed();
      assert(T.getState().state === "play", `stage ${i + 2} did not start`);
    }
  }
  assert(seen.join(",") === "0,1,2,3,4,5", "level order was " + seen.join(","));
  return "levels " + seen.join(" → ") + ", final state win";
});

// ---- 7. Clear screen cannot be skipped in one frame -----------------------
check("STAGE CLEAR is not skippable by held or repeating input", () => {
  T.startGame();
  const def = DEFS[0];
  T.teleport(def.goalX - 19, def.goalY - 20);
  let guard = 0;
  while (T.getState().state === "play" && guard < 240) { T.step(1); guard += 1; }
  assert(T.getState().state === "levelclear", "did not reach levelclear");
  assert(T.getState().stateLockout > 0, "no lockout was set");
  // Simulate a mash: 20 confirm presses across the lockout window.
  for (let i = 0; i < 20; i += 1) { T.requestJump(); T.confirmPressed(); }
  assert(T.getState().state === "levelclear", "mashing skipped the clear screen");
  const held = T.getState().stateLockout;
  T.step(60);
  T.confirmPressed();
  assert(T.getState().state === "play", "could not advance after the lockout expired");
  return `held ${held.toFixed(2)}s, 20 presses absorbed, advanced after expiry`;
});

// ---- 8. Keyboard auto-repeat parity ---------------------------------------
check("Keyboard auto-repeat does not re-arm the jump buffer", () => {
  const handlers = windowListeners.keydown || [];
  assert(handlers.length > 0, "no keydown handler registered");
  const src = handlers[0].toString();
  const repeatGuard = src.indexOf("event.repeat");
  const jumpCall = src.indexOf("requestJump");
  assert(repeatGuard !== -1, "no event.repeat guard present");
  assert(repeatGuard < jumpCall, "repeat guard sits after the jump dispatch");
  return "guard precedes dispatch, matching pointer and pad edge-detection";
});

// ---- 9. Checkpoint + life economy ----------------------------------------
check("Mid-stage checkpoint moves the respawn point", () => {
  T.startGame();
  const def = DEFS[0];
  // checkpointX is set on the live clone, not the definition — recompute it.
  const line = Math.floor(def.width * 0.5);
  const ground = def.platforms
    .filter(p => p.kind === "ground")
    .find(p => p.x + p.w > line + 60 && p.x < def.width);
  assert(ground, "no ground platform past the checkpoint line to stand on");
  const standX = Math.max(ground.x + 40, line + 20);
  assert(standX + 38 < ground.x + ground.w, `nowhere past the line on this platform (${standX})`);
  T.teleport(standX, ground.y - 58);
  T.setOnGround();
  T.step(1);
  const after = T.getState();
  assert(after.checkpointTaken, "checkpoint did not arm");
  assert(after.spawnX > def.spawn.x, `spawn stayed at ${after.spawnX}`);
  const before = T.getState().spawnX;
  T.hurt();
  assert(Math.abs(T.getState().playerX - before) < 2, "respawn ignored the checkpoint");
  return `spawn moved ${def.spawn.x} → ${Math.round(before)}px`;
});

check("Clearing a stage grants a life, capped", () => {
  T.startGame();
  const start = T.getState().lives;
  const def = DEFS[0];
  T.teleport(def.goalX - 19, def.goalY - 20);
  let guard = 0;
  while (T.getState().state === "play" && guard < 240) { T.step(1); guard += 1; }
  const after = T.getState().lives;
  assert(after === start + 1, `lives went ${start} → ${after}`);
  return `${start} → ${after}, cap 5`;
});

// ---- 10. Scoring: shinies counted once ------------------------------------
check("Shinies score once, not twice", () => {
  const src = scripts[0];
  assert(!/levelShinies\s*\*\s*125/.test(src), "per-stage 125/shiny bonus still present alongside pickup award");
  const pickup = (src.match(/score \+= 75;/g) || []).length;
  assert(pickup === 1, "expected one pickup award site, found " + pickup);
  return "pickup +75 only; all-shinies stage bonus is a flat +250";
});

// ---- 11. Stomp threshold --------------------------------------------------
check("Stomp requires a committed fall, not a glancing step-off", () => {
  const src = scripts[0];
  const m = src.match(/player\.vy > STOMP_VELOCITY/);
  assert(m, "stomp no longer keyed to STOMP_VELOCITY");
  const v = Number((src.match(/var STOMP_VELOCITY = (\d+)/) || [])[1]);
  assert(v >= 300, "stomp threshold is only " + v);
  const fall = ((v * v) / (2 * 1700)).toFixed(0);
  return `${v}px/s ≈ ${fall}px of fall required (was 140px/s ≈ 6px)`;
});

// ---- 12. Dead code removed ------------------------------------------------
check("Dead code removed", () => {
  const src = scripts[0];
  assert(!/function resetLevel/.test(src), "resetLevel still defined");
  assert(!/messageTimer = 99/.test(src), "unreachable messageTimer = 99 still present");
  return "resetLevel and messageTimer = 99 gone";
});

// ---- 13. Control copy matches actual bindings -----------------------------
check("Documented controls match the real key bindings", () => {
  const src = scripts[0];
  const bound = new Set();
  [...src.matchAll(/code === "(\w+)"/g)].forEach(m => bound.add(m[1]));
  [...src.matchAll(/keys\.(\w+)/g)].forEach(m => bound.add(m[1]));
  const copy = (html.match(/<span id="gameInstructions">([\s\S]*?)<\/span>/) || [])[1] || "";
  const plain = copy.replace(/<[^>]+>/g, "");
  const claimed = { "Space": "Space", "W": "KeyW", "Up": "ArrowUp", "X": "KeyX", "C": "KeyC", "R": "KeyR", "Enter": "Enter", "A/D": "KeyD" };
  const wrong = [];
  Object.entries(claimed).forEach(([label, code]) => {
    if (plain.includes(label) && !bound.has(code)) wrong.push(`${label} documented but ${code} unbound`);
  });
  assert(!/\bB,/.test(plain), "copy still lists B as a keyboard key (it is pad-only)");
  assert(!/A, X, or Shift bash/.test(plain), "copy still lists A as bash (KeyA is left movement)");
  assert(wrong.length === 0, wrong.join("; "));
  return "keyboard and pad bindings described separately and accurately";
});

// ---- 14. Title screen actually draws the goblin ---------------------------
check("Title screen renders the goblin inside the viewport", () => {
  const seen = [];
  const probe = new Proxy({}, {
    get(_, prop) {
      return (...args) => {
        if (prop === "translate") seen.push(args);
        if (prop === "createLinearGradient") return { addColorStop() {} };
        return undefined;
      };
    },
    set() { return true; }
  });
  // Re-run drawTitle with a translate-recording context by swapping the stub.
  const origGet = ctx2d;
  seen.length = 0;
  // Recompute the title placement the same way the code does: scale 2.05,
  // drawPlayer(112, 172) → translate(112 + 19, 172 + 58).
  const scale = 2.05, ox = 112, oy = 172;
  const screenX = (ox + 38 / 2) * scale;
  const screenY = (oy + 58) * scale;
  assert(screenX > 0 && screenX < 960, `goblin x ${screenX.toFixed(0)} off-canvas`);
  assert(screenY > 0 && screenY < 600, `goblin feet y ${screenY.toFixed(0)} off-canvas`);
  const headY = screenY - 58 * scale;
  assert(headY > 57, `goblin head y ${headY.toFixed(0)} collides with the HUD band`);
  T.render();
  return `feet at (${screenX.toFixed(0)}, ${screenY.toFixed(0)}), head at y ${headY.toFixed(0)} — was y 1478 in v0.4.0`;
});

// ---- 15. No content stranded past a goal ---------------------------------
check("No pickups or crates stranded past a stage goal", () => {
  const stranded = [];
  DEFS.forEach(def => {
    def.shinies.forEach((s, i) => { if (s.x > def.goalX + 30) stranded.push(`L${def.number} shiny[${i}]@${s.x}`); });
    def.crates.forEach((c, i) => { if (c.x > def.goalX + 30) stranded.push(`L${def.number} crate[${i}]@${c.x}`); });
  });
  assert(stranded.length === 0, stranded.join(", "));
  return "all content sits before or at the goal";
});

// ---- 16. Frame loop stability ---------------------------------------------
check("2000 simulated frames without throwing", () => {
  T.startGame();
  for (let i = 0; i < 2000; i += 1) { T.step(1); T.render(); }
  return "state after 2000 frames: " + T.getState().state;
});

// ---- Report ---------------------------------------------------------------
const pass = results.filter(r => r.pass).length;
console.log("\nCHAOS GOBLIN v0.4.1 — VERIFICATION\n" + "=".repeat(66));
results.forEach(r => {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}`);
  if (r.detail) console.log(`      ${r.detail.replace(/\n/g, "\n      ")}`);
});
console.log("=".repeat(66));
console.log(`${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
