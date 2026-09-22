import {Game,comboInfo,TYPES} from './engine.mjs';
import {RUNS,dayKey} from './levels.mjs';
import {loadProfile,SAVE_KEY,recordResult} from './storage.mjs';
import {signal} from './art.mjs';
const $=s=>document.querySelector(s),boardEl=$('#board'),dialog=$('#dialog'),body=$('#dialog-body');
let storage;try{storage=window.localStorage}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Unavailable')}}}
const loaded=loadProfile(storage),profile=loaded.profile;
let game,selected=null,cursor=24,keyboard=false,busy=false,epoch=0,audio=null,pointer=null,suppressClickUntil=0,animationTimer=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const icons={surge:'ϟ',burst:'✹',prism:'◆'};
const signalNames={'😀':'SMILE','😎':'COOL','🤖':'ROBOT','👾':'ALIEN','💀':'SKULL','🔥':'FIRE'};
const label=s=>Object.entries(signalNames).reduce((t,[icon,name])=>t.replaceAll(icon,name),s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readable=t=>label(t).replaceAll('⚡','ϟ').replaceAll('💥','✹').replaceAll('🌈','◆').replaceAll('📵','static');
const message=t=>$('#message').textContent=readable(t);
function save(){
  if(game)profile.sessions[game.mode]=game.snapshot();
  try{storage.setItem(SAVE_KEY,JSON.stringify(profile));$('#save-status').textContent='Saved on this device'}catch{$('#save-status').textContent='Saving unavailable in this browser session'}
}
function sound(kind='move'){
  if(!profile.sound)return;
  try{
    audio||=new(window.AudioContext||window.webkitAudioContext)();
    const play=()=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(kind==='power'?680:kind==='bad'?150:kind==='win'?880:420,audio.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='bad'?90:260,audio.currentTime+.15);g.gain.setValueAtTime(.06,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.2)};
    if(audio.state==='suspended')audio.resume().then(play).catch(()=>message('Tap SOUND to recover audio.'));else play();
  }catch{message('Audio is unavailable. You can keep playing with sound off.')}
}
function renderBoard(board=game.board,frame={}){
  const belt=game.config.conveyor;
  boardEl.innerHTML=board.map((t,i)=>{
    const classes=['tile',t.glitch?'static':'',belt?.row===Math.floor(i/7)?'belt':'',selected===i?'selected':'',keyboard&&cursor===i?'cursor':'',frame.hits?.includes(i)?'clear':'',frame.kind==='fall'?'fall':'',frame.kind==='belt'&&frame.row===Math.floor(i/7)?'moved':'',frame.kind==='swap'&&(frame.a===i||frame.b===i)?'swap':''];
    let style=frame.falls?`--drop:${frame.falls[i]};`:'';
    if(frame.kind==='swap'&&(frame.a===i||frame.b===i)){const other=frame.a===i?frame.b:frame.a;style+=`--sx:${(other%7-i%7)*110}%;--sy:${(Math.floor(other/7)-Math.floor(i/7))*110}%;`}
    return `<button type="button" role="gridcell" tabindex="-1" class="${classes.join(' ')}" data-i="${i}" data-power="${t.power||''}" style="${style}" aria-label="${t.face}${t.power?' '+t.power:''}${t.glitch?' static':''}, row ${Math.floor(i/7)+1}, column ${i%7+1}" aria-selected="${selected===i}">${signal(t.face)}${t.power?`<span class="power">${icons[t.power]}</span>`:''}</button>`;
  }).join('');
  boardEl.setAttribute('aria-busy',String(busy));
}
function dailyDetail(){
  if(game.mode!=='daily')return;
  const now=new Date(),left=Math.max(0,Date.parse(dayKey(now)+'T00:00:00Z')+86400000-now.getTime()),hours=Math.floor(left/3600000),minutes=Math.floor(left/60000)%60;
  const r=profile.daily[game.day];
  $('#daily-detail').innerHTML=`<b>${escape(game.day)}</b> · Resets at 00:00 UTC · ${hours}h ${String(minutes).padStart(2,'0')}m to next puzzle<br>${r?.fewest!==null&&r?.fewest!==undefined?'Completed · best '+r.best.toLocaleString()+' · fewest '+r.fewest+' shifts':'30 shifts. Clear 65 tiles, collect the target signal, and purge 5 static.'}${game.day!==dayKey()?' · A new Daily Shift is ready in the Daily tab.':''}`;
}
function renderHud(){
  document.body.dataset.sector=game.config.sector;
  document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===game.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===game.mode))});
  $('#mode-label').textContent=game.mode==='campaign'?`CAMPAIGN / RUN ${String(game.runIndex+1).padStart(2,'0')} OF 30`:game.mode==='daily'?'DAILY SHIFT / SAME PUZZLE WORLDWIDE':'FREE PLAY / EXPERIMENT WITH REACTIONS';
  $('#run-name').textContent=game.config.name;$('#runs').hidden=game.mode!=='campaign';$('#daily-detail').hidden=game.mode!=='daily';dailyDetail();
  $('#score').textContent=game.score.toLocaleString();$('#moves').textContent=game.moves??'∞';
  const record=game.mode==='daily'?profile.daily[game.day]:profile.records[game.runIndex];
  $('#best-label').textContent=game.mode==='daily'?'DAILY BEST':game.mode==='free'?'OVERALL BEST':'RUN BEST';$('#best').textContent=(game.mode==='free'?profile.best:record?.best)?.toLocaleString()||'—';
  $('#objectives').innerHTML=game.objectives().map(o=>`<div class="objective ${o.value>=o.target?'done':''}"><div><span>${escape(label(o.label))}</span><b>${Math.min(o.value,o.target).toLocaleString()}/${o.target.toLocaleString()} ${o.value>=o.target?'✓':''}</b></div><progress value="${Math.min(o.value,o.target)}" max="${o.target}" aria-label="${escape(label(o.label))}"></progress></div>`).join('');
  const belt=game.config.conveyor,parts=[];
  if(game.config.finale){const stage=game.board.some(t=>t.glitch)?'1/3 · PURGE STATIC':game.combos<1?'2/3 · COMBINE POWERS':'3/3 · FLUSH THE GRID';parts.push(stage)}
  if(belt)parts.push(`ROW ${belt.row+1} → shifts right in ${game.beltIn} move${game.beltIn===1?'':'s'}`);
  $('#mechanic').hidden=!parts.length;$('#mechanic').textContent=parts.join(' · ');
  $('#sound').textContent=profile.sound?'SOUND ON':'SOUND OFF';$('#sound').setAttribute('aria-pressed',String(profile.sound));
}
function setBusy(value){busy=value;for(const s of ['#hint','#restart','#runs'])$(s).disabled=value;document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=value);boardEl.setAttribute('aria-busy',String(value))}
function openDialog(html){body.innerHTML=readable(html);if(!dialog.open)dialog.showModal()}
function closeDialog(){dialog.close();boardEl.focus({preventScroll:true})}
function launch(mode=profile.lastMode,index=profile.selected,fresh=false){
  if(busy)return;
  epoch++;selected=null;cursor=24;keyboard=false;
  const cached=Game.restore(profile.sessions[mode]);
  const resume=!fresh&&cached&&(mode==='campaign'?cached.runIndex===index:mode==='daily'?cached.day===dayKey():true);
  game=resume?cached:new Game({mode,runIndex:mode==='campaign'?index:0,day:mode==='daily'?dayKey():''});
  profile.lastMode=mode;if(mode==='campaign')profile.selected=game.runIndex;
  if(mode==='daily'&&!resume){const r=profile.daily[game.day]||{best:0,medal:0,fewest:null,attempts:0};r.attempts++;profile.daily[game.day]=r}
  if(dialog.open)dialog.close();save();renderHud();renderBoard();message((resume&&!game.over?'Resumed your saved grid. ':'')+game.config.clue);
  if(game.over)showResult();
}
function combinePreview(a,b){
  const info=comboInfo(game.board[a],game.board[b]);
  openDialog(`<p class="eyebrow">POWER COMBINATION · COSTS 1 SHIFT</p><h2>${info.name}</h2><p>${info.detail}</p><p>Any power caught in the reaction fires too.</p><div class="actions"><button class="primary" id="combine">COMBINE ${icons[game.board[a].power]} + ${icons[game.board[b].power]}</button><button id="cancel-combo">CANCEL</button></div>`);
  $('#combine').onclick=()=>{closeDialog();play(a,b)};$('#cancel-combo').onclick=closeDialog;
}
async function play(a,b){
  if(busy||game.over||dialog.open)return;selected=null;const token=++epoch;setBusy(true);
  let result;
  const before=game.snapshot();
  try{result=game.play(a,b)}catch(e){game=Game.restore(before);setBusy(false);renderBoard();message(e.message);return}
  if(!result.valid){setBusy(false);renderBoard();message('That shift makes no match. Try three matching signals, or combine two power tiles.');sound('bad');return}
  recordResult(profile,game);save();sound(result.combo?'power':'move');
  if(result.combo)reaction(result.combo);
  for(const frame of result.frames){
    if(token!==epoch)return;
    renderBoard(frame.board,frame);
    if(frame.kind==='clear'&&frame.chain>1)reaction('CHAIN ×'+frame.chain);
    if(frame.kind==='belt')message('CONVEYOR SHIFT → Row '+(frame.row+1)+' moved right.');
    if(frame.kind==='shuffle')message('No matches left. Grid rerouted; every power and static tile preserved.');
    if(!reduced)await sleep(frame.kind==='clear'?210:frame.kind==='fall'?210:160);
  }
  setBusy(false);renderBoard();renderHud();
  if(game.over){sound(game.won?'win':'bad');showResult()}else message(result.combo?result.combo+'! '+game.config.clue:game.config.clue);
}
function reaction(text){const el=$('#reaction');clearTimeout(animationTimer);el.classList.remove('show');el.textContent=text;void el.offsetWidth;el.classList.add('show');animationTimer=setTimeout(()=>el.classList.remove('show'),700)}
function requestSwap(a,b){if(busy||game.over||dialog.open)return;if(comboInfo(game.board[a],game.board[b])&&Math.abs(Math.floor(a/7)-Math.floor(b/7))+Math.abs(a%7-b%7)===1)combinePreview(a,b);else play(a,b)}
function select(i){
  if(busy||game.over||dialog.open)return;cursor=i;
  if(selected===i){selected=null;renderBoard();return}
  if(selected!==null&&Math.abs(Math.floor(selected/7)-Math.floor(i/7))+Math.abs(selected%7-i%7)===1){requestSwap(selected,i);return}
  selected=i;renderBoard();message(game.board[i].power?'Power selected. Match its emoji to fire it, or choose a neighboring power to preview a combination.':'Choose a neighboring signal to shift.');
}
boardEl.addEventListener('click',e=>{if(Date.now()<suppressClickUntil)return;const b=e.target.closest('[data-i]');if(b)select(+b.dataset.i)});
boardEl.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-i]');if(!b||busy||game.over||dialog.open||!e.isPrimary)return;keyboard=false;boardEl.focus({preventScroll:true});pointer={id:e.pointerId,i:+b.dataset.i,x:e.clientX,y:e.clientY};boardEl.setPointerCapture(e.pointerId)});
boardEl.addEventListener('pointerup',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;suppressClickUntil=Date.now()+500;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<18){select(p.i);return}
  const horizontal=Math.abs(dx)>Math.abs(dy),r=Math.floor(p.i/7)+(horizontal?0:dy>0?1:-1),c=p.i%7+(horizontal?(dx>0?1:-1):0);
  if(r>=0&&r<7&&c>=0&&c<7)requestSwap(p.i,r*7+c);
});
boardEl.addEventListener('pointercancel',()=>pointer=null);
boardEl.addEventListener('lostpointercapture',()=>pointer=null);
function moveCursor(dr,dc){if(busy||game.over||dialog.open)return;keyboard=true;cursor=((Math.floor(cursor/7)+dr+7)%7)*7+(cursor%7+dc+7)%7;renderBoard()}
boardEl.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase(),map={arrowup:[-1,0],w:[-1,0],arrowdown:[1,0],s:[1,0],arrowleft:[0,-1],a:[0,-1],arrowright:[0,1],d:[0,1]};
  if(map[k]){e.preventDefault();moveCursor(...map[k])}else if(['enter',' ','z'].includes(k)){e.preventDefault();select(cursor)}else if(k==='x'||k==='escape'){selected=null;renderBoard()}
});
function showRuns(){
  if(busy)return;
  openDialog(`<p class="eyebrow">CAMPAIGN / ${profile.complete.length} OF 30 COMPLETE</p><h2>CHOOSE YOUR SHIFT</h2><p>Earn one medal for completion, one for keeping 20% of your shifts, and one for finishing without hints.</p><div class="run-list">${RUNS.map((r,i)=>{const rec=profile.records[i];return `<button class="run-card" data-run="${i}" ${i>profile.unlocked?'disabled':''}><span class="num">${i+1}</span><span>${r.name}<small>${rec?`Best ${rec.best.toLocaleString()} · Fewest ${rec.fewest??'—'} shifts`:i>=25?'NEW · CONVEYOR CHAPTER':r.danger}</small></span><span class="medals">${i>profile.unlocked?'🔒':rec?.medal?'★'.repeat(rec.medal):profile.complete.includes(i)?'✓':'→'}</span></button>`}).join('')}</div><div class="actions"><button id="close-runs">BACK TO GRID</button></div>`);
  body.querySelectorAll('[data-run]').forEach(b=>b.onclick=()=>launch('campaign',+b.dataset.run));$('#close-runs').onclick=closeDialog;
}
function showResult(){
  const daily=game.mode==='daily',title=game.won?(daily?'DAILY SHIFT COMPLETE':'SHIFT COMPLETE'):'OUT OF SHIFTS';
  const missing=game.objectives().filter(o=>o.value<o.target).map(o=>`${o.label}: ${o.value}/${o.target}`).join(' · ');
  openDialog(`<p class="eyebrow">${daily?escape(game.day)+' / DAILY SHIFT':'RUN '+(game.runIndex+1)+' / '+game.config.name}</p><h2>${title}</h2><div class="result-score">${game.score.toLocaleString()}</div><div class="medals">${game.won?'★'.repeat(game.medal)+'☆'.repeat(3-game.medal):''}</div><p>${game.won?`Completed in ${game.used} shifts · Best chain ×${game.maxChain} · ${game.combos} power combinations.`:escape(missing)}</p><p>${daily?'Same starting board and refill sequence on every retry. Records stay on this device.':game.runIndex===24&&game.won?'The new Foundry chapter is unlocked. Five conveyor puzzles are waiting.':game.runIndex===29&&game.won?'All 30 runs complete. Come back for a fresh Daily Shift Challenge.':'Your progress is saved.'}</p><div class="actions">${!daily&&game.won&&game.runIndex<29?'<button class="primary" id="next">NEXT SHIFT →</button>':''}<button id="retry">${game.won?'REPLAY':'TRY AGAIN'}</button>${daily?'<button class="primary" id="share">SHARE RESULT</button>':'<button id="result-runs">ALL RUNS</button>'}</div><div class="actions"><button id="close-result">VIEW GRID</button>${daily&&game.day!==dayKey()?'<button id="today">PLAY TODAY’S SHIFT</button>':''}</div>`);
  if($('#next'))$('#next').onclick=()=>launch('campaign',game.runIndex+1,true);
  $('#retry').onclick=()=>launch(game.mode,game.runIndex,true);
  if($('#share'))$('#share').onclick=shareResult;
  if($('#result-runs'))$('#result-runs').onclick=showRuns;
  $('#close-result').onclick=closeDialog;if($('#today'))$('#today').onclick=()=>launch('daily');
}
async function shareResult(){
  const text=`Emoji Shift — Daily Shift Challenge\n${game.day} · ${game.won?'COMPLETE':'IN PROGRESS'}\n${game.score.toLocaleString()} points · ${game.used}/30 shifts\n${'★'.repeat(game.medal)}${'☆'.repeat(3-game.medal)} · Chain ×${game.maxChain}\nhttps://skabkleveta-creator.github.io/skab-digital-reality-arcade/games/emoji-shift/?mode=daily`;
  try{if(navigator.share){await navigator.share({title:'Daily Shift Challenge',text});return}if(navigator.clipboard){await navigator.clipboard.writeText(text);$('#share').textContent='COPIED ✓';return}}catch(e){if(e.name==='AbortError')return}
  openDialog(`<h2>SHARE YOUR SHIFT</h2><p>Copy your result below.</p><textarea class="share-text" readonly>${escape(text)}</textarea><div class="actions"><button id="share-back">BACK</button></div>`);body.querySelector('textarea').select();$('#share-back').onclick=showResult;
}
$('#hint').onclick=()=>{
  if(busy||game.over)return;const pair=game.availableMoves()[0];if(!pair)return;
  game.hints++;save();selected=pair[0];renderBoard();pair.forEach(i=>boardEl.children[i].classList.add('hinted'));
  message(comboInfo(game.board[pair[0]],game.board[pair[1]])?'The highlighted powers can combine. Select their pair to preview the effect.':'Shift the highlighted pair. Hints keep your completion and efficiency medals available.');
};
$('#restart').onclick=()=>{
  if(busy)return;openDialog('<h2>RESTART THIS SHIFT?</h2><p>This resets the current grid. Completed runs and best records stay saved.</p><div class="actions"><button id="confirm-restart" class="primary">RESTART</button><button id="cancel-restart">KEEP PLAYING</button></div>');$('#confirm-restart').onclick=()=>launch(game.mode,game.runIndex,true);$('#cancel-restart').onclick=closeDialog;
};
$('#runs').onclick=showRuns;
$('#sound').onclick=()=>{profile.sound=!profile.sound;save();renderHud();if(profile.sound)sound()};
$('#help').onclick=()=>{
  openDialog(`<p class="eyebrow">BUILD THE REACTION</p><h2>HOW TO PLAY</h2><div class="guide"><p>Swipe a signal, or tap two neighbors. Match three or more. Invalid swaps cost no shifts. Power tiles fire when included in a match or another blast.</p><p><b>⚡ Match 4 → SURGE</b><br>Clears its full row and column.<br><b>💥 T / L match → BURST</b><br>Clears a 3 × 3 area.<br><b>🌈 Match 5 → PRISM</b><br>Clears every tile of its emoji type.</p><p><b>COMBINE TWO POWERS</b><br>Swap adjacent power tiles even without a match. Preview the result before committing. Every power caught in the blast activates.</p><p>⚡ + ⚡ = two crosses<br>⚡ + 💥 = three rows and three columns<br>💥 + 💥 = 5 × 5 blast<br>🌈 + ⚡ / 💥 = matching emoji become that power<br>🌈 + 🌈 = full board clear</p><p><b>STATIC & CONVEYORS</b><br>Clear beside static or hit it directly. Marked conveyor rows shift right on the displayed schedule; the rightmost tile wraps to the left.</p><p><b>DAILY SHIFT CHALLENGE</b><br>A fresh puzzle at 00:00 UTC. Everyone gets the same starting board and random sequence; your choices determine the result. Unlimited retries. Local bests and shareable results.</p><p><b>MEDALS</b><br>★ Complete the run<br>★ Keep at least 20% of the starting shifts<br>★ Finish without hints<br>In-progress grids save after every move. Campaign, Daily and Free Play each keep their own save.</p></div><div class="actions"><button id="close-help" class="primary">LET’S SHIFT</button></div>`);$('#close-help').onclick=closeDialog;
};
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>launch(b.dataset.mode);
dialog.addEventListener('close',()=>{selected=null;if(game)renderBoard()});
let previous=[];
function pollGamepad(){
  const pad=[...(navigator.getGamepads?.()||[])].find(Boolean);
  if(pad){
    const now=[pad.buttons[12]?.pressed||pad.axes[1]<-.55,pad.buttons[13]?.pressed||pad.axes[1]>.55,pad.buttons[14]?.pressed||pad.axes[0]<-.55,pad.buttons[15]?.pressed||pad.axes[0]>.55,pad.buttons[0]?.pressed,pad.buttons[1]?.pressed];
    now.forEach((on,i)=>{
      if(!on||previous[i]||busy)return;
      if(dialog.open){
        const buttons=[...body.querySelectorAll('button:not(:disabled)')],current=buttons.indexOf(document.activeElement);
        if(i<4&&buttons.length)buttons[(current+(i===0||i===2?-1:1)+buttons.length)%buttons.length].focus();
        else if(i===4&&buttons.includes(document.activeElement))document.activeElement.click();
        else if(i===5)closeDialog();
      }else if(i<4)moveCursor(...[[-1,0],[1,0],[0,-1],[0,1]][i]);
      else if(i===4)select(cursor);else {selected=null;renderBoard()}
    });previous=now;
  }else previous=[];
  requestAnimationFrame(pollGamepad);
}
window.addEventListener('pagehide',save);
const requested=new URLSearchParams(location.search).get('mode');launch(['daily','free','campaign'].includes(requested)?requested:profile.lastMode);
if(loaded.warning)message('A damaged save was ignored. A fresh grid is ready.');
setInterval(dailyDetail,30000);pollGamepad();
