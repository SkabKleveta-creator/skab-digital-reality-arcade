"use strict";
window.NSCampaign=(()=>{
  const districts=[
    {name:'Sunset Runway',subtitle:'Cut the signal. Find your rhythm.',length:2800,theme:0,color:'#00f0ff',types:['grunt','grunt','runner'],relays:[720,1530,2320],boss:null},
    {name:'Stair Grid',subtitle:'The Gatekeeper is waiting above the noise.',length:3100,theme:1,color:'#ffe14d',types:['grunt','runner','leaper'],relays:[650,1370,2140],boss:'Gatekeeper'},
    {name:'Glass Skybridge',subtitle:'Take the high road. Break their eyes.',length:3200,theme:2,color:'#ff4cc3',types:['runner','spitter','leaper'],relays:[720,1640,2700],boss:null},
    {name:'Foundry Yard',subtitle:'Walk through the fire. Silence the Warden.',length:3400,theme:4,color:'#ff9a3c',types:['brute','grunt','exploder','spitter'],relays:[730,1610,2370],boss:'Furnace Warden'},
    {name:'Ghost Overpass',subtitle:'One last crossing before the Spire.',length:3400,theme:5,color:'#7bf2a7',types:['leaper','runner','spitter','exploder'],relays:[670,1530,2790],boss:null},
    {name:'Black Spire',subtitle:'The city has one master too many.',length:3700,theme:3,color:'#b3a0ff',types:['brute','runner','spitter','exploder'],relays:[750,1640,2550],boss:'Neon Regent'}
  ];
  const difficulty={story:{health:7,speed:.8,boss:.8,score:.75},arcade:{health:5,speed:1,boss:1,score:1},ronin:{health:4,speed:1.18,boss:1.25,score:1.4}};
  const upgradeInfo={
    blade:{name:'Edge protocol',detail:'+0.4 slash damage · faster combos',icon:'刃'},
    mobility:{name:'Ghost step',detail:'Faster movement · shorter dash cooldown',icon:'風'},
    vitality:{name:'Iron heart',detail:'+1 maximum heart · full repair',icon:'命'},
    flow:{name:'Overcharge',detail:'More rage from every hit and takedown',icon:'光'}
  };
  let state={district:0,difficulty:'arcade',cycle:0,upgrades:{blade:0,mobility:0,vitality:0,flow:0},stats:{kills:0,shards:0,time:0,hits:0,maxCombo:0},runId:''};
  let relays=[],shards=[],plans=[],boss=null,hazards=[],shrine=null,stageHits=0,stageShards=0,stageTime=0,cleared=false,recorded=false,noticeTime=0;
  const current=()=>districts[state.district];
  const config=()=>difficulty[state.difficulty];
  const worldX=()=>P.x+camDist;
  const near=(x,y,range)=>Math.hypot(P.x+P.w/2-x,P.y+P.h/2-y)<range;
  function announce(text){waveEl.textContent=text;waveEl.style.opacity=1;noticeTime=3;window.NSUI?.announce(text);}
  function checkpoint(){NSStore.saveCheckpoint({version:2,...state,score:Math.floor(score),hp:Math.ceil(P.hp),rage:P.rage});}
  function start(data){
    const saved=NSStore.validateCheckpoint(data);
    if(!saved)return false;
    state={district:saved.district,difficulty:saved.difficulty,cycle:saved.cycle,upgrades:{...saved.upgrades},stats:{...saved.stats},runId:saved.runId};
    reset();score=saved.score;wave=state.district+1;
    P.maxhp=Math.min(10,config().health+state.upgrades.vitality);P.hp=Math.min(P.maxhp,saved.hp);P.rage=saved.rage;
    P.x=Math.min(125,W*.23);P.y=GY-P.h;P.inv=1.5;
    relays=current().relays.map(x=>({x,y:GY-55,w:30,h:55,hp:4+Math.floor(state.district/2),maxhp:4+Math.floor(state.district/2),flash:0}));
    shards=[];plans=[];hazards=[];boss=null;cleared=false;recorded=false;stageHits=0;stageShards=0;stageTime=0;
    const c=current();
    for(let offset=0;offset<c.length-700;offset+=980)buildMapSegment(c.theme,offset);
    const picks=[platforms[1],platforms[Math.floor(platforms.length/2)],platforms[platforms.length-1]].filter(Boolean);
    for(const platform of picks)shards.push({x:platform.x+platform.w/2,y:platform.y-25,taken:false});
    shrine={x:c.length*.51,y:GY-26,used:false};
    let serial=0;
    for(let x=430;x<c.length-450;x+=400){
      const count=state.district<2?2:3;
      for(let j=0;j<count;j++)plans.push({x:x+j*85,type:c.types[serial++%c.types.length],spawned:false});
    }
    if(c.boss){const hp=([0,26,0,40,0,62][state.district])*(config().boss+state.cycle*.18);boss={name:c.boss,x:c.length-430,y:GY-90,w:58,h:90,hp,maxhp:hp,active:false,state:'approach',timer:1.4,sequence:0,phase:1,face:-1,flash:0,hitCd:0,dead:false,origin:c.length-430};}
    mode='playing';running=true;clearInput();initAudio();checkpoint();updateHUD();
    announce(`${String(state.district+1).padStart(2,'0')} / ${c.name.toUpperCase()}`);
    window.NSUI?.hidePanel();return true;
  }
  function newRun(level='arcade',cycle=0){
    if(!Object.hasOwn(difficulty,level))level='arcade';
    return start({version:2,runId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),district:0,difficulty:level,cycle,upgrades:{blade:0,mobility:0,vitality:0,flow:0},score:0,hp:difficulty[level].health,rage:0,stats:{kills:0,shards:0,time:0,hits:0,maxCombo:0}});
  }
  function resume(){return start(NSStore.data.checkpoint);}
  function advance(upgrade){
    if(mode!=='clear'||state.district>=5)return false;
    if(upgrade!=='repair'&&(!upgradeInfo[upgrade]||state.upgrades[upgrade]>=3))return false;
    if(upgrade!=='repair')state.upgrades[upgrade]++;
    state.district++;
    const hp=upgrade==='vitality'||upgrade==='repair'?10:Math.min(10,P.hp+2);
    return start({version:2,...state,score,hp,rage:P.rage});
  }
  function camera(dt){
    const c=current(),px=Math.max(10,Math.min(c.length-P.w-10,worldX()));
    P.x=px-camDist;
    let desired=camDist;
    if(P.x>W*.60)desired=px-W*.60;
    if(P.x<W*.28)desired=px-W*.28;
    desired=Math.max(0,Math.min(c.length-W,desired));
    const dx=Math.max(-900*dt,Math.min(900*dt,desired-camDist));
    if(dx){P.x-=dx;scrollWorld(dx);}
  }
  function shift(dx){for(const r of [...relays,...shards,...hazards])r.x-=dx;if(shrine)shrine.x-=dx;if(boss)boss.x-=dx;}
  function resize(oldW,oldGY){
    const wx=worldX(),dy=GY-oldGY;
    const next=Math.max(0,Math.min(Math.max(0,current().length-W),wx-(P.x/oldW)*W));
    scrollWorld(next-camDist);P.x=wx-camDist;P.y+=dy;P.laneY=GY;
    for(const list of [enemies,parts,floats,globs,pickups,afters,rings,sparks,waves,relays,shards,hazards])for(const item of list){if(Number.isFinite(item.y))item.y+=dy;if(Number.isFinite(item.laneY))item.laneY=GY;}
    if(shrine)shrine.y+=dy;if(boss)boss.y+=dy;syncPlatformsToLanes();
  }
  function spawn(plan){
    spawnEnemy(plan.type,plan.x-camDist);
    const e=enemies[enemies.length-1];e.spd*=config().speed+state.cycle*.07;e.hp+=state.cycle;e.dir=-1;
    plan.spawned=true;
  }
  function damageRelay(r,damage){
    if(r.hp<=0)return;r.hp=Math.max(0,r.hp-damage);r.flash=.14;
    burst(r.x+15,r.y+25,current().color,8);SFX.hit();addRage(3);
    if(r.hp===0){score+=Math.round(100*config().score);ring(r.x+15,r.y+25,5,110,current().color,.5);floatText(r.x+15,r.y-12,'RELAY OFFLINE',current().color);SFX.boom();announce(`${relays.filter(v=>v.hp<=0).length} / 3 RELAYS OFFLINE`);}
  }
  function hitBoss(damage){
    if(!boss||boss.dead||!boss.active||boss.hitCd>0)return;
    boss.hp=Math.max(0,boss.hp-damage);boss.flash=.1;boss.hitCd=.10;addRage(2);burst(boss.x+boss.w/2,boss.y+35,current().color,8);SFX.hit();
    if(boss.hp===0){boss.dead=true;hazards=[];score+=Math.round(600*config().score);state.stats.kills++;combo++;comboT=3;P.hp=Math.min(P.maxhp,P.hp+2);P.rage=Math.min(100,P.rage+30);burst(boss.x+29,boss.y+45,current().color,55,1.8);ring(boss.x+29,GY,10,230,current().color,.6);announce(`${boss.name.toUpperCase()} // DEREZZED`);SFX.rage();}
  }
  function slash(air,launcher,big){
    const cx=P.x+P.w/2,cy=P.y+P.h/2;
    const hits=target=>{
      if(air)return Math.hypot(target.x+target.w/2-cx,target.y+target.h/2-cy)<115;
      const reach=big?95:80,hx=P.face>0?P.x+P.w-6:P.x-reach;
      return hx<target.x+target.w&&hx+reach>target.x&&P.y-(launcher?55:14)<target.y+target.h&&P.y+P.h+10>target.y;
    };
    const dmg=(big?2:1)+state.upgrades.blade*.4;
    for(const r of relays)if(hits(r))damageRelay(r,dmg);
    if(boss&&hits(boss))hitBoss(dmg);
  }
  function slam(){
    for(const r of relays)if(near(r.x+15,r.y+25,165))damageRelay(r,2+state.upgrades.blade*.4);
    if(boss&&near(boss.x+29,boss.y+45,170))hitBoss(3+state.upgrades.blade*.4);
  }
  function rage(){for(const r of relays)if(r.x>0&&r.x<W)damageRelay(r,3);if(boss&&boss.x+boss.w>0&&boss.x<W)hitBoss(6);hazards=[];}
  function bossUpdate(dt){
    if(!boss||boss.dead)return;
    const b=boss,px=P.x+P.w/2,dx=px-(b.x+b.w/2);
    if(!b.active){if(Math.abs(dx)>Math.min(620,W*.9))return;b.active=true;announce(`${b.name.toUpperCase()} // JUMP THE SHOCKWAVE`);SFX.tele();}
    b.flash=Math.max(0,b.flash-dt);b.hitCd=Math.max(0,b.hitCd-dt);
    if(Math.abs(dx)>W+400)return;
    b.phase=b.hp<b.maxhp*.33?3:b.hp<b.maxhp*.66?2:1;
    b.timer-=dt;
    if(b.state==='approach'){
      b.face=Math.sign(dx)||1;if(Math.abs(dx)>115)b.x+=b.face*(80+b.phase*14)*dt;
      if(b.timer<=0){b.state='telegraph';b.attack=b.sequence++%3;b.timer=(b.attack===2?1.0:.82)*(state.difficulty==='story'?1.25:1);b.target=px;b.face=Math.sign(dx)||1;SFX.tele();
        if(b.attack===2)for(let n=0;n<b.phase+1;n++)hazards.push({x:px+(n-(b.phase)/2)*88,y:GY,t:1.05,live:.2});
      }
    }else if(b.state==='telegraph'&&b.timer<=0){
      if(b.attack===0){b.state='dash';b.timer=.35;SFX.swipe();}
      else{b.state='recover';b.timer=1.25-b.phase*.12;if(b.attack===1){waves.push({x:b.x+29,dir:-1,life:1.7,y:GY},{x:b.x+29,dir:1,life:1.7,y:GY});SFX.slam();ring(b.x+29,GY,5,140,current().color,.3);}}
    }else if(b.state==='dash'){
      b.x+=b.face*(490+b.phase*40)*dt;
      if(P.x<b.x+b.w+28&&P.x+P.w>b.x-28&&P.y+P.h>b.y+24&&P.y<GY)hurtPlayer(1,b.face);
      if(b.timer<=0){b.state='recover';b.timer=1.0;}
    }else if(b.state==='recover'&&b.timer<=0){b.state='approach';b.timer=.8;}
    b.x=Math.max(-camDist+10,Math.min(current().length-camDist-b.w-10,b.x));
  }
  function finish(won){
    if(recorded)return;recorded=true;
    best=Math.max(best,Math.floor(score));
    NSStore.record({id:state.runId,difficulty:state.difficulty,score:Math.floor(score),district:state.district+1,won,time:Math.floor(state.stats.time),cycle:state.cycle});
    if(won){mode='victory';running=false;clearInput();NSStore.clearCheckpoint();NSStore.unlock('city');if(state.difficulty==='ronin')NSStore.unlock('ronin');}
    window.NSUI?.result(won);
  }
  function complete(){
    if(cleared||mode!=='playing'||P.dead)return;
    cleared=true;running=false;clearInput();
    const timeBonus=Math.max(0,Math.round(600-stageTime*3));
    const bonus=Math.round((300+stageShards*100+(stageHits===0?300:0)+timeBonus)*config().score);
    score+=bonus;NSStore.unlock('relay');if(stageHits===0)NSStore.unlock('ghost');if(stageShards===3)NSStore.unlock('collector');
    if(state.district===5){finish(true);return;}
    mode='clear';window.NSUI?.districtClear({bonus,time:stageTime,hits:stageHits,shards:stageShards});
  }
  function update(dt){
    if(mode!=='playing'||P.dead)return;
    state.stats.time+=dt;stageTime+=dt;state.stats.maxCombo=Math.max(state.stats.maxCombo,combo);
    if(noticeTime>0){noticeTime-=dt;if(noticeTime<=0)waveEl.style.opacity=0;}
    for(const r of relays)r.flash=Math.max(0,r.flash-dt);
    let active=enemies.filter(e=>!e.rewarded&&e.x+e.w>-150&&e.x<W+250).length;
    for(const plan of plans)if(!plan.spawned&&plan.x-camDist<W+120&&plan.x-camDist>-180&&active<ACTIVE_ENEMY_CAP){spawn(plan);active++;}
    for(const shard of shards)if(!shard.taken&&near(shard.x,shard.y,32)){shard.taken=true;state.stats.shards++;stageShards++;score+=Math.round(150*config().score);addRage(15);floatText(shard.x,shard.y,'DATA +'+Math.round(150*config().score),'#ffe14d');SFX.heart();}
    if(shrine&&!shrine.used&&P.hp<P.maxhp&&near(shrine.x,shrine.y,36)){shrine.used=true;P.hp=Math.min(P.maxhp,P.hp+2);SFX.heart();floatText(shrine.x,shrine.y-40,'REPAIR +2','#7bf2a7');}
    bossUpdate(dt);
    for(let i=hazards.length-1;i>=0;i--){const h=hazards[i];h.t-=dt;if(h.t<=0){h.live-=dt;if(h.live<=0){hazards.splice(i,1);continue;}if(Math.abs(P.x+P.w/2-h.x)<22)hurtPlayer(1,Math.sign(P.x-h.x)||1);}}
    if(P.dead)return;
    if(worldX()+P.w>current().length-105&&relays.every(r=>r.hp<=0)&&(!boss||boss.dead))complete();
  }
  function drawWorld(){
    const c=current();ctx.save();ctx.textAlign='center';ctx.font='bold 11px monospace';
    for(const r of relays){if(r.x<-70||r.x>W+70)continue;const live=r.hp>0;ctx.fillStyle=live?'#071c28':'#0b1423';ctx.fillRect(r.x-5,r.y+8,40,47);ctx.strokeStyle=live?c.color:'#405062';ctx.lineWidth=2;ctx.strokeRect(r.x-5,r.y+8,40,47);ctx.fillStyle=r.flash>0?'#fff':live?c.color:'#405062';ctx.fillRect(r.x+9,r.y+16,12,25);ctx.fillRect(r.x-10,GY-4,50,4);
      if(live){ctx.fillStyle='#142537';ctx.fillRect(r.x-6,r.y-12,42,4);ctx.fillStyle=c.color;ctx.fillRect(r.x-6,r.y-12,42*r.hp/r.maxhp,4);}ctx.fillText(live?'RELAY':'OFFLINE',r.x+15,r.y-23);
    }
    for(const shard of shards){if(shard.taken||shard.x<-20||shard.x>W+20)continue;const y=shard.y+(NSStore.settings.reducedMotion?0:Math.sin(bgT*3)*4);ctx.fillStyle='#ffe14d';ctx.beginPath();ctx.moveTo(shard.x,y-10);ctx.lineTo(shard.x+8,y);ctx.lineTo(shard.x,y+10);ctx.lineTo(shard.x-8,y);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff6ae';ctx.stroke();}
    if(shrine&&!shrine.used){ctx.fillStyle='#112b28';ctx.fillRect(shrine.x-18,GY-39,36,39);ctx.strokeStyle='#7bf2a7';ctx.strokeRect(shrine.x-18,GY-39,36,39);ctx.fillStyle='#7bf2a7';ctx.fillRect(shrine.x-9,GY-24,18,5);ctx.fillRect(shrine.x-2.5,GY-31,5,19);ctx.fillText('REPAIR',shrine.x,GY-50);}
    const ex=c.length-90-camDist,ready=relays.every(r=>r.hp<=0)&&(!boss||boss.dead);
    if(ex<W+100){ctx.strokeStyle=ready?'#7bf2a7':'#596478';ctx.lineWidth=3;ctx.strokeRect(ex-24,GY-120,48,120);ctx.fillStyle=ready?'rgba(123,242,167,.18)':'rgba(30,40,60,.35)';ctx.fillRect(ex-24,GY-120,48,120);ctx.fillStyle=ready?'#7bf2a7':'#bac5d8';ctx.fillText(ready?'EXTRACT →':'SIGNAL LOCK',ex,GY-138);if(!ready){ctx.font='11px monospace';ctx.fillText(boss&&!boss.dead?'Relays + guardian':'Disable 3 relays',ex,GY-154);}}
    for(const h of hazards){ctx.fillStyle=h.t>0?'rgba(255,65,91,.22)':'#ffedf5';ctx.fillRect(h.x-18,h.t>0?GY-12:40,36,h.t>0?12:GY-40);ctx.strokeStyle='#ff4166';ctx.strokeRect(h.x-18,GY-12,36,12);if(h.t>0){ctx.fillStyle='#ffb6c4';ctx.fillText('!',h.x,GY-24);}}
    ctx.restore();
  }
  function drawBoss(){
    if(!boss||boss.dead||boss.x+boss.w<-100||boss.x>W+100)return;
    const b=boss,c=current().color;ctx.save();ctx.translate(b.x+b.w/2,GY);ctx.scale(b.face,1);
    const glow=b.flash>0?'#fff':c;
    // Armoured guardian silhouette, horned mask, split coat and long energy blade.
    limb(-12,-38,-21,0,12,'#16253b');limb(13,-38,22,0,12,'#16253b');
    ctx.fillStyle='#0c1527';ctx.beginPath();ctx.moveTo(-26,-72);ctx.lineTo(24,-72);ctx.lineTo(30,-23);ctx.lineTo(5,-36);ctx.lineTo(-30,-23);ctx.closePath();ctx.fill();
    ctx.strokeStyle=glow;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=glow;ctx.fillRect(-16,-65,30,3);ctx.fillRect(-6,-56,10,13);
    limb(-20,-64,-30,-44,12,'#233149');limb(20,-64,38,-43,12,'#233149');
    ctx.fillStyle='#233149';ctx.fillRect(-17,-88,34,23);ctx.fillStyle=glow;ctx.fillRect(-12,-81,26,4);
    ctx.beginPath();ctx.moveTo(-17,-84);ctx.lineTo(-24,-103);ctx.lineTo(-7,-88);ctx.moveTo(17,-84);ctx.lineTo(24,-103);ctx.lineTo(7,-88);ctx.fill();
    limb(37,-43,70,b.state==='dash'?-44:-86,4,glow);limb(33,-40,41,-49,6,'#fff3c9');
    if(b.state==='telegraph'){ctx.fillStyle='#ffe14d';ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.fillText('!',0,-118);}
    ctx.restore();
    if(b.state==='telegraph'&&b.attack===0){ctx.fillStyle='rgba(255,100,80,.18)';ctx.fillRect(b.face>0?b.x:b.x-240,GY-50,240+b.w,50);}
  }
  return {districts,upgradeInfo,difficulty,get state(){return state;},get current(){return current();},get boss(){return boss;},get relays(){return relays;},get shards(){return shards;},get scoreFactor(){return config().score;},get progress(){return Math.max(0,Math.min(1,worldX()/current().length));},get objective(){const left=relays.filter(r=>r.hp>0);if(left.length){const nearest=left.reduce((a,b)=>Math.abs(a.x-P.x)<Math.abs(b.x-P.x)?a:b);return `${nearest.x<P.x?'←':'→'} Relays ${3-left.length}/3`; }if(boss&&!boss.dead)return `${boss.x<P.x?'←':'→'} Defeat ${boss.name}`;return '→ Reach extraction';},newRun,resume,advance,start,checkpoint,camera,shift,resize,slash,slam,rage,update,drawWorld,drawBoss,finish,complete,
    enemyKilled(){state.stats.kills++;NSStore.unlock('first');},playerHit(){state.stats.hits++;stageHits++;}
  };
})();
