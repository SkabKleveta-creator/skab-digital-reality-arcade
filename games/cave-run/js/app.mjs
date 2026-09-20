import {Game,LEVELS} from './core.mjs?build=expedition-2';
import {Renderer} from './render.mjs?build=expedition-2';
import {AudioEngine} from './audio.mjs?build=expedition-2';
import {Inputs,KEY_ACTIONS} from './input.mjs?build=expedition-2';
import {RELICS,CRAFTS} from './progression.mjs?build=expedition-2';

const $=id=>document.getElementById(id);
const SAVE_KEY='skab-cave-run-journey-v2';
const SETTINGS_KEY='skab-cave-run-settings-v2';
const game=new Game(),input=new Inputs(),audio=new AudioEngine();
let renderer;
try{renderer=new Renderer($('scene'));}catch(e){fatal('The landscape could not start. Reload to try again. Your saved journey has not been changed.');throw e;}
let storageOkay=true,saved=null,lastState='',lastLevel=-1,lastHud=0,noticeUntil=0,saveSerial='',padPause=false,panelOrigin='title',lastFrame=0,accumulator=0;
let settings={audio:true,volume:.35,motion:matchMedia('(prefers-reduced-motion: reduce)').matches,touch:matchMedia('(pointer: coarse)').matches};
try{const raw=localStorage.getItem(SETTINGS_KEY);if(raw){const s=JSON.parse(raw);for(const k of ['audio','motion','touch'])if(typeof s[k]==='boolean')settings[k]=s[k];if(Number.isFinite(s.volume))settings.volume=Math.min(1,Math.max(0,s.volume));}}catch{}
audio.setEnabled(settings.audio);audio.setVolume(settings.volume);renderer.reducedMotion=settings.motion;
$('audio-setting').checked=settings.audio;$('motion').checked=settings.motion;$('touch-setting').checked=settings.touch;$('volume').value=Math.round(settings.volume*100);
document.body.classList.toggle('touch-mode',settings.touch);
function fatal(message){if(document.querySelector('.fatal'))return;const el=document.createElement('div');el.className='fatal';const box=document.createElement('div');const p=document.createElement('p');p.textContent=message;const button=document.createElement('button');button.className='button primary';button.textContent='Reload last saved camp';button.onclick=()=>location.reload();box.append(p,button);el.append(box);document.body.append(el);button.focus();}
function notify(message,duration=3500){$('notice').textContent=message;$('notice').hidden=false;noticeUntil=performance.now()+duration;}
function storeSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}syncSound();}
function syncSound(){$('sound').setAttribute('aria-pressed',String(settings.audio));$('sound').setAttribute('aria-label',settings.audio?'Turn music and sound off':'Turn music and sound on');$('sound').querySelector('span').textContent=settings.audio?'ON':'OFF';$('audio-setting').checked=settings.audio;}
syncSound();
function storageWarning(){storageOkay=false;$('storage-status').textContent='Device saving is unavailable. Export your journey before leaving.';notify('Device saving is unavailable. Use Settings → Export journey.',6000);}
function validSnapshot(value){const probe=new Game();const result=probe.restore(value);if(result===false)throw new Error('Invalid journey');return value;}
try{const raw=localStorage.getItem(SAVE_KEY);if(raw){saved=validSnapshot(JSON.parse(raw));}}catch(e){$('save-summary').textContent='The existing save could not be read. Begin a new hunt or import an exported journey.';}
function writeSave(){try{const s=game.snapshot();if(!s)return;const serialized=JSON.stringify(s);if(serialized===saveSerial)return;saved=s;saveSerial=serialized;try{localStorage.setItem(SAVE_KEY,serialized);storageOkay=true;}catch{storageWarning();}}catch(e){console.error('Save could not be prepared',e);notify('Save could not be prepared. The previous camp is still available.');}}
function syncFront(){const has=!!saved;$('begin').hidden=has;$('continue').hidden=!has;$('fresh').hidden=!has;if(has){let p=new Game();try{p.restore(saved);$('save-summary').textContent=p.state==='complete'?'The ten-sun hunt is complete. Your journey is saved.':`Saved at ${p.checkpointLabel||'the trailhead'} · Sun ${p.levelIndex+1}: ${title(LEVELS[p.levelIndex].name)}`;}catch{}}}
function title(s){return String(s).toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase());}
syncFront();
async function unlock(){try{await audio.unlock();}catch{}}
function enableInputs(){input.clear();input.enabled=game.state==='playing';if(input.enabled)$('scene').focus({preventScroll:true});document.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('pressed'));}
function startNew(){game.newRun();writeSave();enableInputs();unlock();lastState='';sync();}
function continueRun(){try{game.restore(validSnapshot(saved));if(game.state==='paused')game.resume();enableInputs();unlock();lastState='';sync();notify(game.state==='complete'?'Your completed journey.':game.state==='stageclear'?'Stage complete. The next land awaits.':'Journey restored to your last saved camp.');}catch{notify('This journey could not be restored. Your save was not replaced.');}}
$('begin').onclick=startNew;$('continue').onclick=continueRun;
function requestNew(){input.clear();if(game.state==='playing')game.pause();$('confirm').showModal();$('cancel-new').focus();}
$('fresh').onclick=requestNew;$('restart').onclick=requestNew;
$('cancel-new').onclick=()=>{$('confirm').close();};
$('confirm-new').onclick=()=>{$('confirm').close();$('menu').close();startNew();};
$('confirm').addEventListener('cancel',()=>{});
function selectTab(name){document.querySelectorAll('[data-tab]').forEach(b=>{const selected=b.dataset.tab===name;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});for(const n of ['journey','journal','help','settings'])$('panel-'+n).hidden=n!==name;if(name==='journal')updateJournal();}
function openMenu(tab='journey'){if($('confirm').open)return;panelOrigin=game.state;if(game.state==='playing'){game.pause();writeSave();}enableInputs();selectTab(tab);updateRoute();if(!$('menu').open)$('menu').showModal();$('resume').textContent=game.state==='title'?'Back to the trailhead':game.state==='paused'?'Return to the wild':'Back to the journey';$('resume').focus();sync();}
function closeMenu(){if($('confirm').open)return;$('menu').close();if(game.state==='paused'&&(panelOrigin==='playing'||panelOrigin==='paused')){game.resume();unlock();}enableInputs();sync();}
$('pause').onclick=()=>{$('menu').open?closeMenu():openMenu();};$('close-menu').onclick=closeMenu;$('resume').onclick=closeMenu;$('how').onclick=()=>openMenu('help');$('outcome-menu').onclick=()=>openMenu();
$('menu').addEventListener('cancel',e=>{e.preventDefault();closeMenu();});
document.querySelectorAll('[data-tab]').forEach(b=>{b.onclick=()=>selectTab(b.dataset.tab);b.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const tabs=[...document.querySelectorAll('[data-tab]')];const next=tabs[(tabs.indexOf(b)+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];selectTab(next.dataset.tab);next.focus();e.preventDefault();}};});
function updateRoute(){const list=$('route-list');list.replaceChildren();LEVELS.forEach((l,i)=>{const li=document.createElement('li');li.className=i<game.levelIndex||game.state==='complete'?'done':i===game.levelIndex?'active':'';const num=document.createElement('span');num.className='num';num.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.textContent=title(l.name);const mark=document.createElement('span');mark.className='mark';mark.textContent=i<game.levelIndex||game.state==='complete'?'✓':i===game.levelIndex?'●':'—';li.append(num,name,mark);list.append(li);});$('journey-stats').textContent=`${Math.floor(game.time/60)} minutes on the trail · ${game.kills||0} creatures defeated · ${game.relics||0} relics · ${game.deaths||0} falls`;$('export').disabled=!saved&&game.state==='title';}
const RELIC_COLORS=['#e6b66a','#a8dce9','#8dd7b1','#d6ad82','#e9dbc1','#9edbda','#cad9ed','#c6b7e7','#acc9ab','#e6aa78'];
const RELIC_GLYPHS=[
  '<circle cx="24" cy="24" r="11"/><path d="M24 4v5m0 30v5M4 24h5m30 0h5M10 10l4 4m20 20l4 4M10 38l4-4m20-20l4-4"/>',
  '<path d="M13 8l22 4-7 20-14 10 4-20z"/><path d="M18 22l10 10M23 12l-2 13"/>',
  '<path d="M4 24Q24 3 44 24Q24 45 4 24z"/><circle cx="24" cy="24" r="7"/>',
  '<path d="M9 42L32 7q13 3 4 20L13 36M15 33l17-23M23 22l10 1M19 28l10 1"/>',
  '<path d="M8 8l13 2-3 19-7 12 1-20zM27 8l13 2-3 19-7 12 1-20z"/>',
  '<path d="M24 24q0-8 8-6 10 4 3 14-10 11-21 0Q3 17 17 8q20-11 28 13"/>',
  '<path d="M35 7C9 4 0 35 26 42q10 0 16-10C13 40 14 11 35 7z"/>',
  '<path d="M29 4L10 26h13l-4 18 20-25H26z"/>',
  '<path d="M24 5l18 19-18 19L6 24zM24 14l10 10-10 10-10-10zM6 24h8m20 0h8M24 5v9m0 20v9"/>',
  '<path d="M8 39C32 36 40 19 32 5q-1 22-19 22zM11 32l7 6m1-12l6 6m-1-11l6 5"/>'
];
function relicIcon(index){return `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="${RELIC_COLORS[index]}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${RELIC_GLYPHS[index]}</svg>`;}
function updateJournal(){
  const known=new Set(game.relicLog||[]),secured=game.securedRelics||0;
  const banked=new Set(game.snapshot()?.data.relicLog||[]);
  $('journal-summary').textContent=`${game.relics||0} / 10 found · ${secured} secured`;
  const unknown=game.unidentifiedRelics||0;
  $('journal-memory').hidden=!unknown;
  $('journal-memory').textContent=`${unknown} earlier ${unknown===1?'find is':'finds are'} preserved from your previous save. That version recorded the total, so their individual identities are unknown.`;
  const chosen=CRAFTS.find(c=>c.id===game.craft);
  $('craft-equipped').textContent=chosen&&chosen.id!=='none'?`${chosen.name} equipped`:'No skill equipped';
  const canChange=['paused','stageclear','complete'].includes(game.state);
  const choices=$('craft-list');choices.replaceChildren();
  for(const craft of CRAFTS){
    const button=document.createElement('button'),locked=secured<craft.unlock;
    button.className='craft-card';button.dataset.craft=craft.id;
    button.setAttribute('aria-pressed',String(game.craft===craft.id));
    button.disabled=locked||!canChange;
    const name=document.createElement('strong');name.textContent=craft.name;
    const info=document.createElement('span');info.textContent=craft.detail;
    const tag=document.createElement('small');tag.textContent=locked?`${craft.unlock} secured relic${craft.unlock===1?'':'s'} required`:game.craft===craft.id?'Equipped':'Select skill';
    button.append(name,info,tag);button.onclick=()=>{
      if(!game.selectCraft(craft.id))return;
      writeSave();updateJournal();$('craft-status').textContent=craft.id==='none'?'Trail skill removed.':`${craft.name} equipped. Your supplies are unchanged.`;
      $('craft-list').querySelector(`[data-craft="${craft.id}"]`)?.focus();
    };choices.append(button);
  }
  $('craft-status').textContent=canChange?'Skills unlock from relics secured at camp. You can change your equipped skill here.':'Open this journal during a hunt to equip an unlocked skill.';
  const list=$('relic-list');list.replaceChildren();
  for(const relic of RELICS){
    const found=known.has(relic.stageIndex),safe=banked.has(relic.stageIndex);
    const li=document.createElement('li');li.className='relic-card'+(found?' found':'');li.dataset.relic=String(relic.stageIndex);
    const art=document.createElement('div');art.className='relic-art';art.innerHTML=relicIcon(relic.stageIndex);
    const copy=document.createElement('div');const stage=document.createElement('span');stage.className='eyebrow';stage.textContent=`SUN ${String(relic.stageIndex+1).padStart(2,'0')} · ${title(LEVELS[relic.stageIndex].name)}`;
    const name=document.createElement('h4');name.textContent=relic.name;
    const detail=document.createElement('p');detail.textContent=found?relic.detail:relic.hint;
    const status=document.createElement('small');status.textContent=found?(safe?'Found · secured':'Carried · secure at the next camp'):unknown&&relic.stageIndex<game.levelIndex?'Identity not recorded in earlier save':'Not found';
    copy.append(stage,name,detail,status);li.append(art,copy);list.append(li);
  }
}
function autoPause(){input.clear();if(game.state==='playing'){game.pause();writeSave();if(!$('menu').open)openMenu();}audio.setPlaying(false);lastFrame=0;accumulator=0;}
document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});window.addEventListener('blur',autoPause);window.addEventListener('pagehide',()=>{if(game.state!=='title')writeSave();});
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)return;if(e.code==='Escape'||e.code==='KeyP'){if(e.repeat||$('confirm').open)return;if($('menu').open){if(e.code==='KeyP')closeMenu();return;}e.preventDefault();if(game.state!=='title')openMenu();return;}if($('menu').open||$('confirm').open)return;if(e.target.closest?.('[contenteditable]')||(['Enter','Space'].includes(e.code)&&e.target.closest?.('button,a')))return;if((e.code==='Enter')&&!e.repeat){e.preventDefault();if(game.state==='title')saved?continueRun():startNew();else if(['dead','stageclear','complete'].includes(game.state))outcomeAction();return;}if(KEY_ACTIONS[e.code]){e.preventDefault();input.key(e.code,true);}});
window.addEventListener('keyup',e=>{if(KEY_ACTIONS[e.code]){input.key(e.code,false);if(input.enabled&&!e.target.closest?.('button,a,input,select,textarea,[contenteditable]'))e.preventDefault();}});
document.querySelectorAll('[data-action]').forEach(button=>{button.addEventListener('pointerdown',e=>{if(!input.enabled)return;e.preventDefault();button.setPointerCapture?.(e.pointerId);input.pointer(e.pointerId,button.dataset.action,true);button.classList.add('pressed');unlock();});const release=e=>{input.pointer(e.pointerId,button.dataset.action,false);if(![...input.pointers.values()].includes(button.dataset.action))button.classList.remove('pressed');};for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,release);button.addEventListener('contextmenu',e=>e.preventDefault());});
function pollGamepad(){let pad;try{pad=[...navigator.getGamepads()].find(p=>p?.connected);}catch{}if(!pad){input.pad={};padPause=false;return;}const b=i=>!!pad.buttons[i]?.pressed;const pause=b(9);if(pause&&!padPause){if($('menu').open)closeMenu();else if(game.state==='title')saved?continueRun():startNew();else if(['dead','stageclear'].includes(game.state))outcomeAction();else openMenu();}padPause=pause;input.pad={left:pad.axes[0]<-.25||b(14),right:pad.axes[0]>.25||b(15),jump:b(0),attack:b(2),dodge:b(1)};}
function setAudio(on){settings.audio=on;audio.setEnabled(on);unlock();storeSettings();if(game.state==='playing')$('scene').focus({preventScroll:true});}
$('sound').onclick=()=>setAudio(!settings.audio);$('audio-setting').onchange=e=>setAudio(e.target.checked);$('volume').oninput=e=>{settings.volume=Number(e.target.value)/100;audio.setVolume(settings.volume);storeSettings();};$('motion').onchange=e=>{settings.motion=e.target.checked;renderer.reducedMotion=settings.motion;storeSettings();};$('touch-setting').onchange=e=>{settings.touch=e.target.checked;document.body.classList.toggle('touch-mode',settings.touch);storeSettings();sync();};
if(!document.fullscreenEnabled)$('fullscreen').hidden=true;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullscreen is unavailable in this browser.');}finally{if(game.state==='playing')$('scene').focus({preventScroll:true});}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');renderer.resize();});
$('export').onclick=()=>{if(game.state!=='title')writeSave();if(!saved){$('import-status').textContent='Begin a hunt to create a journey.';return;}const blob=new Blob([JSON.stringify(saved,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='cave-run-journey.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);$('import-status').textContent='Exported your last saved camp.';};
$('import').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>300000)throw Error('too large');const s=validSnapshot(JSON.parse(await file.text()));game.restore(s);if(game.state==='playing')game.pause();saved=s;saveSerial='';writeSave();panelOrigin='paused';$('import-status').textContent='Journey imported. Close the menu to continue.';updateRoute();sync();}catch{$('import-status').textContent='That file is not a valid Cave Run journey. Your current hunt is unchanged.';}finally{e.target.value='';}};
function outcomeAction(){if(game.state==='dead'){game.retry();notify('Back at camp. Your supplies are as you left them.');}else if(game.state==='stageclear'){game.nextLevel();writeSave();}else if(game.state==='complete'){openMenu();return;}enableInputs();unlock();sync();}
$('outcome-action').onclick=outcomeAction;
function sync(){const playing=game.state==='playing',titleState=game.state==='title';input.enabled=playing&&!$('menu').open&&!$('confirm').open;$('front').hidden=!titleState;$('hud').hidden=titleState;$('trail').hidden=titleState;$('keyboard-hint').hidden=!playing||settings.touch;$('touch-controls').hidden=!playing||!settings.touch;$('outcome').hidden=!['dead','stageclear','complete'].includes(game.state);audio.setPlaying(playing&&!document.hidden);if(lastState!==game.state||lastLevel!==game.levelIndex){if(['dead','stageclear','complete'].includes(game.state)){input.clear();if(game.state==='dead'){$('outcome-kicker').textContent='THE HUNT IS NOT OVER';$('outcome-heading').textContent='Rise again.';$('outcome-copy').textContent='The fire remembers where you stood. Return with the supplies you had at your last camp.';$('outcome-action').textContent='Return to camp →';}else if(game.state==='stageclear'){$('outcome-kicker').textContent=`SUN ${String(game.levelIndex+1).padStart(2,'0')} COMPLETE`;$('outcome-heading').textContent='Another land behind you.';$('outcome-copy').textContent=`Ahead: ${title(LEVELS[Math.min(9,game.levelIndex+1)].name)}. Your health and club wear continue with you.`;$('outcome-action').textContent='Walk into the next sun →';}else{$('outcome-kicker').textContent='ALL TEN SUNS · THE GREAT BEAST DEFEATED';$('outcome-heading').textContent='The fire is yours again.';$('outcome-copy').textContent='You crossed the wildlands and ended the Great Beast’s hunt. Every hard-earned step brought you home.';$('outcome-action').textContent='View your journey →';}$('outcome-stats').innerHTML=`<span><b>${game.player.hp}</b>VITALITY</span><span><b>${game.player.club}</b>CLUB</span><span><b>${game.relics||0}</b>RELICS</span>`;if(game.state!=='dead')writeSave();$('outcome-action').focus();}if(playing){$('chapter-number').textContent=`SUN ${String(game.levelIndex+1).padStart(2,'0')} / 10`;$('chapter-name').textContent=title(LEVELS[game.levelIndex].name);}lastState=game.state;lastLevel=game.levelIndex;}updateHUD();}
function updateHUD(){const p=game.player;if(!p)return;$('health-value').textContent=`${p.hp} / ${p.maxHp}`;const health=$('health');if(health.childElementCount!==p.maxHp){health.innerHTML=Array.from({length:p.maxHp},()=>'<i></i>').join('');}[...health.children].forEach((c,i)=>c.classList.toggle('filled',i<p.hp));health.setAttribute('aria-valuenow',String(p.hp));health.setAttribute('aria-valuemax',String(p.maxHp));$('club-fill').style.width=`${p.club/p.clubMax*100}%`;$('club-value').textContent=`${p.club}/${p.clubMax}`;$('weapon-name').textContent=p.club>0?'CLUB':'FISTS';$('stamina-fill').style.width=`${p.stamina/p.maxStamina*100}%`;$('stamina-value').textContent=`${Math.round(p.stamina/p.maxStamina*100)}%`;const craft=CRAFTS.find(c=>c.id===game.craft);$('craft-active').hidden=!craft||craft.id==='none';$('craft-active').textContent=craft?craft.name+' · equipped':'';$('trail-fill').style.width=`${Math.max(0,Math.min(100,p.x/game.level.goalX*100))}%`;$('camp-status').textContent=game.checkpointLabel?`${game.checkpointLabel} · ${storageOkay?'saved':'export to keep'}`:'Trailhead';$('relic-status').textContent=`${game.relics||0} trail relics`;const beast=game.level.enemies.find(e=>e.type==='greatbeast'&&e.alive&&Math.abs(e.x-p.x)<310);$('boss').hidden=!beast||game.state==='title';if(beast){$('boss-fill').style.width=`${beast.hp/beast.maxHp*100}%`;$('boss-phase').textContent=beast.phase==='slam'?'STAY ABOVE THE SHOCKWAVE':beast.tell>0?(beast.move==='slam'?(beast.tell>.28?'GROUND SLAM — GET READY':'HOLD JUMP NOW'):'EVADE — CHARGING'):beast.phase==='recovery'?'NOW. STRIKE.':'WATCH. EVADE. JUMP.';}$('objective').textContent=game.levelIndex===9?'Defeat the Great Beast. Find the way home.':'Follow the trail to the next fire.';audio.setIntensity(beast?1:Math.min(.75,.2+game.levelIndex*.045));}
function frame(ts){try{const elapsed=lastFrame?Math.min((ts-lastFrame)/1000,.1):0;lastFrame=ts;pollGamepad();if(game.state==='playing'&&!$('menu').open&&!$('confirm').open&&!document.hidden){accumulator+=elapsed;let count=0;while(accumulator>=1/120&&count++<12){game.step(1/120,input.sample());accumulator-=1/120;if(game.state!=='playing'){accumulator=0;break;}}}else accumulator=0;const events=game.drainEvents();if(events.length){renderer.addEvents(events);audio.events(events);for(const e of events){if(['checkpoint','stageclear','complete'].includes(e.type))writeSave();if(e.type==='checkpoint')notify(e.text||'Camp reached. Journey saved.');else if(e.type==='boss')notify(e.text||'The Great Beast. Watch its warning. Strike after the charge.',4500);else if(e.type==='pickup'&&e.text)notify(e.text,e.text.includes('relic')?3200:1800);else if(e.type==='slam-warning')notify('Ground slam — wait for the jump cue.',650);}}renderer.render(game,elapsed);if(ts-lastHud>90||lastState!==game.state||lastLevel!==game.levelIndex){sync();lastHud=ts;}if(noticeUntil&&ts>noticeUntil){$('notice').hidden=true;noticeUntil=0;}requestAnimationFrame(frame);}catch(e){input.clear();audio.setPlaying(false);console.error(e);fatal('The journey paused because something went wrong. Reload to return to your last saved camp.');}}
window.addEventListener('resize',()=>renderer.resize());
window.addEventListener('error',e=>{console.error('Cave Run runtime error',e.error||e.message);});
// Explicit debug mode only, for reproducible browser checks; normal play has no mutable global state.
if(new URLSearchParams(location.search).has('debug'))window.__CAVE__={game,input,renderer,audio,openMenu,closeMenu,writeSave,settings,saveKey:SAVE_KEY,step:(dt,i)=>game.step(dt,i),sync};
sync();requestAnimationFrame(frame);
