import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, LEVELS, TILE, GROUND, buildLevel, SAVE_VERSION } from '../js/core.mjs';
const DT = 1 / 120;
const copy = value => JSON.parse(JSON.stringify(value));
function fresh(index = 0) { const game = new Game(); game.newRun(); if (index) { game.levelIndex = index; game._loadLevel(); } return game; }
function tick(game, seconds, input = {}) { for (let i = 0; i < Math.ceil(seconds / DT); i++) game.step(DT, input); }
function bossInput(game) {
  const p = game.player, beast = game.level.enemies.find(e => e.boss && e.alive);
  if (!beast) return { right: true, attack: true };
  const dx = beast.x + beast.w / 2 - (p.x + p.w / 2), dir = Math.sign(dx) || 1;
  const inRange = Math.abs(dx) < (p.club ? 38 : 35);
  let right = dir > 0 && (!inRange || p.facing !== dir), left = dir < 0 && (!inRange || p.facing !== dir), dodge = false;
  if (beast.phase === 'windup' && beast.tell < 0.045 && Math.abs(dx) < 80 && p.dodgeCooldown <= 0) { right = dir > 0; left = dir < 0; dodge = true; }
  return { right, left, dodge, attack: true };
}

test('ten authored routes retain names, varied terrain, safe footing and one unique final boss', () => {
  assert.deepEqual(LEVELS.map(level => level.name), ['THE FIRST LIGHT', 'THE COLD CLIMB', 'DEEP DARK', 'THE HIGH HUNT', 'TWO TEETH', 'RIVER OF STONE', 'LONG NIGHT', 'SKY TEETH', 'THE NARROWS', 'GREAT BEAST']);
  for (let index = 0; index < 10; index++) {
    const level = buildLevel(index);
    assert.ok(level.checkpoints.length >= 2, `route ${index + 1} has recovery camps`);
    let previousEnd = -99;
    for (let col = 0; col < level.cols.length; col++) {
      if (level.cols[col][6]) continue;
      let end = col; while (end + 1 < level.cols.length && !level.cols[end + 1][6]) end++;
      assert.ok(end - col + 1 <= 2, 'no unjumpable long pit');
      assert.ok(col - previousEnd - 1 >= 3, 'at least three landing columns between pits');
      previousEnd = end; col = end;
    }
    assert.equal(level.enemies.filter(enemy => enemy.boss).length, index === 9 ? 1 : 0);
    assert.ok(level.enemies.filter(enemy => enemy.type === 'tiger').every(enemy => !enemy.boss));
  }
  assert.ok(buildLevel(1).cols.some(col => col[3] === 3));
  assert.ok(buildLevel(3).cols.some(col => col[3] === 3));
});

test('paused simulation is immutable and resume continues without accumulated time', () => {
  const game = fresh(); tick(game, 0.5, { right: true }); game.pause();
  const before = JSON.stringify(game._capture());
  tick(game, 4, { right: true, jump: true, attack: true, dodge: true });
  assert.equal(JSON.stringify(game._capture()), before);
  assert.equal(game.resume(), true); tick(game, 0.1, { right: true });
  assert.ok(game.player.x > JSON.parse(before).player.x);
  assert.ok(game.time < 0.61);
});

test('held attack repeats with fixed damage; empty swings do not consume a club', () => {
  const game = fresh(); const p = game.player, enemy = game.level.enemies[0];
  tick(game, 1, { attack: true }); assert.equal(p.club, p.clubMax);
  enemy.x = p.x + p.w + 5; enemy.y = GROUND - enemy.h; enemy.hp = 3; enemy.phase = 'recovery'; enemy.phaseTimer = 1;
  tick(game, 0.4, { attack: true });
  assert.equal(enemy.hp, 0); assert.equal(p.club, p.clubMax - 1); assert.equal(game.kills, 1);
});

test('descending feet stomp small creatures once; side contact does not', () => {
  const game = fresh(); const enemy = game.level.enemies[0], p = game.player;
  enemy.x = 120; enemy.phase = 'recovery'; enemy.phaseTimer = 0.5;
  p.x = 120; p.y = enemy.y - p.h - 1; p.vy = 45; p.onGround = false;
  tick(game, 0.05);
  assert.equal(enemy.alive, false); assert.equal(game.kills, 1); assert.ok(p.vy < 0); assert.equal(p.club, 24);
  tick(game, 0.1); assert.equal(game.kills, 1);
  const sideGame = fresh(), side = sideGame.level.enemies[0];
  side.x = sideGame.player.x + 5; side.phase = 'recovery'; side.phaseTimer = 0.5;
  tick(sideGame, 0.02); assert.equal(side.hp, 3); assert.equal(sideGame.kills, 0);
  const tigerGame = fresh(4), tiger = tigerGame.level.enemies.find(e => e.type === 'tiger');
  tiger.x = 120; tiger.phase = 'recovery'; tiger.phaseTimer = 0.5;
  Object.assign(tigerGame.player, { x: 120, y: tiger.y - PLAYER_HEIGHT - 1, vy: 45, onGround: false });
  tick(tigerGame, 0.05); assert.equal(tiger.hp, tiger.maxHp);
});
const PLAYER_HEIGHT = 22;

test('damage cannot knock the player sideways into a pit', () => {
  const game = fresh(); const p = game.player;
  p.x = 15 * TILE - p.w - 1; const x = p.x;
  game._damage(2); assert.equal(p.x, x); assert.equal(p.hp, 10);
  game._damage(2); assert.equal(p.hp, 10, 'hurt invulnerability prevents overlap damage every frame');
});

test('stage transitions carry exact health, club and stamina', () => {
  const game = fresh(); Object.assign(game.player, { hp: 5, club: 7, stamina: 31 });
  game.state = 'stageclear'; assert.equal(game.nextLevel(), true);
  assert.equal(game.levelIndex, 1); assert.equal(game.player.hp, 5); assert.equal(game.player.club, 7); assert.equal(game.player.stamina, 31);
  assert.equal(game.nextLevel(), false, 'cannot skip a stage during play');
});

test('checkpoint retry restores exact supplies, enemies and items without accumulating rewards', () => {
  const game = fresh(); const camp = game.level.checkpoints[1];
  Object.assign(game.player, { x: camp.x, y: GROUND - game.player.h, hp: 7, club: 11, stamina: 53 });
  const enemy = game.level.enemies[0]; enemy.hp = 0; enemy.alive = false; game.kills = 1;
  game.level.items[0].alive = false;
  game._checkCamp(); const saved = game.snapshot();
  const remaining = game.level.items.find(item => item.type === 'club' && item.alive);
  Object.assign(game.player, { x: remaining.x, y: remaining.y, hp: 2, club: 2 }); game._collectItems();
  assert.equal(game.player.club, 24);
  game._die('test'); game.time += 5; assert.equal(game.retry(), true);
  assert.equal(game.player.hp, 7); assert.equal(game.player.club, 11); assert.equal(game.player.stamina, 53);
  assert.deepEqual(game.level.enemies, saved.data.enemies); assert.deepEqual(game.level.items, saved.data.items);
  assert.equal(game.kills, 1); assert.equal(game.deaths, 1); assert.equal(game.time, saved.data.time + 5);
  game._die('test again'); game.retry(); assert.equal(game.player.club, 11); assert.equal(game.kills, 1); assert.equal(game.deaths, 2);
});

test('a one-HP camp saved inside a live lunge gets finite recovery protection on retry and restore', () => {
  const game = fresh(), camp = game.level.checkpoints[1], enemy = game.level.enemies[0];
  Object.assign(game.player, { x: camp.x, y: GROUND - game.player.h, hp: 1, club: 7, invuln: 0.5 });
  Object.assign(enemy, { x: camp.x + 3, y: GROUND - enemy.h, phase: 'lunge', phaseTimer: 0.3, lungeDir: -1 });
  game.step(DT);
  assert.equal(game.checkpointLabel, camp.label);
  const saved = game.snapshot();
  assert.equal(saved.data.player.invuln, 0, 'persistent camp records remain exact');
  assert.equal(saved.data.enemies[0].phase, 'lunge');
  game._die('reproduce the recovery trap');
  assert.equal(game.retry(), true);
  const restored = new Game(); assert.equal(restored.restore(saved), true);
  for (const recovered of [game, restored]) {
    assert.equal(recovered.player.hp, 1); assert.equal(recovered.player.club, 7);
    assert.equal(recovered.player.stamina, saved.data.player.stamina);
    assert.deepEqual(recovered.level.enemies, saved.data.enemies);
    assert.deepEqual(recovered.level.items, saved.data.items);
    assert.equal(recovered.player.invuln, 1.1);
    recovered.step(DT);
    assert.equal(recovered.state, 'playing', 'the saved overlap is survivable before the first response');
    assert.equal(recovered.player.hp, 1);
    tick(recovered, 1.11);
    assert.equal(recovered.player.invuln, 0, 'protection expires instead of making the run invulnerable');
  }
});

test('versioned saves reject corrupt or impossible data atomically', () => {
  const game = fresh(); const valid = game.snapshot();
  assert.equal(valid.version, SAVE_VERSION); assert.equal(new Game().restore(valid), true);
  const corruptions = [
    save => { save.version = 1; }, save => { save.data.levelIndex = 99; }, save => { save.data.player.hp = 0; },
    save => { save.data.player.hp = 99; }, save => { save.data.player.x = 900; }, save => { save.data.player.stamina = null; },
    save => { save.data.player.w = 500; }, save => { save.data.enemies.pop(); }, save => { save.data.enemies[0].hp = -1; },
    save => { save.data.enemies[0].alive = false; }, save => { save.data.items[0].x += 50; },
    save => { save.data.checkpoints[0].active = false; }, save => { save.data.checkpointLabel = 'Unknown camp'; },
    save => { save.data.relics = 10; }, save => { save.data.state = 'complete'; }, save => { save.data.time = Infinity; }
  ];
  const before = JSON.stringify(game._capture());
  for (const mutate of corruptions) { const invalid = copy(valid); mutate(invalid); assert.equal(game.restore(invalid), false); assert.equal(JSON.stringify(game._capture()), before); }
});

test('Great Beast must fall before final goal can complete the journey', () => {
  const game = fresh(9), beast = game.level.enemies.find(enemy => enemy.boss);
  game.player.x = game.level.goalX + 10; game.step(DT, { right: true });
  assert.equal(game.state, 'playing'); assert.ok(game.player.x < game.level.goalX); assert.equal(beast.alive, true);
  const forged = game.snapshot(); forged.data.state = 'complete'; forged.data.player.x = game.level.goalX;
  assert.equal(new Game().restore(forged), false);
  beast.hp = 0; beast.alive = false; game.kills = 1;
  game.player.x = game.level.goalX + 1; game.step(DT);
  assert.equal(game.state, 'complete'); assert.equal(new Game().restore(game.snapshot()), true);
});

test('optional elevated Cold Climb relic is reachable with two input jumps', () => {
  const game = fresh(1); let phase = 0;
  for (let frame = 0; frame < 700 && game.relics === 0; frame++) {
    const p = game.player; let jump = false;
    if (phase === 0 && p.x > 99) phase = 1;
    if (phase === 1) { jump = true; if (p.onGround && p.y + p.h === 64) phase = 2; }
    else if (phase === 2) phase = 3;
    else if (phase === 3) jump = true;
    game.step(DT, { right: phase < 3 || p.x < 201, left: phase >= 3 && p.x > 212, jump, attack: true });
  }
  assert.equal(game.relics, 1); assert.equal(game.state, 'playing'); assert.ok(game.player.y + game.player.h < 64);
});

test('empty club cannot softlock the final fight: fists and timed dodges defeat Great Beast', () => {
  const game = fresh(9), beast = game.level.enemies.find(enemy => enemy.boss);
  game.player.x = beast.x - 50; game.player.club = 0;
  // Isolate the final arena; the fight itself uses only normal inputs and normal HP.
  for (const enemy of game.level.enemies) if (!enemy.boss) { enemy.hp = 0; enemy.alive = false; }
  for (let frame = 0; frame < 10000 && beast.alive && game.state === 'playing'; frame++) game.step(DT, bossInput(game));
  assert.equal(beast.alive, false); assert.ok(game.player.hp > 0); assert.equal(game.player.club, 0);
});

test('entire ten-route campaign is traversable and beatable through normal inputs; every camp and transition roundtrips', () => {
  const game = fresh(); let wasGround = true, jump = false, transitions = 0, campSaves = 0;
  const results = [];
  for (let frame = 0; frame < 90000; frame++) {
    if (game.state === 'stageclear') {
      results.push({ stage: game.levelIndex + 1, hp: game.player.hp, club: game.player.club });
      const resumed = new Game(); assert.equal(resumed.restore(game.snapshot()), true, `stage ${game.levelIndex + 1} transition restore`);
      assert.equal(resumed.state, 'stageclear');
      const hp = game.player.hp, club = game.player.club;
      assert.equal(game.nextLevel(), true); assert.equal(game.player.hp, hp); assert.equal(game.player.club, club);
      transitions++; jump = false; wasGround = true;
    }
    if (game.state !== 'playing') break;
    const p = game.player;
    const landed = p.onGround && !wasGround;
    const gapAhead = !game.level.cols[Math.floor((p.x + p.w + 11) / TILE)]?.[6];
    if (landed) jump = false;
    else if (p.onGround && gapAhead) jump = true;
    else if (!p.onGround && p.vy >= 0) jump = false;
    wasGround = p.onGround;
    const beast = game.level.enemies.find(enemy => enemy.boss && enemy.alive);
    const input = beast && Math.abs(beast.x - p.x) < 150 ? bossInput(game) : { right: true, attack: true };
    // Brake over a safe ledge if a stomp bounce would carry a late landing into a pit.
    if (!beast && !p.onGround && p.vy > 0 && game.level.cols[Math.floor((p.x + p.w) / TILE)]?.[6] && gapAhead) input.right = false;
    game.step(DT, { ...input, jump });
    if (game.drainEvents().some(event => event.type === 'checkpoint')) {
      campSaves++; const saved = game.snapshot(), resumed = new Game();
      assert.equal(resumed.restore(saved), true, `stage ${game.levelIndex + 1} ${game.checkpointLabel} restore`);
      assert.equal(resumed.player.hp, saved.data.player.hp); assert.equal(resumed.player.club, saved.data.player.club);
      assert.deepEqual(resumed.level.items, saved.data.items);
    }
  }
  assert.equal(game.state, 'complete', `input-driven journey failed at stage ${game.levelIndex + 1}, x=${game.player.x.toFixed(1)}, HP=${game.player.hp}; ${JSON.stringify(results)}`);
  assert.equal(transitions, 9); assert.ok(campSaves >= 12); assert.equal(game.deaths, 0);
  assert.equal(game.level.enemies.find(enemy => enemy.boss).alive, false);
  assert.equal(new Game().restore(game.snapshot()), true);
});
