
(()=>{
  'use strict';
  const C=document.getElementById('game'),visual=new NightRenderer(C);
  const W=320,H=288,T=16,WORLD_W=1280,WORLD_H=576;
  const PAL={ink:'#171528',night:'#201b32',deep:'#32264d',mid:'#655584',mist:'#8e99a6',bone:'#f6d365',blood:'#d83b52',darkblood:'#8c283e',teal:'#4ea699',green:'#78a552',skin:'#d79b72',white:'#f8eed1'};
  const keys={left:false,right:false,up:false,down:false,jump:false,attack:false};
  const pressed={}; let state='select',choice=0,tick=0,shake=0,banner=0,message='',msgTimer=0;
  const roster=[
    {name:'VAMPIRE',color:'#c9445b',accent:'#eee2ca',speed:1.65,jump:5.25,max:8,special:'CRIMSON RISE',desc:'UPWARD BLOOD DASH',passive:'HEALS ON EVERY KILL'},
    {name:'WEREWOLF',color:'#9a775f',accent:'#f6d365',speed:1.8,jump:5.6,max:8,special:'MOON POUNCE',desc:'RIPPING AIR LEAP',passive:'HEAVY CLAW DAMAGE'},
    {name:'ZOMBIE',color:'#78a552',accent:'#b9d870',speed:1.25,jump:4.8,max:9,special:'GRAVE BURST',desc:'DECAYING BODY BLAST',passive:'TAKES LESS DAMAGE'},
    {name:'REPTILIAN',color:'#4ea699',accent:'#d3f0b6',speed:1.55,jump:5.15,max:8,special:'PREDATOR LASH',desc:'VERTICAL TONGUE STRIKE',passive:'CLIMBS FASTEST'}
  ];
  let levelIndex=0,level=NIGHT_LEVELS[0],visited={},transitionLock=0;
  let roomNames=[],platforms=[],climbables=[],breakables=[],elevator;
  let p,enemies=[],pickups=[],particles=[],slashes=[],camera={x:0,y:288},room=0,kills=0,secrets=0;

  function resetWorld(){visited={};loadLevel(0,1,true);}
  function stashLevel(){visited[levelIndex]={enemies,pickups,breakables,elevator,kills,secrets};}
  function loadLevel(index,direction=1,retry=false){
    levelIndex=index;level=NIGHT_LEVELS[index];roomNames=level.rooms;
    platforms=[{x:0,y:552,w:WORLD_W,h:24},...level.platforms.map(([x,y,w])=>({x,y,w,h:12}))];
    climbables=level.climbs.map(([x,y,h,type])=>({x,y,w:10,h,type}));
    const previousHP=p?.hp,r=roster[choice],saved=visited[index];
    if(saved&&!retry){({enemies,pickups,breakables,elevator,kills,secrets}=saved);}
    else{
      enemies=level.enemies.map(([x,floor,type])=>enemy(x,floor-(type==='boss'?32:24),type,Math.min(3,Math.floor(x/320))));
      breakables=level.caches.map(([x,y,secret])=>({x,y,w:16,h:32,hp:2,secret,dead:false}));
      pickups=level.health.map(([x,y])=>({x,y,w:10,h:10,heal:2,secret:false,t:0}));
      const [x,min,max,speed]=level.elevator;elevator={x,y:max,w:48,h:9,min,max,vy:-speed};kills=0;secrets=0;
    }
    p={x:direction>0?38:WORLD_W-46,y:528,w:12,h:24,vx:0,vy:0,ground:true,climb:false,face:direction,
      hp:retry?r.max:Math.min(r.max,previousHP+(!saved?2:0)),max:r.max,inv:0,spawnSafe:180,arrival:true,attack:0,special:0,combo:0,comboT:0};
    particles=[];slashes=[];shake=0;room=direction>0?0:3;camera={x:direction>0?0:WORLD_W-W,y:288};transitionLock=45;
    banner=150;message='HUMANS ARE HUNTING YOU';msgTimer=150;state='play';
    const label=document.querySelector?.('.mast span');if(label)label.textContent=`Level ${level.numeral} · ${level.name}`;
  }
  function travel(direction){
    stashLevel();const next=levelIndex+direction;
    if(next>=NIGHT_LEVELS.length){state='win';return;}
    if(next>=0)loadLevel(next,direction);
  }
  function enemy(x,y,type,room){const base=type==='boss'?10:type==='zealot'?3:2,hp=type==='boss'?base+levelIndex*4:base+Math.floor(levelIndex/2);
    return{x,y,w:type==='boss'?20:12,h:type==='boss'?32:24,vx:0,vy:0,hp,max:hp,speed:(type==='boss'?.62:.72)+levelIndex*.13,
      damage:type==='boss'&&levelIndex>0?2:1,type,room,face:-1,ground:false,climb:false,hurt:0,dead:false,attack:0,windup:0,alert:false,jumpWait:0};}
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function edge(a,b){return a&&!b}
  function down(k){return keys[k]}

  function start(){if(!visual.ready)return;resetWorld();state='play';sound(90,.06,'sawtooth');}
  function update(){
    tick++;
    if(state==='select'){
      if(edge(keys.left,pressed.left)||edge(keys.up,pressed.up)) choice=(choice+3)%4;
      if(edge(keys.right,pressed.right)||edge(keys.down,pressed.down)) choice=(choice+1)%4;
      if(edge(keys.attack,pressed.attack)||edge(keys.jump,pressed.jump)) start();
    }else if(state==='play') updatePlay();
    else if(state==='dead'&&(edge(keys.attack,pressed.attack)||edge(keys.jump,pressed.jump))){loadLevel(levelIndex,1,true);}
    else if(state==='win'&&(edge(keys.attack,pressed.attack)||edge(keys.jump,pressed.jump))){state='select';}
    Object.assign(pressed,keys);
  }
  function updatePlay(){
    const r=roster[choice];if(banner>0)banner--;if(msgTimer>0)msgTimer--;if(shake>0)shake--;
    if(Object.values(keys).some(Boolean))p.arrival=false;
    p.inv=Math.max(0,p.inv-1);if(!p.arrival)p.spawnSafe=Math.max(0,p.spawnSafe-1);p.attack=Math.max(0,p.attack-1);p.special=Math.max(0,p.special-1);p.comboT=Math.max(0,p.comboT-1);if(!p.comboT)p.combo=0;
    transitionLock=Math.max(0,transitionLock-1);
    const height=down('down')&&p.ground&&!p.climb?16:24;p.y+=p.h-height;p.h=height;
    let move=(down('right')?1:0)-(down('left')?1:0);if(move)p.face=move;
    const climb=nearestClimb(p);
    if((down('up')||down('down'))&&climb&&(!p.ground||down('up'))){p.climb=true;p.x+=(climb.x+climb.w/2-(p.x+p.w/2))*.22;}
    if(p.climb){
      p.vy=((down('down')?1:0)-(down('up')?1:0))*(choice===3?2.15:1.55);p.vx=move*r.speed*.65;
      if(!climb||edge(keys.jump,pressed.jump)){p.climb=false;if(edge(keys.jump,pressed.jump))p.vy=-r.jump;}
    }else{
      p.vx+=move*.32;p.vx*=p.ground?.78:.91;p.vx=clamp(p.vx,-r.speed,r.speed);
      if(edge(keys.jump,pressed.jump)&&p.ground){p.vy=-r.jump;p.ground=false;sound(180,.04,'square');}
      p.vy=Math.min(6,p.vy+.28);
    }
    if(keys.attack&&p.attack===0&&p.special===0){down('up')?useSpecial():attack(false);}
    const old={x:p.x,y:p.y};p.x+=p.vx;p.y+=p.vy;p.ground=false;solidY(p,old);
    p.x=clamp(p.x,0,WORLD_W-p.w);if(p.y>WORLD_H+40)hurtPlayer(99);
    elevator.y+=elevator.vy;if(elevator.y<elevator.min||elevator.y>elevator.max){elevator.vy*=-1;elevator.y=clamp(elevator.y,elevator.min,elevator.max)}
    if(p.vy>=0&&p.x+p.w>elevator.x&&p.x<elevator.x+elevator.w&&p.y+p.h>=elevator.y&&p.y+p.h<=elevator.y+8){p.y=elevator.y-p.h;p.vy=0;p.ground=true;}
    updateEnemies();updateCombat();updateParticles();
    pickups=pickups.filter(q=>{if(overlap(p,q)){p.hp=Math.min(p.max,p.hp+q.heal);message=q.secret?'SECRET BLOOD CACHE':'VITALITY RESTORED';msgTimer=75;sound(420,.12,'square');return false}q.t++;return true});
    room=Math.min(3,Math.floor((p.x+24)/320));
    const tx=clamp(p.x+p.w/2-W/2,0,WORLD_W-W),ty=clamp(p.y+p.h/2-H/2,0,WORLD_H-H);
    camera.x+=(tx-camera.x)*.09;camera.y+=(ty-camera.y)*.09;
    if(p.hp<=0){state='dead';sound(45,.5,'sawtooth')}
    else if(!transitionLock){if(p.x+p.w>=WORLD_W&&keys.right)travel(1);else if(p.x<=0&&keys.left&&levelIndex>0)travel(-1);}
  }
  function nearestClimb(a){return climbables.find(c=>a.x+a.w>c.x-8&&a.x<c.x+c.w+8&&a.y+a.h>c.y&&a.y<c.y+c.h)}
  function solidY(a,old){
    if(!a.climb)for(const s of platforms){if(overlap(a,s)&&old.y+a.h<=s.y&&a.vy>=0){a.y=s.y-a.h;a.vy=0;a.ground=true;}}
  }
  function attack(special){p.attack=special?18:12;slashes.push({x:p.face>0?p.x+p.w-2:p.x-18,y:p.y+5,w:20,h:15,life:special?12:6,damage:choice===1?2:1,face:p.face,special:false});sound(110,.05,'square');}
  function useSpecial(){
    p.special=36;const type=choice;
    if(type===0){p.vy=-7.4;p.vx=p.face*2.2;slashes.push({x:p.x-7,y:p.y-24,w:26,h:52,life:18,damage:2,face:p.face,special:true});burst(p.x,p.y+10,PAL.blood,12);}
    if(type===1){p.vy=-6.2;p.vx=p.face*5.2;slashes.push({x:p.face>0?p.x:p.x-28,y:p.y-7,w:40,h:34,life:20,damage:3,face:p.face,special:true});}
    if(type===2){slashes.push({x:p.x-35,y:p.y-24,w:82,h:68,life:24,damage:2,face:p.face,special:true});burst(p.x+6,p.y+10,PAL.green,18);}
    if(type===3){slashes.push({x:p.x-5,y:p.y-70,w:22,h:82,life:20,damage:3,face:p.face,special:true});p.vy=-3.7;burst(p.x+5,p.y-6,PAL.teal,12);}
    sound(type===2?55:150,.16,'sawtooth');
  }
  function updateCombat(){
    slashes.forEach(s=>{
      s.life--;s.x+=s.special&&choice===1?p.face*2.5:0;
      enemies.forEach(e=>{if(!e.dead&&!e.hurt&&overlap(s,e)){e.hp-=s.damage;e.hurt=12;e.vx=p.face*(s.special?3.2:1.8);e.vy=-1.8;burst(e.x+e.w/2,e.y+e.h/2,PAL.blood,s.special?18:9);shake=s.special?7:3;s.hit=true;if(e.hp<=0)killEnemy(e);}});
      breakables.forEach(b=>{if(!b.dead&&overlap(s,b)){b.hp-=s.damage;burst(b.x+8,b.y+20,PAL.mist,8);if(b.hp<=0){b.dead=true;secrets+=b.secret?1:0;pickups.push({x:b.x+(b.x<800?22:-18),y:b.y+18,w:10,h:10,heal:2,secret:b.secret,t:0});message=b.secret?'SECRET CACHE REVEALED':'CACHE SHATTERED';msgTimer=90;sound(60,.14,'square')}}});
    });slashes=slashes.filter(s=>s.life>0);
  }
  function killEnemy(e){if(e.dead)return;e.dead=true;kills++;p.combo++;p.comboT=150;burst(e.x+e.w/2,e.y+e.h/2,PAL.blood,e.type==='boss'?48:26);parts(e);sound(e.type==='boss'?50:75,e.type==='boss'?.5:.15,'sawtooth');if(choice===0)p.hp=Math.min(p.max,p.hp+1);if(kills%3===0||e.type==='boss')pickups.push({x:e.x,y:Math.max(250,e.y+e.h-14),w:10,h:10,heal:e.type==='boss'?4:2,secret:false,t:0});if(e.type==='boss'){message='HUMAN COMMANDER DEFEATED';msgTimer=120;}}
  function parts(e){for(let i=0;i<(e.type==='boss'?8:4);i++)particles.push({x:e.x+e.w/2,y:e.y+e.h/2,vx:(Math.random()-.5)*4,vy:-Math.random()*4-1,life:45+Math.random()*35,color:i%2?PAL.darkblood:PAL.blood,size:3+Math.random()*4,gore:true});}
  function hurtPlayer(d){if(p.inv>0||p.spawnSafe>0||p.arrival)return;p.hp-=choice===2?Math.max(1,d-1):d;p.inv=94;p.vx=-p.face*2.6;p.vy=-3.2;shake=9;burst(p.x+6,p.y+12,PAL.blood,14);sound(55,.18,'square');}
  function burst(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*3.5,vy:(Math.random()-.8)*3.5,life:18+Math.random()*24,color,size:1+Math.random()*2,gore:false});}
  function updateParticles(){particles.forEach(a=>{a.x+=a.vx;a.y+=a.vy;a.vy+=a.gore?.16:.07;a.vx*=.98;a.life--});particles=particles.filter(a=>a.life>0)}
  function updateEnemies(){
    for(const e of enemies){
      if(e.dead)continue;e.hurt=Math.max(0,e.hurt-1);e.attack=Math.max(0,e.attack-1);e.jumpWait=Math.max(0,e.jumpWait-1);
      const dx=p.x+p.w/2-e.x-e.w/2,dy=p.y+p.h-e.y-e.h;
      if(!p.arrival&&Math.abs(dx)<300+levelIndex*35&&Math.abs(dy)<300)e.alert=true;
      if(e.hurt){e.windup=0;e.climb=false;e.vx*=.88;}
      else if(e.windup){
        e.vx=0;e.windup--;
        if(e.windup===0){
          const hit={x:e.face>0?e.x+e.w-3:e.x-23,y:e.y+4,w:26,h:e.h-4};
          if(overlap(hit,p))hurtPlayer(e.damage);
          e.attack=78-levelIndex*10;
        }
      }else if(e.alert&&!p.arrival){
        let target=p.x+p.w/2;
        // Route upward through nearby ladders, chains, and vines.
        if(dy<-28||(e.climb&&dy<0)){
          const routes=climbables.filter(c=>c.y<=p.y+p.h+12&&c.y+c.h>=e.y+e.h-16);
          routes.sort((a,b)=>Math.abs(a.x-e.x)+Math.abs(a.x-p.x)*.35-Math.abs(b.x-e.x)-Math.abs(b.x-p.x)*.35);
          const route=routes[0];
          if(route){target=route.x+route.w/2;if(Math.abs(target-e.x-e.w/2)<9){e.climb=true;e.x=target-e.w/2;e.vy=-1.15-levelIndex*.12;}}
          else if(e.ground&&!e.jumpWait&&Math.abs(dx)<110){e.vy=-5.9;e.jumpWait=50;}
        }else if(e.climb){e.climb=false;e.vy=-2;}
        if(dy>32&&e.ground){
          const floor=platforms.find(q=>Math.abs(e.y+e.h-q.y)<2&&e.x+e.w>q.x&&e.x<q.x+q.w&&q.y<552);
          if(floor)target=Math.abs(p.x-floor.x)<Math.abs(p.x-(floor.x+floor.w))?floor.x-e.w-8:floor.x+floor.w+e.w+8;
        }
        const move=Math.sign(target-e.x-e.w/2);e.face=move||e.face;
        if(!e.climb)e.vx=clamp(e.vx+move*.13,-e.speed,e.speed);else e.vx=0;
        if(!e.climb&&!e.attack&&Math.abs(dx)<27&&Math.abs(dy)<22){e.face=dx>=0?1:-1;e.windup=24-levelIndex*3;e.vx=0;}
      }else {e.vx*=.85;e.climb=false;}
      if(e.climb&&!nearestClimb(e)){e.climb=false;e.vy=-2;}
      const old={x:e.x,y:e.y};if(!e.climb)e.vy=Math.min(6,e.vy+.28);e.x=clamp(e.x+e.vx,8,WORLD_W-e.w-8);e.y+=e.vy;e.ground=false;solidY(e,old);
      if(e.y>WORLD_H){e.y=552-e.h;e.vy=0;e.climb=false;}
    }
  }

  function draw(){const totals=Object.entries(visited).filter(([i])=>Number(i)!==levelIndex).reduce((a,[,v])=>({kills:a.kills+v.kills,secrets:a.secrets+v.secrets}),{kills,secrets});visual.render({state,choice,tick,shake,banner,message,msgTimer,p,enemies,pickups,particles,slashes,camera,room,kills,secrets,roster,roomNames,platforms,climbables,breakables,elevator,keys,level,levelIndex,totals});}

  if(window.location.hash==='#test'){
    window.__nightHuntTest={
      startAs(i=0){choice=clamp(i,0,3);start();},
      step(frames,input={}){Object.assign(keys,{left:false,right:false,up:false,down:false,jump:false,attack:false},input);for(let i=0;i<frames;i++)update();Object.assign(keys,{left:false,right:false,up:false,down:false,jump:false,attack:false});},
      primePrey(){const e=enemies.find(o=>!o.dead&&o.type!=='boss');e.x=p.x+p.w;e.y=p.y;e.hp=1;e.hurt=0;e.vx=0;},
      snapshot(){return{state,choice,levelIndex,level:level.name,hp:p.hp,max:p.max,x:Math.round(p.x),y:Math.round(p.y),kills,spawnSafe:p.spawnSafe,enemiesAlive:enemies.filter(o=>!o.dead).length,hasRangedAttack:false,special:p.special,climbing:p.climb};}
    };
  }
  let audio;
  function sound(freq,dur,type){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.value=freq;v.gain.setValueAtTime(.045,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+dur)}catch(e){}}
  const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',z:'attack',Z:'attack',x:'jump',X:'jump',Enter:'attack',' ':'jump'};
  addEventListener('keydown',e=>{const k=map[e.key];if(k){keys[k]=true;e.preventDefault()}});addEventListener('keyup',e=>{const k=map[e.key];if(k){keys[k]=false;e.preventDefault()}});addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
  document.querySelectorAll('[data-input]').forEach(b=>{
    const k=b.dataset.input,held=new Set();
    const sync=()=>{keys[k]=held.size>0;b.classList.toggle('on',keys[k]);};
    const on=e=>{e.preventDefault();held.add(e.pointerId);b.setPointerCapture(e.pointerId);sync();};
    const off=e=>{e.preventDefault();held.delete(e.pointerId);sync();};
    b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);
    b.addEventListener('pointercancel',off);b.addEventListener('lostpointercapture',off);
    b.addEventListener('contextmenu',e=>e.preventDefault());
    addEventListener('blur',()=>{held.clear();sync();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();sync();}});
  });
  C.addEventListener('pointerdown',e=>{if(state!=='select')return;e.preventDefault();const r=C.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;for(let i=0;i<4;i++){const cx=14+i%2*153,cy=58+Math.floor(i/2)*92;if(x>=cx&&x<=cx+139&&y>=cy&&y<=cy+78)choice=i;}if(x>=54&&x<=266&&y>=244&&y<=271)start();});
  let last=0,acc=0;function frame(t){acc+=Math.min(40,t-last);last=t;while(acc>=1000/60){update();acc-=1000/60}draw();requestAnimationFrame(frame)}requestAnimationFrame(t=>{last=t;frame(t)});
})();
