import { LEVELS, ENEMY_TYPES } from './data.mjs';
export { LEVELS } from './data.mjs';
export const TILE = 16;
export const GROUND = 96;
export const SAVE_VERSION = 2;
const GRAVITY = 460;
const SPEED = 80;
const PLAYER_W = 12;
const PLAYER_H = 22;
const MAX_HP = 12;
const CLUB_MAX = 24;
const STATES = ['playing', 'paused', 'dead', 'stageclear', 'complete'];
const PHASES = ['idle', 'windup', 'lunge', 'recovery'];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const clone = value => JSON.parse(JSON.stringify(value));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const finite = (n, lo, hi) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
const emptyColumn = () => Array(12).fill(0);

export function buildLevel(index) {
  if (!Number.isInteger(index) || !LEVELS[index]) throw new RangeError('Unknown route');
  const definition = LEVELS[index];
  const cols = [], caveFlags = [], rawEnemies = [], rawItems = [], segments = [];
  let cursor = 0, goalX = 0, arenaStart = null;
  for (const segment of definition.segments) {
    const start = cursor;
    segments.push({ type: segment.type, x: start * TILE, width: segment.len * TILE });
    for (let i = 0; i < segment.len; i++) {
      const col = emptyColumn();
      const hole = segment.type === 'gapflat' || (segment.type === 'platforms' && segment.gapCols?.includes(i));
      const cave = segment.type === 'cave';
      if (!hole) {
        col[6] = cave ? 4 : segment.type === 'platforms' ? 3 : 1;
        if (segment.type !== 'platforms') for (let row = 7; row < 12; row++) col[row] = cave ? 4 : 2;
      }
      if (cave) { col[0] = 4; col[1] = 4; }
      cols.push(col);
      caveFlags.push(cave);
    }
    for (const shelf of segment.shelves || []) {
      for (let i = 0; i < shelf.len; i++) cols[start + shelf.at + i][shelf.row] = 3;
    }
    for (const spec of segment.enemies || []) {
      rawEnemies.push({ type: spec.type, x: (start + spec.at) * TILE });
      if (spec.type === 'greatbeast') arenaStart = (start + 1) * TILE;
    }
    for (const spec of segment.items || []) rawItems.push({ type: spec.type, x: (start + spec.at) * TILE + 3, y: GROUND - 15 });
    if (segment.type === 'goal') goalX = (start + Math.min(segment.len - 1, 5)) * TILE;
    cursor += segment.len;
  }
  // Guarantee at least three full footing columns between neighboring pits.
  let previousGapEnd = -999;
  for (let col = 0; col < cols.length; col++) {
    if (cols[col][6]) continue;
    let end = col;
    while (end + 1 < cols.length && !cols[end + 1][6]) end++;
    if (col - previousGapEnd - 1 < 3) {
      for (let c = col; c <= end; c++) cols[c][6] = 3;
    } else previousGapEnd = end;
    col = end;
  }
  const width = cursor * TILE;
  const floorAt = x => Boolean(cols[Math.floor(x / TILE)]?.[6]);
  const enemies = rawEnemies.map((spec, n) => {
    const cfg = ENEMY_TYPES[spec.type];
    let x = spec.x;
    if (!cfg.flying) {
      while ((!floorAt(x + 2) || !floorAt(x + cfg.w - 2)) && x < width - cfg.w) x += TILE;
    }
    const y = cfg.flying ? (spec.type === 'bat' ? 62 : 44) : GROUND - cfg.h;
    return {
      id: `e${index}-${n}`, type: spec.type, x, y, w: cfg.w, h: cfg.h,
      hp: cfg.hp, maxHp: cfg.hp, alive: true, boss: spec.type === 'greatbeast',
      dir: -1, vx: 0, vy: 0, phase: 'idle', phaseTimer: 0, tell: 0,
      flash: 0, attackCooldown: 0.4, homeX: x, homeY: y, t: n * 0.83,
      lungeDir: -1, minX: Math.max(8, x - 60), maxX: Math.min(width - cfg.w - 8, x + 60)
    };
  });
  const items = rawItems.map((spec, n) => ({ id: `i${index}-${n}`, ...spec, w: spec.type === 'meat' ? 9 : 10, h: spec.type === 'meat' ? 8 : 9, alive: true }));
  const safeCamp = target => {
    let best = null, score = Infinity;
    for (let col = 3; col < cursor - 7; col++) {
      const x = col * TILE;
      if (![-2, -1, 0, 1, 2, 3].every(offset => cols[col + offset]?.[6])) continue;
      if (enemies.some(e => Math.abs(e.homeX - x) < 44)) continue;
      const distance = Math.abs(x - target);
      if (distance < score) { best = x; score = distance; }
    }
    return best;
  };
  const campXs = [32];
  for (const target of [width * 0.34, width * 0.68, ...(arenaStart ? [arenaStart - 28] : [])]) {
    const x = safeCamp(target);
    if (x !== null && x > 160 && x < goalX - 120 && campXs.every(old => Math.abs(old - x) > 160)) campXs.push(x);
  }
  campXs.sort((a, b) => a - b);
  const checkpoints = campXs.map((x, n) => ({ id: `c${index}-${n}`, x, y: GROUND, active: n === 0, reached: n === 0, label: n === 0 ? 'Trailhead' : `Camp ${n}` }));
  let relicX = safeCamp(width * 0.52) ?? 80;
  let relicY = GROUND - 15;
  // The optional ridge route has a tangible reward, reachable from the lower path.
  if (index === 1 || index === 3) {
    const shelfCol = cols.findIndex(col => col[3] === 3);
    if (shelfCol >= 0) { relicX = (shelfCol + 1) * TILE; relicY = 3 * TILE - 14; }
  }
  items.push({ id: `r${index}`, type: 'relic', x: relicX, y: relicY, w: 8, h: 10, alive: true });
  return { ...definition, cols, caveFlags, totalCols: cursor, width, goalX, arenaStart, enemies, items, checkpoints, segments };
}

function makePlayer() {
  return { x: 32, y: GROUND - PLAYER_H, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, onGround: true, facing: 1,
    hp: MAX_HP, maxHp: MAX_HP, club: CLUB_MAX, clubMax: CLUB_MAX, stamina: 100, maxStamina: 100,
    attackTimer: 0, attackCooldown: 0, dodgeTimer: 0, dodgeCooldown: 0, invuln: 0,
    coyote: 0.11, jumpBuffer: 0, jumpHeld: false, attackSerial: 0 };
}

export class Game {
  constructor() {
    this.state = 'title'; this.levelIndex = 0; this.level = buildLevel(0); this.player = makePlayer();
    this.time = 0; this.deaths = 0; this.kills = 0; this.relics = 0; this.message = 'The path is yours.';
    this.checkpointLabel = 'Trailhead'; this.events = []; this._previous = {}; this._checkpoint = null;
  }
  newRun() {
    this.levelIndex = 0; this.time = 0; this.deaths = 0; this.kills = 0; this.relics = 0;
    this.player = makePlayer(); this._loadLevel(false); this.state = 'playing';
    this._checkpoint = this._capture('playing'); this.events = []; return true;
  }
  _loadLevel(keepProgress = true) {
    const carry = { hp: this.player.hp, club: this.player.club, stamina: this.player.stamina };
    this.level = buildLevel(this.levelIndex); this.player = makePlayer();
    if (keepProgress) Object.assign(this.player, carry);
    this.state = 'playing'; this.checkpointLabel = 'Trailhead'; this.message = LEVELS[this.levelIndex].description;
    this._previous = {}; this._bossAnnounced = false; this._checkpoint = this._capture('playing');
  }
  pause() { if (this.state !== 'playing') return false; this.state = 'paused'; this._previous = {}; return true; }
  resume() { if (this.state !== 'paused') return false; this.state = 'playing'; this._previous = {}; return true; }
  retry() {
    if (!this._checkpoint || !['dead', 'paused', 'playing'].includes(this.state)) return false;
    const deaths = this.deaths, time = this.time;
    this._apply(clone(this._checkpoint));
    this.deaths = deaths; this.time = time; this.state = 'playing'; this._previous = {}; this.events = [];
    // A saved live lunge must not kill a one-HP hunter before input can respond.
    // This brief recovery protection changes no supplies, enemies or rewards.
    this.player.invuln = Math.max(this.player.invuln, 1.1);
    this.message = `${this.checkpointLabel}. Supplies restored to exactly what you carried here.`;
    return true;
  }
  nextLevel() {
    if (this.state !== 'stageclear' || this.levelIndex >= LEVELS.length - 1) return false;
    this.levelIndex++; this._loadLevel(true); this.events = []; return true;
  }
  drainEvents() { const events = this.events; this.events = []; return events; }
  _event(type, text = '', x = this.player.x, y = this.player.y) { this.events.push({ type, text, x, y }); }
  _floorAt(x) { return Boolean(this.level.cols[Math.floor(x / TILE)]?.[6]); }
  _safeFeet(x, w) { return this._floorAt(x + 2) && this._floorAt(x + w - 2); }
  _damage(amount) {
    const p = this.player;
    if (p.invuln > 0 || p.dodgeTimer > 0 || this.state !== 'playing') return;
    p.hp = Math.max(0, p.hp - amount); p.invuln = 1.1;
    // Never displace the hunter into a nearby pit when taking damage.
    this._event('hurt', `−${amount}`);
    if (p.hp <= 0) this._die('The hunt is not over. Return to your last camp.');
  }
  _die(message) {
    if (this.state !== 'playing') return;
    this.state = 'dead'; this.deaths++; this.message = message; this._event('death', message);
  }
  _strike() {
    const p = this.player;
    const armed = p.club > 0;
    p.attackTimer = 0.24; p.attackCooldown = armed ? 0.37 : 0.29; p.attackSerial++;
    const reach = armed ? 23 : 17;
    const hitbox = { x: p.facing > 0 ? p.x + p.w - 2 : p.x - reach + 2, y: p.y - 5, w: reach, h: p.h + 9 };
    let connected = false;
    for (const e of this.level.enemies) {
      if (!e.alive || !overlap(hitbox, e)) continue;
      connected = true;
      const damage = armed ? 3 : 1;
      e.hp = Math.max(0, e.hp - damage); e.flash = 0.18;
      if (!e.boss) { e.phase = 'recovery'; e.phaseTimer = e.type === 'tiger' ? 0.27 : 0.39; e.tell = 0; }
      this._event('hit', `${damage}`, e.x + e.w / 2, e.y);
      if (e.hp === 0) { e.alive = false; this.kills++; if (e.boss) { this.message = 'The Great Beast has fallen. Follow the light home.'; this._event('boss', 'The Great Beast has fallen.', e.x, e.y); } }
    }
    if (connected && armed) { p.club--; if (p.club === 0) this.message = 'Club broken. Your fists still fight. Find a replacement ahead.'; }
    this._event('swing', armed ? 'club' : 'fist');
  }
  _movePlayer(dt, input) {
    const p = this.player;
    const jumpPressed = Boolean(input.jump && !this._previous.jump);
    const dodgePressed = Boolean(input.dodge && !this._previous.dodge);
    if (jumpPressed) p.jumpBuffer = 0.13;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    p.coyote = p.onGround ? 0.11 : Math.max(0, p.coyote - dt);
    if (p.jumpBuffer > 0 && p.coyote > 0 && p.dodgeTimer <= 0) {
      p.vy = -182; p.onGround = false; p.coyote = 0; p.jumpBuffer = 0;
      this._event('jump');
    }
    if (!input.jump && this._previous.jump && p.vy < -75) p.vy = -75;
    const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
    if (direction && p.dodgeTimer <= 0) p.facing = direction;
    if (dodgePressed && p.stamina >= 28 && p.dodgeCooldown <= 0 && p.onGround) {
      p.dodgeTimer = 0.3; p.dodgeCooldown = 0.64; p.stamina -= 28; this._event('dodge');
    }
    if (p.dodgeTimer > 0) p.vx = p.facing * 132;
    else {
      const target = direction * SPEED;
      const change = (p.onGround ? 750 : 410) * dt;
      p.vx += clamp(target - p.vx, -change, change);
    }
    const wasGround = p.onGround;
    const oldBottom = p.y + p.h;
    this._previousBottom = oldBottom;
    p.x = clamp(p.x + p.vx * dt, 0, this.level.width - p.w);
    p.vy = Math.min(255, p.vy + GRAVITY * dt);
    p.y += p.vy * dt; p.onGround = false;
    const left = Math.floor((p.x + 1) / TILE), right = Math.floor((p.x + p.w - 1) / TILE);
    if (p.vy >= 0) {
      let landing = Infinity;
      for (let col = left; col <= right; col++) for (let row = 2; row < 8; row++) {
        if (!this.level.cols[col]?.[row]) continue;
        const top = row * TILE;
        if (oldBottom <= top + 1.2 && p.y + p.h >= top && top < landing) landing = top;
      }
      if (landing < Infinity) { p.y = landing - p.h; p.vy = 0; p.onGround = true; if (!wasGround) this._event('land'); }
    } else if (this.level.caveFlags[Math.floor((p.x + p.w / 2) / TILE)] && p.y < 32) {
      p.y = 32; p.vy = 0;
    }
    if (p.y > GROUND + 110) this._die('A lost footing. Return to your last camp.');
    p.jumpHeld = Boolean(input.jump);
  }
  _moveEnemies(dt) {
    const p = this.player;
    for (const e of this.level.enemies) {
      if (!e.alive) continue;
      const cfg = ENEMY_TYPES[e.type];
      e.flash = Math.max(0, e.flash - dt); e.attackCooldown = Math.max(0, e.attackCooldown - dt); e.t += dt;
      const dx = (p.x + p.w / 2) - (e.x + e.w / 2);
      const dy = (p.y + p.h / 2) - (e.y + e.h / 2);
      const close = Math.abs(dx) < (e.boss ? 102 : e.type === 'tiger' ? 78 : cfg.flying ? 72 : 53);
      const visible = Math.abs(dx) < 250;
      e.vx = 0;
      if (!visible) continue;
      if (e.phase === 'windup') {
        e.phaseTimer -= dt; e.tell = Math.max(0, e.phaseTimer);
        if (e.phaseTimer <= 0) {
          e.phase = 'lunge'; e.phaseTimer = e.boss ? 0.42 : e.type === 'tiger' ? 0.33 : 0.34;
          e.lungeDir = e.dir; e.tell = 0;
        }
      } else if (e.phase === 'lunge') {
        e.phaseTimer -= dt;
        e.vx = e.lungeDir * (e.boss ? 116 : e.type === 'tiger' ? 93 : cfg.flying ? 68 : 52);
        if (cfg.flying) e.y += clamp(dy, -50, 50) * dt * 2;
        if (e.phaseTimer <= 0) { e.phase = 'recovery'; e.phaseTimer = e.boss ? 1.05 : e.type === 'tiger' ? 0.86 : 0.58; e.vx = 0; }
      } else if (e.phase === 'recovery') {
        e.phaseTimer -= dt; e.tell = 0;
        if (e.phaseTimer <= 0) { e.phase = 'idle'; e.attackCooldown = 0.22; }
        if (cfg.flying) e.y += (e.homeY - e.y) * Math.min(1, dt * 1.5);
      } else {
        if (Math.abs(dx) > 1) e.dir = Math.sign(dx);
        if (close && e.attackCooldown <= 0 && Math.abs(dy) < (cfg.flying ? 65 : 47)) {
          e.phase = 'windup'; e.phaseTimer = e.boss ? (e.hp <= e.maxHp / 2 ? 0.58 : 0.78) : e.type === 'tiger' ? 0.62 : cfg.flying ? 0.53 : 0.4;
          e.tell = e.phaseTimer;
          if (e.boss && !this._bossAnnounced) { this._bossAnnounced = true; this.message = 'Great Beast: evade its charge, then strike during recovery.'; this._event('boss', 'The Great Beast', e.x, e.y); }
        } else if (Math.abs(dx) > (e.boss ? 65 : 36) && Math.abs(dx) < (e.boss ? 190 : 130)) {
          e.vx = e.dir * cfg.speed;
        } else if (cfg.flying) {
          e.y = e.homeY + Math.sin(e.t * 2.1) * 5;
        }
      }
      const nextX = clamp(e.x + e.vx * dt, 1, this.level.width - e.w - 1);
      if (cfg.flying || this._safeFeet(nextX, e.w)) e.x = nextX;
      else if (e.phase === 'lunge') { e.phase = 'recovery'; e.phaseTimer = 0.7; e.vx = 0; }
      if (!cfg.flying) e.y = GROUND - e.h;
      // A stomp is a descending crossing of the creature's top, never a side touch.
      const touching = overlap(p, e);
      if (touching && !e.boss && e.type !== 'tiger' && p.vy > 0 && this._previousBottom <= e.y + 2) {
        e.hp = Math.max(0, e.hp - 3); e.flash = 0.18;
        p.y = e.y - p.h; p.vy = p.jumpHeld ? -182 : -125; p.onGround = false; p.coyote = 0;
        if (e.hp === 0) { e.alive = false; this.kills++; }
        this._event('hit', 'Stomp', e.x + e.w / 2, e.y); this._event('jump');
      } else if (e.phase === 'lunge' && touching) this._damage(cfg.damage);
      if (this.state !== 'playing') return;
    }
  }
  _collectItems() {
    const p = this.player;
    const pickupBox = { x: p.x - 3, y: p.y - 2, w: p.w + 6, h: p.h + 4 };
    for (const item of this.level.items) {
      if (!item.alive || !overlap(pickupBox, item)) continue;
      if (item.type === 'meat' && p.hp >= p.maxHp) continue;
      if (item.type === 'club' && p.club >= p.clubMax) continue;
      item.alive = false;
      let text;
      if (item.type === 'meat') { const gain = Math.min(4, p.maxHp - p.hp); p.hp += gain; text = `+${gain} health`; }
      else if (item.type === 'club') { p.club = p.clubMax; text = 'Fresh club'; }
      else { this.relics++; text = 'Ancient relic'; }
      this._event('pickup', text, item.x, item.y);
    }
  }
  _checkCamp() {
    const p = this.player;
    if (!p.onGround || Math.abs(p.y + p.h - GROUND) > 0.5) return;
    for (const camp of this.level.checkpoints) {
      if (camp.reached || Math.abs(p.x - camp.x) > 18) continue;
      camp.reached = true;
      for (const other of this.level.checkpoints) other.active = other === camp;
      this.checkpointLabel = camp.label;
      this.message = 'Camp reached. Your journey is saved with the supplies you carry.';
      this._checkpoint = this._capture('playing');
      Object.assign(this._checkpoint.player, { vx: 0, vy: 0, attackTimer: 0, attackCooldown: 0, dodgeTimer: 0, dodgeCooldown: 0, invuln: 0, jumpBuffer: 0, jumpHeld: false, coyote: 0.11 });
      this._event('checkpoint', camp.label, camp.x, camp.y);
    }
  }
  step(dt, input = {}) {
    if (this.state !== 'playing' || !finite(dt, 0, 0.1) || dt === 0) return;
    // Substep caller mistakes too, so frame stalls cannot tunnel through footing.
    if (dt > 1 / 60 + 0.00001) { const count = Math.ceil(dt / (1 / 120)); for (let i = 0; i < count; i++) this.step(dt / count, input); return; }
    this.time += dt;
    const p = this.player;
    for (const key of ['attackTimer', 'attackCooldown', 'dodgeTimer', 'dodgeCooldown', 'invuln']) p[key] = Math.max(0, p[key] - dt);
    if (p.dodgeTimer <= 0) p.stamina = Math.min(p.maxStamina, p.stamina + 23 * dt);
    this._movePlayer(dt, input);
    if (this.state !== 'playing') { this._previous = { ...input }; return; }
    if (input.attack && p.attackCooldown <= 0 && p.dodgeTimer <= 0) this._strike();
    this._moveEnemies(dt);
    if (this.state !== 'playing') { this._previous = { ...input }; return; }
    this._collectItems(); this._checkCamp();
    if (p.x >= this.level.goalX && p.onGround) {
      const beast = this.level.enemies.find(e => e.boss);
      if (beast?.alive) {
        p.x = this.level.goalX - 2; p.vx = 0;
        this.message = 'The way home opens only when the Great Beast falls.';
      } else {
        this.state = this.levelIndex === LEVELS.length - 1 ? 'complete' : 'stageclear';
        this.message = this.state === 'complete' ? 'The Great Beast has fallen. You carry the story home.' : 'The path continues. Your health and club travel with you.';
        this._event(this.state, this.message);
      }
    }
    this._previous = { ...input };
  }
  _capture(state = this.state) {
    return { state: state === 'paused' ? 'playing' : state, levelIndex: this.levelIndex, time: this.time, deaths: this.deaths,
      kills: this.kills, relics: this.relics, checkpointLabel: this.checkpointLabel, message: this.message,
      player: clone(this.player), enemies: clone(this.level.enemies), items: clone(this.level.items), checkpoints: clone(this.level.checkpoints) };
  }
  snapshot() {
    const transition = this.state === 'stageclear' || this.state === 'complete';
    const data = transition ? this._capture() : clone(this._checkpoint || this._capture('playing'));
    // Survival progress rolls back to camp; the journey clock and deaths never do.
    data.time = this.time; data.deaths = this.deaths;
    return { version: SAVE_VERSION, game: 'cave-run-modern', data };
  }
  restore(snapshot) {
    try {
      const data = this._validate(snapshot);
      if (!data) return false;
      this._apply(data); this._checkpoint = clone(data); this._previous = {}; this.events = [];
      if (this.state === 'playing') this.player.invuln = Math.max(this.player.invuln, 1.1);
      this.message = ['stageclear', 'complete'].includes(this.state) ? data.message : `Resumed at ${this.checkpointLabel}.`;
      return true;
    } catch { return false; }
  }
  _validate(snapshot) {
    if (!snapshot || snapshot.version !== SAVE_VERSION || snapshot.game !== 'cave-run-modern') return null;
    const data = snapshot.data;
    if (!data || !Number.isInteger(data.levelIndex) || data.levelIndex < 0 || data.levelIndex >= LEVELS.length) return null;
    if (!['playing', 'stageclear', 'complete'].includes(data.state)) return null;
    if (!finite(data.time, 0, 864000) || !Number.isInteger(data.deaths) || !finite(data.deaths, 0, 100000) || !Number.isInteger(data.kills) || !finite(data.kills, 0, 1000) || !Number.isInteger(data.relics) || !finite(data.relics, 0, 10)) return null;
    if (typeof data.message !== 'string' || data.message.length > 300 || typeof data.checkpointLabel !== 'string' || data.checkpointLabel.length > 30) return null;
    const level = buildLevel(data.levelIndex), p = data.player;
    if (!p || p.w !== PLAYER_W || p.h !== PLAYER_H || p.maxHp !== MAX_HP || p.clubMax !== CLUB_MAX || p.maxStamina !== 100) return null;
    for (const [key, range] of Object.entries({ x: [0, level.width - PLAYER_W], y: [-50, GROUND - PLAYER_H], vx: [-132, 132], vy: [-182, 255], hp: [1, MAX_HP], club: [0, CLUB_MAX], stamina: [0, 100], attackTimer: [0, 0.24], attackCooldown: [0, 0.37], dodgeTimer: [0, 0.3], dodgeCooldown: [0, 0.64], invuln: [0, 1.1], coyote: [0, 0.11], jumpBuffer: [0, 0.13], attackSerial: [0, 1000000] })) if (!finite(p[key], ...range)) return null;
    if (!Number.isInteger(p.hp) || !Number.isInteger(p.club) || !Number.isInteger(p.attackSerial) || ![-1, 1].includes(p.facing) || typeof p.onGround !== 'boolean' || typeof p.jumpHeld !== 'boolean') return null;
    if (!Array.isArray(data.enemies) || data.enemies.length !== level.enemies.length || !Array.isArray(data.items) || data.items.length !== level.items.length || !Array.isArray(data.checkpoints) || data.checkpoints.length !== level.checkpoints.length) return null;
    for (let i = 0; i < level.enemies.length; i++) {
      const original = level.enemies[i], saved = data.enemies[i];
      if (!saved || ['id', 'type', 'w', 'h', 'maxHp', 'boss', 'homeX', 'homeY', 'minX', 'maxX'].some(key => original[key] !== saved[key])) return null;
      if (!finite(saved.x, 0, level.width - saved.w) || !finite(saved.y, -30, GROUND) || !Number.isInteger(saved.hp) || !finite(saved.hp, 0, original.maxHp) || saved.alive !== (saved.hp > 0) || !PHASES.includes(saved.phase) || ![-1, 1].includes(saved.dir) || ![-1, 1].includes(saved.lungeDir)) return null;
      for (const [key, range] of Object.entries({ vx: [-120, 120], vy: [-200, 200], phaseTimer: [-0.02, 1.1], tell: [0, 0.8], flash: [0, 0.18], attackCooldown: [0, 0.4], t: [0, 864100] })) if (!finite(saved[key], ...range)) return null;
    }
    for (let i = 0; i < level.items.length; i++) {
      const original = level.items[i], saved = data.items[i];
      if (!saved || ['id', 'type', 'x', 'y', 'w', 'h'].some(key => original[key] !== saved[key]) || typeof saved.alive !== 'boolean') return null;
    }
    let active = 0;
    for (let i = 0; i < level.checkpoints.length; i++) {
      const original = level.checkpoints[i], saved = data.checkpoints[i];
      if (!saved || ['id', 'x', 'y', 'label'].some(key => original[key] !== saved[key]) || typeof saved.active !== 'boolean' || typeof saved.reached !== 'boolean' || (saved.active && !saved.reached)) return null;
      if (saved.active) { active++; if (saved.label !== data.checkpointLabel) return null; }
    }
    if (active !== 1 || !data.checkpoints[0].reached) return null;
    if (data.relics > data.levelIndex + 1 || (data.items.some(item => item.type === 'relic' && !item.alive) && data.relics < 1)) return null;
    const defeatedHere = data.enemies.filter(enemy => !enemy.alive).length;
    const enemiesAvailable = Array.from({ length: data.levelIndex + 1 }, (_, i) => buildLevel(i).enemies.length).reduce((sum, n) => sum + n, 0);
    if (data.kills < defeatedHere || data.kills > enemiesAvailable) return null;
    if (!p.onGround) return null;
    if (data.state === 'playing') {
      const camp = data.checkpoints.find(checkpoint => checkpoint.active);
      if (Math.abs(p.x - camp.x) > 18.1 || Math.abs(p.y + p.h - GROUND) > 0.01) return null;
    }
    const beast = data.enemies.find(e => e.boss);
    if (data.state === 'complete' && (data.levelIndex !== 9 || !beast || beast.alive || p.x < level.goalX)) return null;
    if (data.state === 'stageclear' && (data.levelIndex >= 9 || p.x < level.goalX)) return null;
    // Serialized worlds are copied only after every field is accepted.
    return clone(data);
  }
  _apply(data) {
    this.levelIndex = data.levelIndex; this.level = buildLevel(data.levelIndex);
    Object.assign(this.level, { enemies: clone(data.enemies), items: clone(data.items), checkpoints: clone(data.checkpoints) });
    this.player = clone(data.player); this.state = data.state;
    for (const key of ['time', 'deaths', 'kills', 'relics', 'checkpointLabel', 'message']) this[key] = data[key];
    this._bossAnnounced = false;
  }
}
