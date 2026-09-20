#!/usr/bin/env node
/**
 * Browser integration QA. Requires Playwright and a Chromium installation.
 *
 * node tests/browser.cjs [output-directory]
 * Optional: CAVE_CHROMIUM_EXECUTABLE=/path/to/chromium
 * Optional: CAVE_CHROMIUM_ARGS='["--no-sandbox", ...]'
 * Optional: CODEX_PRIMARY_RUNTIME_NODE_MODULES=/path/to/node_modules
 * Optional: CAVE_QA_FILTER='Rockfall|No runtime' for isolated scene refreshes
 *
 * Checks use real DOM controls and browser keyboard/touch dispatch. A debug
 * fixture relocates the hunter to a camp to test persisted progress without
 * conflating this UI suite with a full campaign playthrough. Viewport/touch
 * emulation is not physical phone or Safari testing.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const root = path.resolve(__dirname, '..');
const legacyCampPath = path.join(__dirname, 'fixtures', 'legacy-v2-camp.json');
const output = path.resolve(process.argv[2] || path.join(root, 'qa'));
const mime = { '.html':'text/html', '.css':'text/css', '.mjs':'application/javascript', '.js':'application/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png' };
const filter = process.env.CAVE_QA_FILTER ? new RegExp(process.env.CAVE_QA_FILTER) : null;
const report = { filter: process.env.CAVE_QA_FILTER || null, suite:'Cave Run browser integration', browser:'', environment:'Headless Chromium; viewport and touch emulation, not physical devices', checks:[], errors:[], consoleErrors:[], failedRequests:[], screenshots:[] };
let browser, server, page;
// Poll state on a timer, not RAF: software Chromium may starve Playwright's RAF waiter.
const waitFor = predicate => page.waitForFunction(predicate, null, {polling:100});
const state = () => page.evaluate(() => window.__CAVE__.game.state);
const check = async (name, fn) => {
  if(filter&&!filter.test(name))return;
  try { const detail = await fn(); report.checks.push({name,pass:true,...(detail ? {detail} : {})}); console.log(`PASS ${name}`); }
  catch (error) {
    let diagnostic;
    if(page)diagnostic=await page.evaluate(()=>({url:location.href,title:document.title,state:window.__CAVE__?.game.state,bodyChildren:document.body.children.length,menuCount:document.querySelectorAll('#menu').length,continueCount:document.querySelectorAll('#continue').length,continueHidden:document.querySelector('#continue')?.hidden,frameFrozen:window.__qaFreezeFrames,bodyText:document.body.innerText.slice(0,500)})).catch(()=>({unresponsive:true}));
    report.checks.push({name,pass:false,error:error.message,diagnostic}); console.error(`FAIL ${name}: ${error.message}`,diagnostic||'');
  }
};
const screenshot = async name => {
  // Freeze only the test frame pump while capturing. This avoids compositor
  // screenshot starvation on software-rendered headless machines.
  await page.evaluate(()=>{window.__qaFreezeFrames=true;});
  try {await page.waitForTimeout(80);await page.screenshot({path:path.join(output,name),fullPage:true,timeout:20000});report.screenshots.push(name);}
  finally {await page.evaluate(()=>{window.__qaFreezeFrames=false;});}
};
const continueAfterReload = async () => {
  // Test-only pause of painting avoids compositor starvation during input dispatch
  // in single-process software Chromium. The visible native button is still used.
  await page.bringToFront();await page.evaluate(()=>{window.__qaFreezeFrames=true;});
  try {
    await page.locator('#continue').focus();await page.keyboard.press('Enter');
    await waitFor(()=>__CAVE__.game.state==='playing');
  } finally {await page.evaluate(()=>{window.__qaFreezeFrames=false;});}
};
const menu = async (tab='journey') => {
  if (!await page.locator('#menu').evaluate(e=>e.open)) await page.locator('#pause').click();
  await page.locator(`[data-tab="${tab}"]`).click();
};
const resume = async () => {
  if (await page.locator('#menu').evaluate(e=>e.open)) await page.locator('#resume').click();
  await waitFor(()=>window.__CAVE__.game.state==='playing');
};
const digest = () => page.evaluate(() => {
  const {game}=window.__CAVE__, s=game.snapshot().data;
  return {levelIndex:s.levelIndex,checkpointLabel:s.checkpointLabel,hp:s.player.hp,club:s.player.club,x:s.player.x,kills:s.kills,relics:s.relics,relicLog:s.relicLog,unidentifiedRelics:s.unidentifiedRelics,craft:s.craft,items:s.items.map(i=>[i.id,i.alive]),enemies:s.enemies.map(e=>[e.id,e.hp,e.alive])};
});
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  assert.ok(fs.existsSync(path.join(root,'js','render.mjs')), 'Renderer is not present yet; rerun after build completes.');
  server = http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname==='/favicon.ico') {res.writeHead(204);res.end();return;}
    const requested=path.resolve(root,'.'+pathname), file=pathname.endsWith('/')?path.join(requested,'index.html'):requested;
    if (!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    fs.readFile(file,(error,content)=>{
      if(error){res.writeHead(404);res.end('Not found');return;}
      res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(content);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const launch={headless:true};
  if(process.env.CAVE_CHROMIUM_EXECUTABLE)launch.executablePath=process.env.CAVE_CHROMIUM_EXECUTABLE;
  if(process.env.CAVE_CHROMIUM_ARGS){launch.args=JSON.parse(process.env.CAVE_CHROMIUM_ARGS);assert.ok(Array.isArray(launch.args)&&launch.args.every(a=>typeof a==='string'),'CAVE_CHROMIUM_ARGS must be a JSON string array');}
  browser=await chromium.launch(launch);report.browser=browser.version();
  const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,reducedMotion:'reduce'});
  page=await context.newPage();page.setDefaultTimeout(7000);
  await page.addInitScript(()=>{
    const nativeRAF=window.requestAnimationFrame.bind(window);
    window.__qaFreezeFrames=false;window.__qaFrameCount=0;
    window.requestAnimationFrame=callback=>nativeRAF(function deliver(time){
      if(window.__qaFreezeFrames){nativeRAF(deliver);return;}
      window.__qaFrameCount++;callback(time);
    });
  });
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
  page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
  await page.goto(`http://127.0.0.1:${server.address().port}/?debug`,{waitUntil:'networkidle'});
  await waitFor(()=>window.__CAVE__);

  await check('Native guide button Enter and settings checkbox Space remain accessible',async()=>{
    await page.locator('#how').focus();await page.keyboard.press('Enter');
    assert.equal(await state(),'title');assert.equal(await page.locator('#panel-help').isVisible(),true);
    await menu('settings');
    const initial=await page.locator('#motion').isChecked();
    await page.locator('#motion').focus();await page.keyboard.press('Space');
    assert.equal(await page.locator('#motion').isChecked(),!initial);
    assert.equal(await page.evaluate(()=>__CAVE__.settings.motion),!initial);
    await page.keyboard.press('Space');assert.equal(await page.locator('#motion').isChecked(),initial);
    assert.deepEqual(await page.evaluate(()=>[...__CAVE__.input.keys]),[]);
    await page.locator('#resume').click();assert.equal(await state(),'title');
  });

  await check('Title renders and begins through UI',async()=>{
    assert.equal(await state(),'title');assert.equal(await page.locator('#begin').isVisible(),true);
    await screenshot('desktop-title.png');await page.locator('#begin').click();
    await waitFor(()=>window.__CAVE__.game.state==='playing');
    assert.equal(await page.locator('#hud').isVisible(),true);
    assert.equal(await page.locator('#front').isVisible(),false);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'scene');
    await screenshot('desktop-gameplay.png');
  });

  await check('Active renderer remains responsive',async()=>{
    const before=await page.evaluate(()=>({frames:window.__qaFrameCount,time:performance.now()}));
    await page.waitForTimeout(700);
    const after=await page.evaluate(()=>({frames:window.__qaFrameCount,time:performance.now()}));
    const fps=(after.frames-before.frames)*1000/(after.time-before.time);
    report.observedFPS=Number(fps.toFixed(1));assert.ok(fps>=15,`Measured ${fps.toFixed(1)} FPS in software-rendered Chromium`);
    console.log(`Observed active FPS: ${report.observedFPS}`);return {observedFPS:report.observedFPS};
  });

  await check('Alias keys retain movement until the final source releases',async()=>{
    await page.keyboard.down('d');await page.keyboard.down('ArrowRight');await page.waitForTimeout(90);
    await page.keyboard.up('d');
    const held=await page.evaluate(()=>({keys:[...__CAVE__.input.keys],x:__CAVE__.game.player.x}));
    assert.deepEqual(held.keys,['ArrowRight']);await page.waitForTimeout(100);
    assert.ok(await page.evaluate(()=>__CAVE__.game.player.x)>held.x,'Second movement key must keep moving');
    await page.keyboard.up('ArrowRight');await page.waitForTimeout(170);
    const released=await page.evaluate(()=>({keys:[...__CAVE__.input.keys],vx:__CAVE__.game.player.vx}));
    assert.deepEqual(released.keys,[]);assert.equal(released.vx,0);
  });

  await check('Pause freezes world and all four tabs support keyboard navigation',async()=>{
    await page.keyboard.press('Escape');await waitFor(()=>__CAVE__.game.state==='paused');
    const before=await page.evaluate(()=>({time:__CAVE__.game.time,x:__CAVE__.game.player.x}));
    await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>({time:__CAVE__.game.time,x:__CAVE__.game.player.x})),before);
    assert.equal(await page.locator('#route-list li').count(),10);
    await page.locator('[data-tab="journey"]').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-tab="journal"]').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#panel-journal').isVisible(),true);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-tab="help"]').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#panel-help').isVisible(),true);
    await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#panel-settings').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.tab),'settings');
    await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#panel-help').isVisible(),true);
    await page.keyboard.press('Escape');await waitFor(()=>__CAVE__.game.state==='playing');
  });

  await check('Sound and pause/resume clicks return keyboard movement to the game',async()=>{
    await page.locator('#sound').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'scene');
    let x=await page.evaluate(()=>__CAVE__.game.player.x);
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(100);await page.keyboard.up('ArrowRight');
    assert.ok(await page.evaluate(()=>__CAVE__.game.player.x)>x,'Movement after sound click');
    await page.locator('#pause').click();await page.locator('#resume').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'scene');
    x=await page.evaluate(()=>__CAVE__.game.player.x);
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(100);await page.keyboard.up('ArrowRight');
    assert.ok(await page.evaluate(()=>__CAVE__.game.player.x)>x,'Movement after pause/resume');
  });

  await check('Focus loss clears held inputs and leaves the world paused',async()=>{
    await page.keyboard.down('d');await page.waitForTimeout(40);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await page.keyboard.up('d');await waitFor(()=>__CAVE__.game.state==='paused');
    const before=await page.evaluate(()=>({time:__CAVE__.game.time,x:__CAVE__.game.player.x,keys:[...__CAVE__.input.keys],pointers:__CAVE__.input.pointers.size}));
    assert.deepEqual(before.keys,[]);assert.equal(before.pointers,0);await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>__CAVE__.game.time),before.time);assert.equal(await page.evaluate(()=>__CAVE__.game.player.x),before.x);
    await resume();
    return 'Explicit browser blur event exercises the real focus-loss handler.';
  });

  let expectedSave, exportedPath;
  await check('Checkpoint export/import round trip through the actual save controls',async()=>{
    await resume();
    const checkpoint=await page.evaluate(()=>{
      const {game}=__CAVE__, camp=game.level.checkpoints.find(c=>!c.reached);
      if(!camp)throw Error('No later camp fixture available');
      Object.assign(game.player,{x:camp.x,y:96-game.player.h,vx:0,vy:0,onGround:true});
      game.step(1/120,{});__CAVE__.sync();return {expected:camp.label,actual:game.checkpointLabel};
    });
    assert.equal(checkpoint.actual,checkpoint.expected);
    await menu('settings');expectedSave=await digest();
    const downloading=page.waitForEvent('download');await page.locator('#export').click();const download=await downloading;
    exportedPath=path.join(output,'exported-journey.json');await download.saveAs(exportedPath);
    const file=JSON.parse(fs.readFileSync(exportedPath,'utf8'));assert.equal(file.version,3);assert.equal(file.game,'cave-run-modern');assert.equal(file.data.checkpointLabel,checkpoint.expected);
    await page.locator('#restart').click();await page.locator('#confirm-new').click();await waitFor(()=>__CAVE__.game.state==='playing');
    assert.equal(await page.evaluate(()=>__CAVE__.game.checkpointLabel),'Trailhead');
    await menu('settings');await page.locator('#import').setInputFiles(exportedPath);
    await waitFor(()=>document.getElementById('import-status').textContent.includes('Journey imported'));
    assert.deepEqual(await digest(),expectedSave);assert.equal(await state(),'paused');
    return `Camp fixture: ${checkpoint.expected}; export, fresh hunt, and import all use the visible UI.`;
  });

  await check('Malformed import preserves current hunt and existing save',async()=>{
    await menu('settings');
    const before=await page.evaluate(()=>({snapshot:JSON.stringify(__CAVE__.game.snapshot()),stored:localStorage.getItem(__CAVE__.saveKey)}));
    await page.locator('#import').setInputFiles({name:'broken-journey.json',mimeType:'application/json',buffer:Buffer.from('{"version":2,"game":"cave-run-modern","data":{"levelIndex":999}}')});
    await waitFor(()=>document.getElementById('import-status').textContent.includes('not a valid'));
    assert.deepEqual(await page.evaluate(()=>({snapshot:JSON.stringify(__CAVE__.game.snapshot()),stored:localStorage.getItem(__CAVE__.saveKey)})),before);
  });

  await check('Reload restores saved camp and selected settings through Continue',async()=>{
    await menu('settings');await page.locator('#touch-setting').check();await page.locator('#motion').check();
    await page.reload({waitUntil:'networkidle'});await waitFor(()=>window.__CAVE__);
    assert.equal(await page.locator('#continue').isVisible(),true);
    // Use keyboard activation for Continue: software Chromium can starve a
    // post-reload mouse hit-test even while the page and save are healthy.
    await continueAfterReload();
    report.adapterNotes ||= [];
    report.adapterNotes.push('Reload/Continue checked through focused native keyboard activation with test-only RAF freeze and bringToFront. Post-reload CDP dispatch was intermittent in single-process software Chromium; initial Begin and other pointer actions were tested normally.');
    await waitFor(()=>__CAVE__.game.state==='playing');
    assert.ok(expectedSave,'Checkpoint export fixture must have succeeded');assert.deepEqual(await digest(),expectedSave);
    assert.equal(await page.locator('#touch-controls').isVisible(),true);
    assert.equal(await page.evaluate(()=>__CAVE__.settings.motion),true);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'scene');
  });

  await check('Hovering a touch button does not activate it',async()=>{
    await resume();
    const before=await page.evaluate(()=>({serial:__CAVE__.game.player.attackSerial,x:__CAVE__.game.player.x}));
    await page.locator('[data-action="attack"]').hover();await page.waitForTimeout(130);
    const after=await page.evaluate(()=>({serial:__CAVE__.game.player.attackSerial,x:__CAVE__.game.player.x,pointers:__CAVE__.input.pointers.size}));
    assert.equal(after.serial,before.serial);assert.equal(after.pointers,0);assert.equal(after.x,before.x);
  });

  await check('Simultaneous touch movement/action sources cancel cleanly',async()=>{
    await resume();await page.setViewportSize({width:844,height:390});
    const right=await page.locator('[data-action="right"]').boundingBox(),jump=await page.locator('[data-action="jump"]').boundingBox();
    assert.ok(right&&jump,'Touch controls must be visible');
    const cdp=await context.newCDPSession(page);
    try {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:right.x+right.width/2,y:right.y+right.height/2,radiusX:4,radiusY:4,force:1},{id:2,x:jump.x+jump.width/2,y:jump.y+jump.height/2,radiusX:4,radiusY:4,force:1}]});
      await page.waitForTimeout(80);
      const held=await page.evaluate(()=>({actions:[...__CAVE__.input.pointers.values()].sort(),y:__CAVE__.game.player.y}));
      assert.deepEqual(held.actions,['jump','right']);assert.ok(held.y<74,'Jump touch must move the hunter into the air');
      await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.waitForTimeout(80);
      assert.equal(await page.evaluate(()=>__CAVE__.input.pointers.size),0);
      assert.equal(await page.locator('[data-action].pressed').count(),0);
    } finally {await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]}).catch(()=>{});await cdp.detach();}
  });

  for(const size of [{width:390,height:844,name:'portrait'},{width:844,height:390,name:'landscape'}]){
    await check(`Touch controls fit ${size.name} ${size.width}×${size.height}`,async()=>{
      await resume();await page.setViewportSize({width:size.width,height:size.height});await page.waitForTimeout(180);
      const layout=await page.locator('#touch-controls button').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect();return {action:button.dataset.action,x:r.x,y:r.y,width:r.width,height:r.height,visible:!!(r.width&&r.height),fits:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};}));
      assert.equal(layout.length,5);assert.ok(layout.every(b=>b.visible&&b.fits),JSON.stringify(layout));
      assert.ok(layout.every(b=>b.width>=40&&b.height>=40),'Touch targets must remain usable');
      await screenshot(`${size.name}-gameplay.png`);return layout;
    });
  }

  await check('Collected relic remains provisional until the next camp, then unlocks a skill',async()=>{
    await resume();
    const found=await page.evaluate(()=>{
      const {game}=__CAVE__;game.newRun();__CAVE__.input.clear();
      const relic=game.level.items.find(item=>item.type==='relic');
      // Reach the nearby camp before taking the relic, as a normal forward walk does.
      const priorCamp=game.level.checkpoints.filter(c=>c.x<relic.x).at(-1);
      Object.assign(game.player,{x:priorCamp.x,y:96-game.player.h,vx:0,vy:0,onGround:true});game.step(1/120,{});
      Object.assign(game.player,{x:relic.x,y:96-game.player.h,vx:0,vy:0,onGround:true});
      game.step(1/120,{});game.pause();__CAVE__.sync();
      return {relics:game.relics,secured:game.securedRelics,log:game.relicLog};
    });
    assert.deepEqual(found,{relics:1,secured:0,log:[0]});
    await menu('journal');
    assert.equal(await page.locator('[data-craft="forager"]').isDisabled(),true);
    assert.match(await page.locator('[data-relic="0"]').innerText(),/Sunstone[\s\S]*Carried · secure at the next camp/);
    await resume();
    await page.evaluate(()=>{
      const {game}=__CAVE__,camp=game.level.checkpoints.find(c=>!c.reached&&c.x>game.player.x);
      if(!camp)throw Error('No later camp after the relic fixture');
      Object.assign(game.player,{x:camp.x,y:96-game.player.h,vx:0,vy:0,onGround:true});
      game.step(1/120,{});game.pause();__CAVE__.sync();
    });
    await menu('journal');assert.equal(await page.locator('[data-craft="forager"]').isDisabled(),false);
    assert.equal(await page.locator('[data-craft="wind"]').isDisabled(),true);
    assert.match(await page.locator('[data-relic="0"]').innerText(),/Found · secured/);
    await page.locator('[data-craft="forager"]').click();
    assert.equal(await page.locator('[data-craft="forager"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(__CAVE__.saveKey)).data.craft),'forager');
    return 'Direct pickup/camp setup exercises the normal simulation pickup and checkpoint paths; it is not a played route.';
  });

  let migratedSave;
  await check('Legacy v2 camp imports with exact supplies, honest relic identities, and earned unlocks',async()=>{
    await menu('settings');await page.locator('#import').setInputFiles(legacyCampPath);
    await waitFor(()=>document.getElementById('import-status').textContent.includes('Journey imported'));
    const carried=await page.evaluate(()=>{const {game}=__CAVE__;return {hp:game.player.hp,club:game.player.club,levelIndex:game.levelIndex,relics:game.relics,secured:game.securedRelics,log:game.relicLog,unknown:game.unidentifiedRelics,camp:game.checkpointLabel};});
    assert.deepEqual(carried,{hp:7,club:9,levelIndex:4,relics:4,secured:4,log:[4],unknown:3,camp:'Camp 1'});
    await menu('journal');assert.equal(await page.locator('#relic-list [data-relic]').count(),10);
    assert.match(await page.locator('#journal-summary').innerText(),/4 \/ 10 found · 4 secured/);
    assert.match(await page.locator('#journal-memory').innerText(),/3 earlier finds.*identities are unknown/);
    assert.equal(await page.locator('#relic-list .found').count(),1);
    assert.match(await page.locator('[data-relic="4"]').innerText(),/Paired Fangs[\s\S]*Found · secured/);
    assert.match(await page.locator('[data-relic="0"]').innerText(),/Identity not recorded in earlier save/);
    for(const craft of ['none','forager','wind'])assert.equal(await page.locator(`[data-craft="${craft}"]`).isDisabled(),false);
    assert.equal(await page.locator('[data-craft="edge"]').isDisabled(),true);
    await page.locator('[data-craft="wind"]').click();
    assert.equal(await page.locator('[data-craft="wind"]').getAttribute('aria-pressed'),'true');
    assert.deepEqual(await page.evaluate(()=>({hp:__CAVE__.game.player.hp,club:__CAVE__.game.player.club})),{hp:7,club:9});
    for(const size of [{width:844,height:390,name:'landscape'},{width:390,height:844,name:'portrait'}]){
      await page.setViewportSize({width:size.width,height:size.height});
      await page.locator('#panel-journal').evaluate(e=>{e.scrollTop=0;});
      const layout=await page.locator('#menu,.menu-head,.menu-tabs,#close-menu,#resume').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {name:e.id||e.className,fits:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight};}));
      assert.ok(layout.every(e=>e.fits),JSON.stringify(layout));
      await screenshot(`${size.name}-relic-journal.png`);
      await page.locator('[data-relic="9"]').scrollIntoViewIfNeeded();
      const bottom=await page.locator('[data-relic="9"]').boundingBox();assert.ok(bottom&&bottom.y>=0&&bottom.y+bottom.height<=size.height,'Final relic can be reached inside the scrolling panel');
      assert.equal(await page.locator('#close-menu').isVisible(),true);assert.equal(await page.locator('#resume').isVisible(),true);
      await screenshot(`${size.name}-journal-last-relic.png`);
    }
    await menu('settings');
    const downloading=page.waitForEvent('download');await page.locator('#export').click();const download=await downloading;
    const file=path.join(output,'migrated-v3-journey.json');await download.saveAs(file);migratedSave=JSON.parse(fs.readFileSync(file,'utf8'));
    assert.equal(migratedSave.version,3);assert.equal(migratedSave.data.craft,'wind');assert.equal(migratedSave.data.unidentifiedRelics,3);assert.deepEqual(migratedSave.data.relicLog,[4]);
  });

  await check('Selected trail skill and migrated supplies persist through Reload and Continue',async()=>{
    assert.ok(migratedSave,'Legacy migration export must have succeeded');
    await page.reload({waitUntil:'networkidle'});await waitFor(()=>window.__CAVE__);
    await continueAfterReload();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'scene');
    const restored=await page.evaluate(()=>{const s=__CAVE__.game.snapshot().data;return {hp:s.player.hp,club:s.player.club,levelIndex:s.levelIndex,craft:s.craft,relics:s.relics,unknown:s.unidentifiedRelics,log:s.relicLog};});
    assert.deepEqual(restored,{hp:7,club:9,levelIndex:4,craft:'wind',relics:4,unknown:3,log:[4]});
    await menu('journal');assert.equal(await page.locator('[data-craft="wind"]').getAttribute('aria-pressed'),'true');
  });

  await check('Inconsistent v3 progression and forged hazards are rejected without replacing progress',async()=>{
    await menu('settings');
    const before=await page.evaluate(()=>({snapshot:JSON.stringify(__CAVE__.game.snapshot()),stored:localStorage.getItem(__CAVE__.saveKey)}));
    for(const mutation of [s=>s.data.relicLog.push(4),s=>s.data.unidentifiedRelics=4,s=>s.data.craft='edge',s=>s.data.hazards.push({id:'forged',type:'steam',x:40,y:72,w:18,h:24,phase:'idle',timer:0})]){
      const broken=structuredClone(migratedSave);mutation(broken);
      await page.locator('#import-status').evaluate(e=>e.textContent='');
      await page.locator('#import').setInputFiles({name:'inconsistent-v3.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(broken))});
      await waitFor(()=>document.getElementById('import-status').textContent.includes('not a valid'));
      assert.deepEqual(await page.evaluate(()=>({snapshot:JSON.stringify(__CAVE__.game.snapshot()),stored:localStorage.getItem(__CAVE__.saveKey)})),before);
    }
  });

  await check('Cave and final boss render without runtime errors (scene fixtures)',async()=>{
    await resume();await page.setViewportSize({width:1440,height:900});
    for(const fixture of [{index:2,name:'cave-fixture.png'},{index:9,name:'boss-fixture.png'}]){
      await page.evaluate(({index})=>{
        const {game,renderer}=__CAVE__;game.levelIndex=index;game._loadLevel();
        if(index===9){const beast=game.level.enemies.find(e=>e.boss);game.player.x=beast.x-85;beast.phase='windup';beast.move='charge';beast.tell=.3;beast.phaseTimer=.3;}
        else{const col=game.level.caveFlags.findIndex(Boolean);if(col<0)throw Error('Cave fixture missing');game.player.x=(col+4)*16;}
        __CAVE__.sync();game.pause();__CAVE__.sync();renderer.cameraStage=-1;renderer.render(game,0);
      },fixture);
      if(fixture.index===9){assert.equal(await page.locator('#boss').isVisible(),true);assert.equal(await page.locator('#boss-phase').innerText(),'EVADE — CHARGING');}
      await screenshot(fixture.name);
    }
    return 'Direct scene setup only; these screenshots are not evidence of campaign completion.';
  });

  await check('Rockfall, steam, and slam warnings remain visible on desktop and mobile (scene fixtures)',async()=>{
    for(const size of [{width:1440,height:900,name:'desktop'},{width:390,height:844,name:'portrait'}]){
      await page.setViewportSize({width:size.width,height:size.height});
      for(const fixture of [{index:2,type:'rockfall'},{index:5,type:'steam'}]){
        for(const phase of ['warning','active']){
          const drawn=await page.evaluate(({index,type,phase})=>{
            const {game,renderer}=__CAVE__;game.newRun();game.levelIndex=index;game._loadLevel();
            const hazard=game.level.hazards.find(h=>h.type===type);if(!hazard)throw Error(`Missing ${type} site`);
            hazard.phase=phase;hazard.timer=phase==='warning'?.5:type==='rockfall'?.15:.35;
            Object.assign(game.player,{x:hazard.x-45,y:96-game.player.h,vx:0,vy:0,onGround:true});
            __CAVE__.sync();game.pause();__CAVE__.sync();renderer.cameraStage=-1;renderer.lastFrozenKey=null;renderer.render(game,0);
            return {type:hazard.type,phase:hazard.phase,width:hazard.w,height:hazard.h};
          },{...fixture,phase});
          assert.equal(drawn.type,fixture.type);assert.equal(drawn.phase,phase);assert.ok(drawn.width>0&&drawn.height>0);
          await screenshot(`${size.name}-${fixture.type}-${phase}.png`);
        }
      }
      for(const phase of ['prepare','jump','slam']){
        await page.evaluate(({phase})=>{
          const {game,renderer}=__CAVE__;game.newRun();game.levelIndex=9;game._loadLevel();
          const beast=game.level.enemies.find(e=>e.boss);
          Object.assign(beast,{move:'slam',phase:phase==='slam'?'slam':'windup',phaseTimer:phase==='prepare'?.7:phase==='jump'?.2:.12,tell:phase==='prepare'?.7:phase==='jump'?.2:0});
          Object.assign(game.player,{x:beast.x-45,y:phase==='slam'?45:74,vx:0,vy:0,onGround:phase!=='slam'});
          __CAVE__.sync();game.pause();__CAVE__.sync();renderer.cameraStage=-1;renderer.lastFrozenKey=null;renderer.render(game,0);
        },{phase});
        assert.equal(await page.locator('#boss-phase').innerText(),phase==='prepare'?'GROUND SLAM — GET READY':phase==='jump'?'HOLD JUMP NOW':'STAY ABOVE THE SHOCKWAVE');
        await screenshot(`${size.name}-boss-${phase}.png`);
      }
    }
    return 'Paused scene fixtures cover both danger phases and the timed slam cues; screenshots do not establish full-campaign playability.';
  });

  await check('No runtime, console, or failed-request errors',async()=>{
    assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.failedRequests,[]);
  });
})().catch(error=>{report.checks.push({name:'Suite setup or execution',pass:false,error:error.stack});console.error(error.stack);}).finally(async()=>{
  if(browser)await browser.close().catch(()=>{});
  if(server)await new Promise(resolve=>server.close(resolve));
  report.passed=report.checks.filter(c=>c.pass).length;report.failed=report.checks.filter(c=>!c.pass).length;
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));
  console.log(`${report.passed} passed; ${report.failed} failed. Evidence: ${output}`);
  if(report.failed)process.exitCode=1;
});
