import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game, GROUND } from '../js/core.mjs';
import { RELICS, CRAFTS } from '../js/progression.mjs';
const DT = 1 / 120;
const copy = value => JSON.parse(JSON.stringify(value));
const fixture = name => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url)));
function fresh(index = 0) { const game = new Game(); game.newRun(); if (index) { game.levelIndex = index; game._loadLevel(); } return game; }
function tick(game, seconds, input = {}) { for (let i = 0; i < Math.ceil(seconds / DT); i++) game.step(DT, input); }
function findRelic(game) { const relic = game.level.items.find(item => item.type === 'relic'); Object.assign(game.player, { x: relic.x, y: relic.y }); game._collectItems(); }
function camp(game) { const next = game.level.checkpoints.find(entry => !entry.reached); Object.assign(game.player, { x: next.x, y: GROUND - game.player.h, onGround: true }); game._checkCamp(); }

test('each route has a distinct original relic entry and craft unlocks are explicit', () => {
  assert.deepEqual(RELICS.map(entry => entry.stageIndex), Array.from({ length: 10 }, (_, i) => i));
  assert.equal(new Set(RELICS.map(entry => entry.name)).size, 10);
  assert.ok(RELICS.every(entry => entry.detail && entry.hint));
  assert.deepEqual(CRAFTS.map(({ id, unlock }) => [id, unlock]), [['none', 0], ['forager', 1], ['wind', 3], ['edge', 6]]);
});

test('new relics are carried until camp; changing craft cannot bank finds or resource changes', () => {
  const game = fresh(); findRelic(game);
  assert.deepEqual(game.relicLog, [0]); assert.equal(game.relics, 1); assert.equal(game.securedRelics, 0);
  assert.equal(game.selectCraft('forager'), false, 'selection requires the menu or stage boundary');
  game.pause(); assert.equal(game.selectCraft('forager'), false, 'unsecured relic cannot unlock a craft');
  assert.equal(game.selectCraft('none'), true);
  game.retry(); assert.equal(game.relics, 0); assert.deepEqual(game.relicLog, []);
  findRelic(game); camp(game); assert.equal(game.securedRelics, 1);
  const banked = game.snapshot(); Object.assign(game.player, { hp: 2, club: 3, stamina: 22 }); game.pause();
  assert.equal(game.selectCraft('forager'), true); assert.equal(game.selectCraft('wind'), false); assert.equal(game.selectCraft('invented'), false);
  assert.equal(game.player.hp, 2, 'craft selection does not heal or rewind the live hunter');
  const chosen = game.snapshot(); assert.equal(chosen.data.craft, 'forager');
  assert.deepEqual(chosen.data.player, banked.data.player, 'selection changes only the checkpoint craft');
  const restored = new Game(); assert.equal(restored.restore(chosen), true); assert.equal(restored.craft, 'forager');
  game.retry(); assert.equal(game.craft, 'forager'); assert.equal(game.relics, 1); assert.deepEqual(game.relicLog, [0]);
  game.state = 'stageclear'; const hp = game.player.hp, club = game.player.club;
  assert.equal(game.nextLevel(), true); assert.equal(game.craft, 'forager'); assert.deepEqual(game.relicLog, [0]);
  assert.equal(game.player.hp, hp); assert.equal(game.player.club, club);
});

test('Forager, Long Breath and Stone Edge change only their documented mechanics', () => {
  for (const craft of ['none', 'forager']) {
    const game = fresh(); game.craft = craft; game.player.hp = 2;
    const meat = game.level.items.find(item => item.type === 'meat'); Object.assign(game.player, { x: meat.x, y: meat.y });
    game._collectItems(); assert.equal(game.player.hp, craft === 'forager' ? 8 : 6);
  }
  for (const craft of ['none', 'wind']) {
    const game = fresh(); game.craft = craft; game.player.stamina = 0; tick(game, 1);
    assert.ok(Math.abs(game.player.stamina - (craft === 'wind' ? 32 : 23)) < 0.001);
  }
  for (const craft of ['none', 'edge']) {
    const game = fresh(); game.craft = craft;
    const enemy = game.level.enemies[0]; Object.assign(enemy, { x: game.player.x + game.player.w + 24, y: GROUND - enemy.h });
    game._strike(); assert.equal(enemy.hp, craft === 'edge' ? 0 : 3); assert.equal(game.player.club, craft === 'edge' ? 23 : 24);
    const unarmed = fresh(); unarmed.craft = craft; unarmed.player.club = 0;
    Object.assign(unarmed.level.enemies[0], { x: unarmed.player.x + unarmed.player.w + 18, y: GROUND - unarmed.level.enemies[0].h });
    unarmed._strike(); assert.equal(unarmed.level.enemies[0].hp, 3, 'Stone Edge does not extend fists');
  }
});

test('real version-two saves migrate without inventing the identities of earlier finds', () => {
  for (const name of ['legacy-v2-new', 'legacy-v2-camp']) {
    const old = fixture(name), game = new Game(); assert.equal(game.restore(old), true);
    const foundHere = old.data.items.some(item => item.type === 'relic' && !item.alive);
    assert.deepEqual(game.relicLog, foundHere ? [old.data.levelIndex] : []);
    assert.equal(game.unidentifiedRelics, old.data.relics - Number(foundHere));
    assert.equal(game.relics, old.data.relics); assert.equal(game.craft, 'none');
    assert.deepEqual(game.level.items, old.data.items); assert.deepEqual(game.level.checkpoints, old.data.checkpoints);
    assert.equal(game.player.hp, old.data.player.hp); assert.equal(game.player.club, old.data.player.club);
    assert.ok(game.level.hazards.every(hazard => hazard.phase === 'idle' && hazard.timer === 0));
    assert.equal(game.snapshot().version, 3); assert.equal(new Game().restore(game.snapshot()), true);
  }
  const pastOnly = fixture('legacy-v2-camp'); pastOnly.data.items.find(item => item.type === 'relic').alive = true; pastOnly.data.relics = 3;
  const migrated = new Game(); assert.equal(migrated.restore(pastOnly), true);
  assert.deepEqual(migrated.relicLog, []); assert.equal(migrated.unidentifiedRelics, 3);
  migrated.pause(); assert.equal(migrated.selectCraft('wind'), true, 'unknown old finds still count toward unlocks');
});

test('legacy corruption and inconsistent version-three relic journals reject atomically', () => {
  const game = fresh(), before = JSON.stringify(game._capture());
  const corruptions = [
    save => { save.data.enemies[0].tell = 0.9; },
    save => { save.data.enemies[0].phase = 'slam'; },
    save => { save.data.items[0].x++; },
    save => { save.data.player.hp = 100; },
    save => { save.data.checkpoints[0].active = false; }
  ];
  for (const mutate of corruptions) { const old = fixture('legacy-v2-new'); mutate(old); assert.equal(game.restore(old), false); assert.equal(JSON.stringify(game._capture()), before); }
  const banked = new Game(); assert.equal(banked.restore(fixture('legacy-v2-camp')), true); const valid = banked.snapshot();
  const journalCorruptions = [
    save => { save.data.relicLog = [4, 4]; save.data.unidentifiedRelics = 2; },
    save => { save.data.relicLog = [9]; },
    save => { save.data.relicLog = []; },
    save => { save.data.unidentifiedRelics = -1; },
    save => { save.data.craft = 'edge'; },
    save => { save.data.craft = 'imaginary'; },
    save => { save.data.relics++; }
  ];
  for (const mutate of journalCorruptions) { const invalid = copy(valid); mutate(invalid); assert.equal(game.restore(invalid), false); assert.equal(JSON.stringify(game._capture()), before); }
});

function arena() {
  const game = fresh(9), beast = game.level.enemies.find(enemy => enemy.boss);
  for (const enemy of game.level.enemies) if (!enemy.boss) { enemy.hp = 0; enemy.alive = false; }
  Object.assign(game.player, { x: beast.x - 20, y: GROUND - game.player.h, onGround: true });
  return { game, beast };
}

test('Great Beast alternates charge and a full one-second slam warning', () => {
  const { game, beast } = arena(); beast.attackCooldown = 0;
  game.step(DT); assert.equal(beast.move, 'charge'); assert.equal(beast.attackCount, 1);
  Object.assign(beast, { phase: 'idle', attackCooldown: 0 }); game.step(DT);
  assert.equal(beast.move, 'slam'); assert.equal(beast.attackCount, 2); assert.equal(beast.phaseTimer, 1);
  assert.ok(game.drainEvents().some(event => event.type === 'slam-warning'));
  tick(game, 0.9); assert.equal(beast.phase, 'windup'); assert.equal(game.player.hp, 12);
  tick(game, 0.12); assert.equal(beast.phase, 'slam'); assert.equal(game.player.hp, 9);
  assert.ok(game.drainEvents().some(event => event.type === 'slam'));
  tick(game, 0.26); assert.equal(beast.phase, 'recovery');
});

test('ground shock strikes a grounded dodge but a normal timed jump clears it', () => {
  for (const action of ['grounded', 'dodge', 'jump']) {
    const { game, beast } = arena(); Object.assign(beast, { phase: 'windup', move: 'slam', attackCount: 2, phaseTimer: 0.23, tell: 0.23 });
    tick(game, 0.51, action === 'jump' ? { jump: true } : action === 'dodge' ? { dodge: true } : {});
    assert.equal(game.player.hp, action === 'jump' ? 12 : 9, action);
  }
});

test('slam warning and move progression pause and survive a camp save exactly', () => {
  const game = fresh(9), campPoint = game.level.checkpoints.at(-1), beast = game.level.enemies.find(enemy => enemy.boss);
  Object.assign(game.player, { x: campPoint.x, y: GROUND - game.player.h });
  Object.assign(beast, { phase: 'windup', move: 'slam', attackCount: 4, phaseTimer: 0.7, tell: 0.7 });
  game._checkCamp(); game.pause(); const before = JSON.stringify(game._capture()); tick(game, 2, { jump: true });
  assert.equal(JSON.stringify(game._capture()), before);
  const restored = new Game(); assert.equal(restored.restore(game.snapshot()), true);
  const loaded = restored.level.enemies.find(enemy => enemy.boss);
  assert.deepEqual(loaded, beast); game.retry(); assert.deepEqual(game.level.enemies.find(enemy => enemy.boss), beast);
  for (const mutate of [enemy => { enemy.attackCount = 3; }, enemy => { enemy.phase = 'slam'; enemy.phaseTimer = 0.7; }, enemy => { enemy.phase = 'lunge'; }]) {
    const forged = game.snapshot(); mutate(forged.data.enemies.find(enemy => enemy.boss));
    assert.equal(new Game().restore(forged), false, 'impossible boss sequences are rejected');
  }
});

test('hazard phases survive camp retry and version-three import without reshaping the world', () => {
  const game = fresh(2), hazard = game.level.hazards[0];
  Object.assign(hazard, { phase: 'warning', timer: 0.71 }); camp(game);
  const saved = game.snapshot(); hazard.phase = 'cooldown'; hazard.timer = 1.2;
  game._die('test'); game.retry(); assert.deepEqual(game.level.hazards, saved.data.hazards);
  const resumed = new Game(); assert.equal(resumed.restore(saved), true); assert.deepEqual(resumed.level.hazards, saved.data.hazards);
  for (const mutate of [save => { save.data.hazards = []; }, save => { save.data.hazards[0].x++; }, save => { save.data.hazards[0].timer = Infinity; }]) {
    const forged = copy(saved); mutate(forged); assert.equal(resumed.restore(forged), false); assert.deepEqual(resumed.level.hazards, saved.data.hazards);
  }
});
