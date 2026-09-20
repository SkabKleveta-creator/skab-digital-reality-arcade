// Fixed, authored-route hazards. Geometry and existing world IDs remain untouched.
const TILE = 16;
const GROUND = 96;
const WARNING = 1.05;
const COOLDOWN = 3.6;
const ACTIVE = Object.freeze({ rockfall: 0.25, steam: 0.55 });
const PHASES = ['idle', 'warning', 'active', 'cooldown'];
const SHAPE_KEYS = ['id', 'type', 'x', 'y', 'w', 'h'];
const ALL_KEYS = [...SHAPE_KEYS, 'phase', 'timer'];
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const distanceToRange = (x, lo, hi) => x < lo ? lo - x : x > hi ? x - hi : 0;

/** Select at most two readable hazard sites without altering the authored path. */
export function buildHazards(level, index) {
  const type = [2, 6, 8].includes(index) ? 'rockfall' : index === 5 ? 'steam' : null;
  if (!type) return [];
  const w = type === 'rockfall' ? 14 : 18;
  const h = type === 'rockfall' ? GROUND - 30 : 24;
  const candidates = [];
  for (let col = 6; col < level.cols.length - 6; col++) {
    const center = col * TILE + TILE / 2;
    const x = center - w / 2;
    // Keep both edges of the danger zone over 48 units from a pit edge.
    const lo = Math.floor((x - 49) / TILE), hi = Math.floor((x + w + 49) / TILE);
    if (lo < 0 || hi >= level.cols.length) continue;
    if (!level.cols.slice(lo, hi + 1).every(column => column[6])) continue;
    if (center >= level.goalX - 120 || (level.arenaStart !== null && level.arenaStart !== undefined && center >= level.arenaStart - 96)) continue;
    if (level.checkpoints.some(camp => distanceToRange(camp.x, x, x + w) <= 70)) continue;
    if (level.items.some(item => distanceToRange(item.x + item.w / 2, x, x + w) < 26)) continue;
    // A ground predator must not start its attack inside the warning zone.
    if (level.enemies.some(enemy => !['bat', 'pterodactyl'].includes(enemy.type) && distanceToRange(enemy.homeX + enemy.w / 2, x, x + w) < 30)) continue;
    if (type === 'rockfall' && !level.segments.some(segment => segment.type === 'cave' && x > segment.x + TILE && x + w < segment.x + segment.width - TILE)) continue;
    candidates.push({ x, center });
  }
  const selected = [];
  for (const target of [level.width * 0.25, level.width * 0.63]) {
    const candidate = candidates
      .filter(site => selected.every(old => Math.abs(old.center - site.center) >= 192))
      .sort((a, b) => Math.abs(a.center - target) - Math.abs(b.center - target) || a.center - b.center)[0];
    if (candidate) selected.push(candidate);
  }
  return selected.sort((a, b) => a.x - b.x).map((site, n) => ({
    id: `h${index}-${n}`, type, x: site.x, y: GROUND - h, w, h, phase: 'idle', timer: 0
  }));
}

/** Advance only a running simulation. Damage uses the normal dodge/hurt grace. */
export function stepHazards(game, dt) {
  if (game.state !== 'playing' || !Number.isFinite(dt) || dt <= 0 || dt > 0.1) return;
  const p = game.player;
  for (const hazard of game.level.hazards || []) {
    if (game.state !== 'playing') break;
    const center = hazard.x + hazard.w / 2;
    const distance = Math.abs(p.x + p.w / 2 - center);
    if (hazard.phase === 'idle') {
      if (distance <= 96) {
        hazard.phase = 'warning'; hazard.timer = WARNING;
        game._event('hazardwarning', hazard.type === 'rockfall' ? 'Loose stone — clear the marked ground.' : 'Rising steam — jump or wait for the vent.', center, GROUND);
      }
      continue;
    }
    if (hazard.phase === 'warning' && distance > 132) {
      // Retreating never leaves an unseen attack waiting at the screen edge.
      hazard.phase = 'cooldown'; hazard.timer = COOLDOWN;
      continue;
    }
    if (hazard.phase === 'active' && overlap(p, hazard)) game._damage(1);
    hazard.timer = Math.max(0, hazard.timer - dt);
    if (hazard.timer > 0) continue;
    if (hazard.phase === 'warning') {
      hazard.phase = 'active'; hazard.timer = ACTIVE[hazard.type];
      game._event('hazardactive', '', center, GROUND);
    } else if (hazard.phase === 'active') {
      hazard.phase = 'cooldown'; hazard.timer = COOLDOWN;
    } else {
      hazard.phase = 'idle'; hazard.timer = 0;
    }
  }
}

/** Saves may retain timing, never introduce, reorder, move or reshape hazards. */
export function validateHazards(saved, baseline) {
  if (!Array.isArray(saved) || !Array.isArray(baseline) || saved.length !== baseline.length) return false;
  return saved.every((hazard, index) => {
    const original = baseline[index];
    if (!hazard || typeof hazard !== 'object' || Object.keys(hazard).length !== ALL_KEYS.length || ALL_KEYS.some(key => !Object.hasOwn(hazard, key))) return false;
    if (SHAPE_KEYS.some(key => hazard[key] !== original[key]) || !PHASES.includes(hazard.phase)) return false;
    const max = hazard.phase === 'idle' ? 0 : hazard.phase === 'warning' ? WARNING : hazard.phase === 'active' ? ACTIVE[hazard.type] : COOLDOWN;
    return Number.isFinite(hazard.timer) && hazard.timer >= 0 && hazard.timer <= max;
  });
}
