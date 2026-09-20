import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, buildLevel, GROUND } from '../js/core.mjs';
import { buildHazards, stepHazards, validateHazards } from '../js/hazards.mjs';

const DT = 1 / 120;
const clone = value => structuredClone(value);
function fixture(index = 2) {
  const level = buildLevel(index);
  level.hazards = buildHazards(level, index);
  const hazard = level.hazards[0];
  return {
    state: 'playing', level,
    player: { x: hazard.x, y: GROUND - 22, w: 12, h: 22, hp: 12, invuln: 0, dodgeTimer: 0 },
    events: [],
    _event(type, text, x, y) { this.events.push({ type, text, x, y }); },
    _damage(amount) { if (this.player.invuln <= 0 && this.player.dodgeTimer <= 0) { this.player.hp -= amount; this.player.invuln = 1.1; } }
  };
}
function tick(game, seconds) { for (let frame = 0; frame < Math.ceil(seconds / DT); frame++) stepHazards(game, DT); }

test('hazards use stable clear ground, respect camps and supplies, and never enter the boss arena', () => {
  const result = [];
  for (let index = 0; index < 10; index++) {
    const level = buildLevel(index), before = JSON.stringify(level);
    const hazards = buildHazards(level, index);
    assert.equal(JSON.stringify(level), before, 'placement does not mutate geometry, enemies or existing IDs');
    assert.deepEqual(hazards, buildHazards(level, index), 'placement is deterministic');
    assert.ok(hazards.length <= 2);
    if (![2, 5, 6, 8].includes(index)) assert.equal(hazards.length, 0);
    else assert.ok(hazards.length > 0, `hazards exist in ${level.name}`);
    for (const hazard of hazards) {
      assert.equal(hazard.phase, 'idle'); assert.equal(hazard.timer, 0);
      for (let x = hazard.x - 49; x <= hazard.x + hazard.w + 49; x++) assert.ok(level.cols[Math.floor(x / 16)]?.[6], 'at least 49 units of stable ground around zone');
      for (const camp of level.checkpoints) assert.ok(camp.x < hazard.x - 70 || camp.x > hazard.x + hazard.w + 70);
      for (const item of level.items) assert.ok(item.x + item.w / 2 <= hazard.x - 26 || item.x + item.w / 2 >= hazard.x + hazard.w + 26);
      if (level.arenaStart !== null) assert.ok(hazard.x + hazard.w < level.arenaStart);
      if (hazard.type === 'rockfall') assert.ok(level.segments.some(segment => segment.type === 'cave' && hazard.x > segment.x && hazard.x + hazard.w < segment.x + segment.width));
    }
    result.push(hazards.length);
  }
  assert.deepEqual(result, [0, 0, 2, 0, 0, 1, 2, 0, 2, 0]);
  const crowded = buildLevel(5);
  crowded.checkpoints = crowded.cols.map((column, index) => ({ x: index * 16 }));
  assert.deepEqual(buildHazards(crowded, 5), [], 'omit a hazard rather than place it in an unsafe location');
});

test('rockfall gives a full warning, damages only the marked active column, then cools down', () => {
  const game = fixture(), hazard = game.level.hazards[0];
  stepHazards(game, DT);
  assert.equal(hazard.phase, 'warning'); assert.equal(hazard.timer, 1.05);
  assert.equal(game.events[0].type, 'hazardwarning');
  tick(game, 0.95); assert.equal(game.player.hp, 12); assert.equal(hazard.phase, 'warning');
  tick(game, 0.13); assert.equal(hazard.phase, 'active'); assert.equal(game.player.hp, 11);
  tick(game, 0.3); assert.equal(hazard.phase, 'cooldown'); assert.equal(game.player.hp, 11);
  tick(game, 3); assert.equal(hazard.phase, 'cooldown');
  tick(game, 0.7); assert.equal(hazard.phase, 'warning'); assert.equal(game.player.hp, 11);
  assert.equal(game.events.filter(event => event.type === 'hazardactive').length, 1);
});

test('jumping clears steam and dodge grace protects a hunter inside either active zone', () => {
  const jumping = fixture(5), vent = jumping.level.hazards[0];
  assert.equal(vent.h, 24); assert.equal(vent.y, 72);
  jumping.player.y = vent.y - jumping.player.h;
  vent.phase = 'active'; vent.timer = 0.55;
  tick(jumping, 0.6); assert.equal(jumping.player.hp, 12, 'feet above steam cannot be hit');
  for (const index of [2, 5]) {
    const game = fixture(index), hazard = game.level.hazards[0];
    hazard.phase = 'active'; hazard.timer = 0.2; game.player.dodgeTimer = 0.3;
    tick(game, 0.25); assert.equal(game.player.hp, 12);
    hazard.phase = 'active'; hazard.timer = 0.2; game.player.dodgeTimer = 0; game.player.x = hazard.x + hazard.w;
    tick(game, 0.25); assert.equal(game.player.hp, 12, 'standing outside the warning column is safe');
  }
});

test('pause freezes hazard phases and retreat cancels the warning before offscreen damage', () => {
  const game = fixture(), hazard = game.level.hazards[0];
  stepHazards(game, DT); game.state = 'paused'; const before = clone(game.level.hazards);
  tick(game, 5); assert.deepEqual(game.level.hazards, before); assert.equal(game.player.hp, 12);
  game.state = 'playing'; game.player.x = hazard.x - 150;
  stepHazards(game, DT); assert.equal(hazard.phase, 'cooldown'); assert.equal(hazard.timer, 3.6);
  tick(game, 4); assert.equal(hazard.phase, 'idle');
  game.player.x = hazard.x; stepHazards(game, DT);
  assert.equal(hazard.phase, 'warning'); assert.equal(hazard.timer, 1.05, 'returning gets a fresh full warning');
  for (const invalid of [NaN, Infinity, -1, 0, 1]) { const saved = clone(game.level.hazards); stepHazards(game, invalid); assert.deepEqual(game.level.hazards, saved); }
});

test('hazard saves accept finite phase timing and reject fake, reordered or reshaped worlds', () => {
  const baseline = buildHazards(buildLevel(2), 2);
  assert.equal(validateHazards(baseline, baseline), true);
  const running = clone(baseline); running[0].phase = 'warning'; running[0].timer = 0.4;
  assert.equal(validateHazards(running, baseline), true);
  for (const mutate of [
    hazards => hazards.pop(), hazards => hazards.reverse(), hazards => { hazards[0].id = 'fake'; },
    hazards => { hazards[0].type = 'steam'; }, hazards => { hazards[0].x++; }, hazards => { hazards[0].y++; },
    hazards => { hazards[0].w++; }, hazards => { hazards[0].h++; }, hazards => { hazards[0].timer = NaN; },
    hazards => { hazards[0].timer = Infinity; }, hazards => { hazards[0].timer = -1; }, hazards => { hazards[0].timer = 1; },
    hazards => { hazards[0].phase = 'active'; hazards[0].timer = 0.6; },
    hazards => { hazards[0].phase = 'warning'; hazards[0].timer = 1.06; },
    hazards => { hazards[0].phase = 'cooldown'; hazards[0].timer = 3.61; },
    hazards => { hazards[0].phase = 'hidden'; }, hazards => { hazards[0].damage = 100; }
  ]) { const invalid = clone(baseline); mutate(invalid); assert.equal(validateHazards(invalid, baseline), false); }
  assert.equal(validateHazards(undefined, baseline), false);
  assert.equal(validateHazards([], []), true);
});

function isolatedZone(index, offset) {
  const game = new Game(); game.newRun(); game.levelIndex = index; game._loadLevel();
  // Isolate the obstacle from enemies. Crossing and avoidance use normal inputs.
  for (const enemy of game.level.enemies) { enemy.alive = false; enemy.hp = 0; }
  const hazard = game.level.hazards[0];
  Object.assign(game.player, { x: hazard.x - offset, y: GROUND - game.player.h, onGround: true });
  return game;
}

test('normal movement can wait out and safely cross both hazard types without changing resources', () => {
  for (const index of [2, 5]) {
    const game = isolatedZone(index, 40), hazard = game.level.hazards[0];
    for (let frame = 0; frame < 500 && hazard.phase !== 'cooldown'; frame++) game.step(DT);
    assert.equal(hazard.phase, 'cooldown');
    for (let frame = 0; frame < 150 && game.player.x < hazard.x + hazard.w + 20; frame++) game.step(DT, { right: true });
    assert.ok(game.player.x > hazard.x + hazard.w); assert.equal(game.player.hp, 12); assert.equal(game.player.club, 24);
  }
});

test('a held input jump clears an actively venting steam hazard in the real engine', () => {
  const game = isolatedZone(5, 20), hazard = game.level.hazards[0];
  game.step(DT);
  while (hazard.timer > 0.28 && hazard.phase === 'warning') game.step(DT);
  for (let frame = 0; frame < 80; frame++) game.step(DT, { right: true, jump: true });
  assert.equal(hazard.phase, 'active'); assert.ok(game.player.x > hazard.x + hazard.w);
  assert.equal(game.player.hp, 12); assert.equal(game.player.club, 24);
});
