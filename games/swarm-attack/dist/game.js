import * as THREE from './three.module.js';
import {HordeGame,MELEE,RANGED,ENEMIES,clamp,toward,angleDiff} from './core.mjs';
import {LEVEL,WALKABLE,ENCOUNTERS,zoneAt,clearLine} from './level.mjs';
import {buildLevel} from './world.js';

const $=id=>document.getElementById(id);
const isTouch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1;
if(isTouch)document.body.classList.add('touch');
const game=new HordeGame();
let view='isometric',muted=false,started=false,menu='ready',pitch=-.06,isoYaw=Math.PI/4;
let renderer,scene,camera,isoCamera,shoulderCamera,playerModel;
let clock=0,shake=0,flash=0,last=0,hudTime=0,toastUntil=0,hitPause=0;
let walkTime=0,locked=false,dragLook=false,mouseKnown=false;
let lookPointerId=null,touchLookX=0,touchLookY=0;
const keys=new Set(),mouse=new THREE.Vector2(0,0),raycaster=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const input={attack:false,guard:false,joyX:0,joyY:0},actors=new Map(),shotMeshes=new Map(),pickupMeshes=new Map(),effects=[],damageLabels=[];
const torchFlames=[],occluders=[];
let levelWorld,moonLight,mapVisible=true;
let listenerReady=false,audioContext,master;

const html=`
<div class="vignette"></div><div class="damage-screen" id="damage-screen"></div>
<div id="hud" hidden>
  <div class="top"><div class="brand">SWARM ATTACK<small id="area-name">PILGRIM’S GATE</small></div>
    <div class="objective-box"><span>LEVEL I · HOLLOW WAKE</span><strong id="objective">Recover the two ward seals · 0/2</strong></div>
    <div class="top-right"><button class="small-button" id="map-button" aria-label="Toggle navigation map">MAP</button><button class="small-button" id="view-button" aria-label="Switch camera view" title="Switch camera · V">ISO</button><button class="small-button" id="sound-button" aria-label="Toggle sound">SOUND</button><button class="small-button" id="pause-button" aria-label="Pause game">II</button></div>
  </div>
  <div id="crosshair" class="crosshair"></div><div id="enemy-labels"></div><div id="damage-labels"></div>
  <div class="map-frame" id="map-frame"><canvas id="minimap" width="190" height="230" aria-label="Level navigation map"></canvas><div>YOU · WARDS · BREACH</div></div><div class="boss-bar" id="boss-bar" hidden><span>THE BELLKEEPER</span><div><i id="boss-health"></i></div></div><button class="interact-prompt" id="interact-prompt" hidden></button>
  <div class="toast" id="toast" role="status"></div>
  <div class="score"><span id="score">0</span><small id="kills">0 SLAIN</small></div>
  <div class="bottom">
    <div class="orb-wrap"><div class="orb"><div class="orb-fill" id="health-fill"></div><span class="orb-value" id="health">100</span></div><div class="orb-label">LIFE</div></div>
    <div class="action-bar"><div class="weapon-row"><button class="weapon-slot active" id="melee-slot" aria-label="Equip melee weapon"><span id="melee-name">Longsword</span><small id="melee-hint">CLEAVE</small></button><button class="swap-button" id="swap" aria-label="Swap melee and ranged weapon" title="Swap weapon · F">F</button><button class="weapon-slot" id="ranged-slot" aria-label="Equip ranged weapon"><span id="ranged-name">Longbow</span><small id="ammo">24 ARROWS</small></button></div>
    <div class="skill-row"><span><b class="key">Q</b>Heavy</span><span><b class="key">SPACE</b>Dodge</span><span><b class="key">RMB</b>Guard / aim</span><span><b class="key">E</b>Heal <span id="heals">3</span></span></div></div>
    <div class="orb-wrap"><div class="orb stamina"><div class="orb-fill" id="stamina-fill"></div><span class="orb-value" id="stamina">100</span></div><div class="orb-label">STAMINA</div></div>
  </div>
  <div class="tip">WASD to move · Mouse to aim<br>Hold click to attack · Shift to sprint</div>
  <div class="touch-controls"><div class="joystick" id="joystick" aria-label="Movement joystick"><div class="stick" id="stick"></div></div><button class="small-button touch-heal" id="touch-heal">HEAL · 3</button><div class="touch-actions"><button class="touch-button heavy" id="touch-heavy">HEAVY</button><button class="touch-button guard" id="touch-guard">GUARD</button><button class="touch-button dodge" id="touch-dodge">DODGE</button><button class="touch-button attack" id="touch-attack">SLASH</button></div></div>
</div>
<div class="panel-screen" id="menu-screen"><section class="panel" aria-labelledby="menu-title">
  <p class="eyebrow" id="menu-eyebrow">LEVEL I · HOLLOW WAKE</p><h1 id="menu-title">SWARM ATTACK</h1>
  <p class="panel-description" id="menu-description">Recover two ward seals, reach the bell sanctuary,<br>and close the breach.</p>
  <div class="results" id="results" hidden></div>
  <div id="loadout"><div class="divider"></div><p class="section-label">MELEE WEAPON</p><div class="weapon-choices" id="melee-choices"></div><p class="weapon-detail" id="melee-detail"></p><p class="section-label">RANGED WEAPON</p><div class="weapon-choices ranged" id="ranged-choices"></div><p class="weapon-detail" id="ranged-detail"></p><p class="section-label">THIRD-PERSON CAMERA</p><div class="camera-choices"><button class="choice selected" data-view="isometric">Classic isometric</button><button class="choice" data-view="shoulder">Over the shoulder</button></div></div>
  <button class="primary" id="begin">ENTER THE RUINS</button>
  <p class="controls-copy controls-desktop"><strong>WASD</strong> move · <strong>Mouse</strong> aim · <strong>Click</strong> attack · <strong>F</strong> swap<br><strong>Q</strong> heavy · <strong>Space</strong> dodge · <strong>E</strong> heal · <strong>G</strong> interact</p>
  <p class="controls-copy controls-touch">Left stick to move. Attack faces nearby enemies.<br>Tap the prompt to collect wards. Drag to look in shoulder view.</p>
  <div class="panel-footer"><button class="text-button" id="menu-sound">Sound on</button><button class="text-button" id="restart" hidden>Restart run</button></div>
</section></div>`;
$('interface').innerHTML=html;
for(const [id,list]of[['melee',MELEE],['ranged',RANGED]]){
  $(id+'-choices').innerHTML=Object.entries(list).map(([key,w])=>`<button class="choice" data-${id}="${key}">${w.name}</button>`).join('');
}

function toast(s){$('toast').textContent=s;$('toast').classList.add('visible');toastUntil=clock+2.2;}
function refreshLoadout(){
  document.querySelectorAll('[data-melee]').forEach(b=>b.classList.toggle('selected',b.dataset.melee===game.melee));
  document.querySelectorAll('[data-ranged]').forEach(b=>b.classList.toggle('selected',b.dataset.ranged===game.ranged));
  $('melee-detail').textContent=MELEE[game.melee].detail;$('ranged-detail').textContent=RANGED[game.ranged].detail;
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===view));
  $('melee-name').textContent=MELEE[game.melee].name;$('ranged-name').textContent=RANGED[game.ranged].name;
}
function fatal(){const d=document.createElement('div');d.className='fatal';d.innerHTML='<div>The game could not start its 3D renderer.<br>Try a browser with WebGL 2 enabled.</div><button>Try again</button>';d.querySelector('button').onclick=()=>location.reload();document.body.append(d);}
function initAudio(){
  if(listenerReady){audioContext?.resume();return;}listenerReady=true;
  try{audioContext=new(window.AudioContext||window.webkitAudioContext)();master=audioContext.createGain();master.gain.value=muted?0:.24;master.connect(audioContext.destination);}catch{}
}
function sound(type){
  if(!audioContext||muted)return;const ac=audioContext,t=ac.currentTime;
  const data={swing:[180,70,.12,'triangle',.34],impact:[93,32,.17,'sawtooth',.3],shoot:[360,130,.09,'triangle',.4],hurt:[70,30,.24,'sawtooth',.35],block:[520,120,.16,'square',.16],dodge:[110,180,.1,'triangle',.2],heal:[370,740,.35,'sine',.3],kill:[90,30,.12,'sawtooth',.16],clear:[330,660,.45,'sine',.32],equip:[300,220,.055,'triangle',.14]}[type];
  if(!data)return;const o=ac.createOscillator(),g=ac.createGain();o.type=data[3];o.frequency.setValueAtTime(data[0],t);o.frequency.exponentialRampToValueAtTime(data[1],t+data[2]);g.gain.setValueAtTime(data[4],t);g.gain.exponentialRampToValueAtTime(.001,t+data[2]);o.connect(g);g.connect(master);o.start(t);o.stop(t+data[2]);
}

const materials={};
function mat(name,color,metalness=0,roughness=.85,emissive=0){if(!materials[name])materials[name]=new THREE.MeshStandardMaterial({color,metalness,roughness,flatShading:true,emissive});return materials[name];}
const geometries=new Map();
function geo(type,dims){const k=type+JSON.stringify(dims);if(!geometries.has(k))geometries.set(k,new THREE[type](...dims));return geometries.get(k);}
function mesh(parent,type,dims,m,x=0,y=0,z=0){const a=new THREE.Mesh(geo(type,dims),m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
const box=(p,m,w,h,d,x=0,y=0,z=0)=>mesh(p,'BoxGeometry',[w,h,d],m,x,y,z);
const ball=(p,m,r,x=0,y=0,z=0)=>mesh(p,'SphereGeometry',[r,8,6],m,x,y,z);
const cone=(p,m,r,h,x=0,y=0,z=0)=>mesh(p,'ConeGeometry',[r,h,6],m,x,y,z);
const cyl=(p,m,r1,r2,h,x=0,y=0,z=0,n=8)=>mesh(p,'CylinderGeometry',[r1,r2,h,n],m,x,y,z);
function barBetween(parent,material,a,b,r=.025){const v=new THREE.Vector3().subVectors(b,a),m=cyl(parent,material,r,r,v.length());m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}

function weapon(key){
  const g=new THREE.Group(),wood=mat('wood',0x5a3923),steel=mat('steel',0x9fa9a7,.72,.36),edge=mat('edge',0xd2d2bd,.82,.3),dark=mat('iron',0x333634,.65,.45),leather=mat('leather',0x3b241a),gold=mat('gold',0xbda06a,.75,.4);
  if(['sword','axe','mace','club'].includes(key)){
    cyl(g,leather,.043,.049,.34,0,-.04,0);ball(g,gold,.065,0,-.23,0);
    if(key==='sword'){
      box(g,gold,.39,.065,.085,0,.14,0);box(g,steel,.105,.87,.045,0,.59,0);cone(g,edge,.068,.24,0,1.145,0).scale.z=.36;
      box(g,edge,.017,.86,.049,0,.59,0);
    }else if(key==='axe'){
      cyl(g,wood,.036,.04,1.15,0,.45,0);box(g,dark,.13,.25,.12,0,.91,0);
      const a=box(g,steel,.4,.32,.07,.2,.94,0);a.rotation.z=-.25;const b=box(g,edge,.08,.37,.055,.41,.94,0);b.rotation.z=-.25;
      cone(g,steel,.1,.25,-.18,.93,0).rotation.z=Math.PI/2;
    }else if(key==='mace'){
      cyl(g,dark,.038,.045,.85,0,.32,0);ball(g,steel,.17,0,.86,0);
      for(let i=0;i<6;i++){const a=i*Math.PI/3;const c=cone(g,edge,.07,.2,Math.sin(a)*.2,.86,Math.cos(a)*.2);c.rotation.z=Math.PI/2;c.rotation.y=a;}
      cone(g,edge,.065,.19,0,1.08,0);
    }else{cyl(g,wood,.11,.06,.9,0,.47,0);cyl(g,dark,.119,.119,.085,0,.65,0);cyl(g,dark,.113,.113,.08,0,.9,0);}
  }else if(key==='bow'){
    const points=[];for(let i=0;i<=14;i++){const a=-Math.PI/2+i/14*Math.PI;points.push(new THREE.Vector3(Math.cos(a)*.29,Math.sin(a)*.7,0));}
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.028,5,false),wood));
    barBetween(g,mat('string',0xbcb298),new THREE.Vector3(0,-.7,0),new THREE.Vector3(0,.7,0),.007);box(g,leather,.05,.2,.05,.29,0,0);
  }else if(key==='crossbow'){
    box(g,wood,.095,.13,.72,0,0,-.2);box(g,dark,.48,.05,.07,0,.05,-.36);box(g,steel,.62,.035,.04,0,.05,-.41);
    barBetween(g,mat('string',0xbcb298),new THREE.Vector3(-.3,.07,-.41),new THREE.Vector3(0,.07,-.08),.007);
    barBetween(g,mat('string',0xbcb298),new THREE.Vector3(.3,.07,-.41),new THREE.Vector3(0,.07,-.08),.007);
  }else{
    barBetween(g,leather,new THREE.Vector3(0,0,0),new THREE.Vector3(.16,.47,0),.016);
    barBetween(g,leather,new THREE.Vector3(0,0,0),new THREE.Vector3(.23,.46,0),.016);
    ball(g,wood,.073,.195,.49,0);
  }return g;
}

function actor(type='player'){
  const g=new THREE.Group(),isPlayer=type==='player',brute=type==='monster',demon=type==='demon';
  const skin=mat(type+'skin',isPlayer?0xb69a73:demon?0x803830:brute?0x716566:0x858a66).clone();
  const cloth=mat(type+'cloth',isPlayer?0x45302a:demon?0x301b1b:brute?0x302b2a:0x443e2b).clone();
  const armor=mat(type+'armor',isPlayer?0x869494:0x373b37,.65,.43).clone();
  const bone=mat('bone',0xbaa784),dark=mat('void',0x171b19),belt=mat('belt',0x453523),glow=mat(type+'glow',isPlayer?0xe8c482:0xff552e,0,.5,isPlayer?0:0xc53110);
  const torso=new THREE.Group();torso.position.y=1.1;g.add(torso);
  box(torso,isPlayer?armor:skin,.61,.66,.34,0,.12,0);box(torso,cloth,.52,.32,.31,0,-.25,.015);box(torso,belt,.55,.09,.37,0,-.12,0);
  box(torso,isPlayer?mat('buckle',0xc9ad75,.7):bone,.13,.11,.03,0,-.12,-.2);
  const head=new THREE.Group();head.position.set(0,.64,-.03);torso.add(head);
  cyl(head,skin,.09,.1,.16,0,-.2,0);ball(head,isPlayer?armor:skin,.225,0,0,0).scale.set(.85,1.15,.9);
  if(isPlayer){
    box(head,dark,.33,.075,.08,0,.018,-.186);box(head,armor,.045,.33,.06,0,.016,-.22);
    box(head,armor,.05,.11,.28,0,.27,.0);box(head,belt,.28,.11,.12,0,-.17,-.095);
    box(torso,armor,.38,.4,.03,0,.22,-.188);
  }else{
    box(head,skin,.28,.1,.18,0,-.15,-.14);
    for(const side of[-1,1])ball(head,glow,.038,side*.084,.02,-.182);
    if(demon||brute){for(const side of[-1,1]){const horn=cone(head,bone,.077,.43,side*.18,.28,.035);horn.rotation.z=side*-.35;}}
    if(brute){for(let i=0;i<4;i++)cone(torso,bone,.06,.23,(i-1.5)*.15,.48,.18).rotation.x=.5;}
  }
  const arms=[],legs=[];
  for(const side of[-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.39,.36,0);torso.add(arm);arms.push(arm);
    ball(arm,isPlayer?armor:skin,.17,0,-.04,0);
    box(arm,skin,.17,.33,.18,0,-.22,0);box(arm,isPlayer?armor:cloth,.19,.21,.2,0,-.43,-.02);ball(arm,skin,.1,0,-.57,-.025);
    if(demon||brute){for(let n=0;n<3;n++){const c=cone(arm,bone,.025,.2,(n-1)*.065,-.69,-.07);c.rotation.x=Math.PI;}}
    const leg=new THREE.Group();leg.position.set(side*.16,.81,0);g.add(leg);legs.push(leg);
    box(leg,cloth,.22,.41,.26,0,-.18,0);box(leg,isPlayer?armor:skin,.185,.35,.21,0,-.48,.0);box(leg,isPlayer?belt:dark,.22,.15,.36,0,-.71,-.06);
  }
  let cape;
  if(isPlayer){
    const geoCape=new THREE.BufferGeometry();geoCape.setAttribute('position',new THREE.Float32BufferAttribute([-.26,1.48,.2,.26,1.48,.2,-.4,.48,.4,.26,1.48,.2,.42,.49,.41,-.4,.48,.4],3));geoCape.computeVertexNormals();
    cape=new THREE.Mesh(geoCape,new THREE.MeshStandardMaterial({color:0x633d2b,roughness:1,side:THREE.DoubleSide,flatShading:true}));g.add(cape);cape.castShadow=true;
    const shield=cyl(arms[0],armor,.24,.24,.07,0,-.4,-.11,10);shield.rotation.x=Math.PI/2;ball(arms[0],mat('gold',0xbda06a,.75,.4),.08,0,-.4,-.18);
  }
  if(brute)g.scale.set(1.85,1.85,1.85);else if(demon)g.scale.set(1,1.07,1);else if(!isPlayer)g.scale.set(.93,.94,.93);
  const shadow=new THREE.Mesh(geo('CircleGeometry',[brute?.95:.47,18]),new THREE.MeshBasicMaterial({color:0x050807,transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.016;g.add(shadow);
  return {g,torso,head,arms,legs,cape,skin,cloth,armor,weapon:null,type};
}
function equipVisual(){
  if(!playerModel)return;if(playerModel.weapon)playerModel.arms[1].remove(playerModel.weapon);
  const key=game.player.mode==='melee'?game.melee:game.ranged,w=weapon(key);
  w.position.set(0,-.57,-.05);w.rotation.x=-.25;playerModel.arms[1].add(w);playerModel.weapon=w;
}

function floorTexture(){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#242924';ctx.fillRect(0,0,512,512);
  let seed=442;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let row=0;row<8;row++)for(let col=-1;col<8;col++){
    const x=col*74+(row%2)*37,y=row*64,n=Math.floor(49+r()*20);ctx.fillStyle=`rgb(${n+4},${n+4},${n-3})`;ctx.fillRect(x+2,y+2,69,59);
    ctx.strokeStyle='#80827225';ctx.strokeRect(x+3,y+3,67,57);ctx.fillStyle='#090e092c';ctx.fillRect(x+3,y+58,67,3);
    if(r()>.7){ctx.strokeStyle='#22251ca0';ctx.beginPath();ctx.moveTo(x+20,y+3);ctx.lineTo(x+30,y+23);ctx.lineTo(x+23,y+43);ctx.stroke();}
  }
  for(let i=0;i<9000;i++){const n=r()>.5?'#bec3a00c':'#03090518';ctx.fillStyle=n;ctx.fillRect(r()*512,r()*512,1+r()*3,1+r()*3);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,8);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function makeWorld(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x10191b);scene.fog=new THREE.FogExp2(0x18201c,.019);
  scene.add(new THREE.HemisphereLight(0xa3b5ad,0x353020,1.85));
  moonLight=new THREE.DirectionalLight(0xb8c6c4,3.05);moonLight.position.set(-10,24,-15);moonLight.castShadow=!isTouch;moonLight.shadow.mapSize.set(1536,1536);Object.assign(moonLight.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:70});moonLight.shadow.bias=-.001;moonLight.shadow.camera.updateProjectionMatrix();scene.add(moonLight,moonLight.target);
  const warm=new THREE.DirectionalLight(0xeb9a58,1.45);warm.position.set(14,10,8);scene.add(warm);
  levelWorld=buildLevel(scene,{mat,mesh,box,ball,cone,cyl,barBetween,floorTexture,occluders,torchFlames});
  playerModel=actor();scene.add(playerModel.g);equipVisual();
  isoCamera=new THREE.OrthographicCamera(-15,15,10,-10,.1,100);shoulderCamera=new THREE.PerspectiveCamera(60,1,.1,100);camera=isoCamera;
}

function resize(){
  const w=innerWidth,h=innerHeight,aspect=w/h;renderer.setSize(w,h);renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.5:1.8));
  const half=isTouch?(aspect>1?8:12):10;
  isoCamera.left=-half*aspect;isoCamera.right=half*aspect;isoCamera.top=half*.88;isoCamera.bottom=-half*1.12;isoCamera.updateProjectionMatrix();
  shoulderCamera.aspect=aspect;shoulderCamera.updateProjectionMatrix();
}
const desired=new THREE.Vector3(),look=new THREE.Vector3(),cameraRay=new THREE.Raycaster();
function updateCamera(dt,force=false){
  const p=game.player;
  if(view==='isometric'){
    camera=isoCamera;desired.set(p.x+Math.sin(isoYaw)*17,18,p.z+Math.cos(isoYaw)*17);
    camera.position.lerp(desired,force?1:1-Math.exp(-8*dt));look.set(camera.position.x-Math.sin(isoYaw)*17,.65,camera.position.z-Math.cos(isoYaw)*17);camera.lookAt(look);
  }else{
    camera=shoulderCamera;const s=Math.sin(p.yaw),c=Math.cos(p.yaw),distance=p.aim?2.45:4.35;
    desired.set(p.x-s*distance+c*.75,2.6,p.z+c*distance+s*.75);
    const origin=new THREE.Vector3(p.x,1.6,p.z),direction=desired.clone().sub(origin),len=direction.length();cameraRay.set(origin,direction.normalize());cameraRay.far=len;
    const hits=cameraRay.intersectObjects(occluders,true);if(hits.length&&hits[0].distance<len)desired.copy(origin).addScaledVector(direction,Math.max(.75,hits[0].distance-.25));
    camera.position.lerp(desired,force?1:1-Math.exp(-18*dt));
    look.set(p.x+s*12,1.65+Math.tan(pitch)*12,p.z-c*12);camera.lookAt(look);
    camera.fov=THREE.MathUtils.lerp(camera.fov,p.aim?47:60,1-Math.exp(-7*dt));camera.updateProjectionMatrix();
  }
  if(shake>.01&&!matchMedia('(prefers-reduced-motion:reduce)').matches){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;}
  camera.updateMatrixWorld();
}
function nearestEnemy(max=15){let result=null,dist=max;const p=game.player;for(const e of game.enemies){if(e.dead||!clearLine(p.x,p.z,e.x,e.z,.05,game.gateOpen))continue;const d=Math.hypot(e.x-p.x,e.z-p.z);if(d<dist){result=e;dist=d;}}return result;}
const aimGround=new THREE.Vector3();
function getAim(){
  const p=game.player;
  if(view==='isometric'){
    if(isTouch){const e=nearestEnemy(p.mode==='ranged'?24:6);if(e)return {x:e.x,y:e.height*.58,z:e.z};return {x:p.x+Math.sin(p.yaw)*20,y:1,z:p.z-Math.cos(p.yaw)*20};}
    raycaster.setFromCamera(mouse,camera);if(raycaster.ray.intersectPlane(groundPlane,aimGround)){
      let nearest=null,dist=1.5;for(const e of game.enemies){if(e.dead)continue;const d=Math.hypot(e.x-aimGround.x,e.z-aimGround.z);if(d<dist){nearest=e;dist=d;}}
      if(nearest)return {x:nearest.x,y:nearest.height*.6,z:nearest.z};
      return {x:aimGround.x,y:1.1,z:aimGround.z};
    }
  }
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const targets=[...actors.values()].filter(a=>!a.enemy.dead).map(a=>a.g),hits=raycaster.intersectObjects(targets,true);
  if(hits.length)return hits[0].point;
  return raycaster.ray.at(35,new THREE.Vector3());
}
function aimPlayer(){
  const p=game.player;
  if(view!=='isometric')return;
  if(!isTouch&&!mouseKnown)return;
  if(isTouch&&!input.attack&&p.mode==='melee'){const movement=getMovement();if(Math.hypot(movement.x,movement.z)>.15)p.yaw=toward(movement.x,movement.z);return;}
  const a=getAim();if(a&&Math.hypot(a.x-p.x,a.z-p.z)>.15)p.yaw=toward(a.x-p.x,a.z-p.z);
}
function getMovement(){
  const x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+input.joyX;
  const z=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-input.joyY;
  const yaw=view==='isometric'?-isoYaw:game.player.yaw;
  return {x:Math.cos(yaw)*x+Math.sin(yaw)*z,z:Math.sin(yaw)*x-Math.cos(yaw)*z};
}
function clearInputs(){keys.clear();input.attack=false;input.guard=false;input.joyX=0;input.joyY=0;dragLook=false;lookPointerId=null;$('stick').style.transform='';document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));}
function unlock(){if(document.pointerLockElement)document.exitPointerLock?.();}
function lock(){if(view==='shoulder'&&!isTouch&&game.mode==='playing'){$('world').requestPointerLock?.()?.catch?.(()=>{});}}
function switchView(next){
  view=next|| (view==='isometric'?'shoulder':'isometric');
  if(view==='isometric')unlock();else if(game.mode==='playing'&&!menu)lock();
  refreshLoadout();$('view-button').textContent=view==='isometric'?'ISO':'3RD';$('crosshair').style.display=view==='shoulder'?'block':'none';
  if(camera)updateCamera(0,true);if(started&&!menu)toast(view==='isometric'?'Classic isometric view':'Over-the-shoulder view');
}
function toggleSound(){muted=!muted;if(master)master.gain.value=muted?0:.24;$('sound-button').textContent=muted?'MUTED':'SOUND';$('menu-sound').textContent=muted?'Sound off':'Sound on';}
function openMenu(kind){
  menu=kind;clearInputs();unlock();$('menu-screen').hidden=false;
  const complete=kind==='complete',dead=kind==='dead';
  $('menu-title').innerHTML=complete?'HOLLOW WAKE<br>IS SILENT':dead?'YOU HAVE<br>FALLEN':kind==='paused'?'TAKE A BREATH':'SWARM ATTACK';
  $('menu-description').innerHTML=complete?'The Bellkeeper is defeated. The breach is sealed.':dead?'Return to '+game.checkpoint.name+'. Collected wards and defeated enemies are preserved.':kind==='paused'?'Change your weapons or camera, then continue exploring.':'Recover two ward seals, reach the bell sanctuary,<br>and close the breach.';
  $('menu-eyebrow').textContent=complete?'LEVEL I · COMPLETE':dead?'LEVEL I · FALLEN':kind==='paused'?'LEVEL I · PAUSED':'LEVEL I · HOLLOW WAKE';
  $('begin').textContent=complete?'PLAY LEVEL AGAIN':dead?'RETURN TO CHECKPOINT':kind==='paused'?'CONTINUE EXPLORING':'ENTER HOLLOW WAKE';
  $('restart').hidden=kind!=='paused'&&!dead;$('restart').textContent='Restart level';$('results').hidden=!dead&&!complete;
  const minutes=Math.floor(game.elapsed/60),seconds=String(Math.floor(game.elapsed%60)).padStart(2,'0');
  $('results').innerHTML=`<div><strong>${minutes}:${seconds}</strong><small>TIME</small></div><div><strong>${game.kills}/${ENCOUNTERS.length}</strong><small>SLAIN</small></div><div><strong>${game.score.toLocaleString()}</strong><small>SCORE</small></div>`;
  $('loadout').hidden=complete;refreshLoadout();
}

function pause(){if(game.mode==='playing'){game.mode='paused';openMenu('paused');}else if(game.mode==='paused')resume();}
function resume(){menu=null;game.mode='playing';$('menu-screen').hidden=true;last=performance.now();lock();}
function startRun(){
  initAudio();clearInputs();game.start();started=true;menu=null;clock=0;toastUntil=0;
  for(const a of actors.values()){scene.remove(a.g);scene.remove(a.warning);a.warning.geometry.dispose();a.warning.material.dispose();a.label.remove();a.skin.dispose();a.cloth.dispose();a.armor.dispose();}actors.clear();
  for(const m of shotMeshes.values())scene.remove(m);shotMeshes.clear();
  for(const m of pickupMeshes.values())scene.remove(m);pickupMeshes.clear();
  for(const e of effects){scene.remove(e.mesh);e.mesh.geometry?.dispose();e.mesh.material.dispose();}effects.length=0;
  for(const d of damageLabels)d.el.remove();damageLabels.length=0;
  $('loadout').hidden=false;handleEvents();
  $('menu-screen').hidden=true;$('hud').hidden=false;equipVisual();switchView(view);updateCamera(0,true);updateHud();last=performance.now();lock();
}
function returnToCheckpoint(){
  initAudio();clearInputs();game.respawn();menu=null;$('menu-screen').hidden=true;
  for(const m of shotMeshes.values())scene.remove(m);shotMeshes.clear();
  for(const d of damageLabels)d.el.remove();damageLabels.length=0;
  for(const e of effects){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();}effects.length=0;
  equipVisual();updateCamera(0,true);updateVisuals(.016);updateHud();last=performance.now();lock();
}
function toggleMap(){mapVisible=!mapVisible;$('map-frame').hidden=!mapVisible;$('map-button').setAttribute('aria-pressed',String(mapVisible));}
function updateLevelWorld(){
  const p=game.player;
  for(const chunk of levelWorld.chunks)chunk.visible=Math.hypot(chunk.position.x-p.x,chunk.position.z-p.z)<44+chunk.userData.chunkRadius;
  for(const [id,s]of levelWorld.seals){s.g.visible=!game.seals.has(id)&&Math.hypot(s.g.position.x-p.x,s.g.position.z-p.z)<43;s.ward.rotation.y=clock*.85;s.ward.position.y=1.65+Math.sin(clock*2)*.12;}
  levelWorld.gate.visible=!game.gateOpen&&Math.hypot(p.x,p.z+56)<48;
  levelWorld.crystal.rotation.y=clock*.35;levelWorld.portal.rotation.z=clock*.12;
  levelWorld.portal.material.color.setHex(game.bossDefeated?0x98c6a2:0xb94127);levelWorld.portal.visible=game.mode!=='complete';
  const nearest=levelWorld.lights.map(l=>({l,d:Math.hypot(l.position.x-p.x,l.position.z-p.z)})).sort((a,b)=>a.d-b.d);
  nearest.forEach(({l,d},i)=>{l.visible=i<6;l.intensity=12*Math.max(0,1-d/30);});
  moonLight.position.set(p.x-10,24,p.z-15);moonLight.target.position.set(p.x,0,p.z);moonLight.target.updateMatrixWorld();
}
function drawMap(){
  if(!mapVisible)return;const c=$('minimap'),ctx=c.getContext('2d'),p=game.player,b=LEVEL.bounds;
  const scale=Math.min((c.width-28)/(b.x2-b.x1),(c.height-24)/(b.z2-b.z1));
  const ox=(c.width-(b.x2-b.x1)*scale)/2,oz=12,X=x=>ox+(x-b.x1)*scale,Z=z=>oz+(z-b.z1)*scale;
  ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#0c110f';ctx.fillRect(0,0,c.width,c.height);
  for(const area of WALKABLE){ctx.fillStyle=game.visited.has(area.id)?'#676454':'#292e27';ctx.fillRect(X(area.x1),Z(area.z1),(area.x2-area.x1)*scale,(area.z2-area.z1)*scale);}
  for(const e of game.enemies){if(e.dead||Math.hypot(e.x-p.x,e.z-p.z)>16||!clearLine(p.x,p.z,e.x,e.z,.05,game.gateOpen))continue;ctx.fillStyle=e.boss?'#ff653f':'#c15a3b';ctx.beginPath();ctx.arc(X(e.x),Z(e.z),e.boss?3:1.6,0,Math.PI*2);ctx.fill();}
  function diamond(x,z,color,r=3){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(X(x),Z(z)-r);ctx.lineTo(X(x)+r,Z(z));ctx.lineTo(X(x),Z(z)+r);ctx.lineTo(X(x)-r,Z(z));ctx.closePath();ctx.fill();}
  for(const seal of LEVEL.seals)if(!game.seals.has(seal.id))diamond(seal.x,seal.z,'#f0bf6c',3.8);
  diamond(LEVEL.shrine.x,LEVEL.shrine.z,game.shrineReached?'#a4d6ae':'#7d9c8b',3);
  diamond(LEVEL.exit.x,LEVEL.exit.z,game.bossDefeated?'#a4d6ae':'#ce6b45',4);
  if(!game.gateOpen){ctx.strokeStyle='#d0a567';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(-8),Z(-56));ctx.lineTo(X(8),Z(-56));ctx.stroke();}
  ctx.save();ctx.translate(X(p.x),Z(p.z));ctx.rotate(p.yaw);ctx.fillStyle='#fff0b8';ctx.beginPath();ctx.moveTo(0,-4.5);ctx.lineTo(3.2,3.5);ctx.lineTo(0,2);ctx.lineTo(-3.2,3.5);ctx.closePath();ctx.fill();ctx.restore();
}
function bindInput(){
  $('begin').onclick=()=>game.mode==='paused'?resume():game.mode==='dead'?returnToCheckpoint():startRun();$('restart').onclick=startRun;
  $('pause-button').onclick=pause;$('map-button').onclick=toggleMap;$('interact-prompt').onclick=()=>game.interact();$('sound-button').onclick=toggleSound;$('menu-sound').onclick=toggleSound;$('view-button').onclick=()=>switchView();
  $('swap').onclick=()=>game.toggleWeapon();
  $('melee-slot').onclick=()=>{if(game.player.mode!=='melee')game.toggleWeapon();};$('ranged-slot').onclick=()=>{if(game.player.mode!=='ranged')game.toggleWeapon();};
  document.querySelectorAll('[data-melee]').forEach(b=>b.onclick=()=>{game.setLoadout(b.dataset.melee,game.ranged);refreshLoadout();equipVisual();});
  document.querySelectorAll('[data-ranged]').forEach(b=>b.onclick=()=>{game.setLoadout(game.melee,b.dataset.ranged);refreshLoadout();equipVisual();});
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  document.addEventListener('keydown',e=>{
    if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&!menu)e.preventDefault();
    if(e.code==='Escape'){if(game.mode==='playing')pause();return;}if(e.code==='KeyP'){if(started)pause();return;}
    if(e.repeat)return;if(game.mode!=='playing')return;keys.add(e.code);
    if(e.code==='KeyG')game.interact();if(e.code==='KeyM')toggleMap();if(e.code==='KeyF')game.toggleWeapon();if(e.code==='KeyV')switchView();if(e.code==='KeyE')game.heal();
    if(e.code==='Space'){const m=getMovement();game.dodge(m.x,m.z);}
    if(e.code==='KeyQ'){aimPlayer();game.attack(true,getAim());}
    if(e.code==='KeyR'&&view==='isometric'){isoYaw+=Math.PI/2;updateCamera(0,true);}
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  document.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('pointerlockchange',()=>{const was=locked;locked=!!document.pointerLockElement;if(was&&!locked&&view==='shoulder'&&game.mode==='playing'&&!menu)pause();});
  const canvas=$('world');
  canvas.addEventListener('pointerdown',e=>{
    if(game.mode!=='playing')return;
    if(e.pointerType==='touch'){dragLook=true;lookPointerId=e.pointerId;touchLookX=e.clientX;touchLookY=e.clientY;canvas.setPointerCapture(e.pointerId);return;}
    mouseKnown=true;mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);
    if(e.button===0){input.attack=true;lock();}if(e.button===2)input.guard=true;
  });
  document.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'&&(!dragLook||e.pointerId!==lookPointerId))return;
    if(view==='shoulder'&&game.mode==='playing'&&(locked||dragLook||input.attack)){
      const touch=e.pointerType==='touch',mult=touch?.006:.0027;
      const dx=touch?e.clientX-touchLookX:(e.movementX||0),dy=touch?e.clientY-touchLookY:(e.movementY||0);
      game.player.yaw+=dx*mult;pitch=clamp(pitch-dy*mult,-.65,.45);touchLookX=e.clientX;touchLookY=e.clientY;
    }else if(e.pointerType!=='touch'){mouseKnown=true;mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);}
  });
  document.addEventListener('pointerup',e=>{if(e.pointerType==='touch'){if(e.pointerId===lookPointerId){dragLook=false;lookPointerId=null;}return;}if(e.button===0)input.attack=false;if(e.button===2)input.guard=false;});
  document.addEventListener('pointercancel',()=>clearInputs());
  const stick=$('joystick');let stickId=null;
  const moveStick=e=>{const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y),limit=r.width*.36,s=Math.min(1,limit/(d||1));input.joyX=x*s/limit;input.joyY=y*s/limit;$('stick').style.transform=`translate(${x*s}px,${y*s}px)`;};
  stick.addEventListener('pointerdown',e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===stickId)moveStick(e);});
  for(const event of['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,()=>{stickId=null;input.joyX=0;input.joyY=0;$('stick').style.transform='';});
  function touchButton(id,down,up=()=>{}){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();b.setPointerCapture(e.pointerId);b.classList.add('pressed');down();});for(const name of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,e=>{e.stopPropagation();b.classList.remove('pressed');up();});}
  touchButton('touch-attack',()=>input.attack=true,()=>input.attack=false);
  touchButton('touch-guard',()=>input.guard=true,()=>input.guard=false);
  touchButton('touch-heavy',()=>{const e=nearestEnemy(6);if(e&&view==='isometric')game.player.yaw=toward(e.x-game.player.x,e.z-game.player.z);game.attack(true,getAim());});
  touchButton('touch-dodge',()=>{const m=getMovement();game.dodge(m.x,m.z);});$('touch-heal').onclick=()=>game.heal();
  window.addEventListener('blur',()=>{if(game.mode==='playing')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.mode==='playing')pause();});
  window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(game.mode==='playing')pause();toast('Graphics paused. Reload if the scene does not return.');});
}

function particles(x,y,z,color,count=10,force=2){
  const positions=new Float32Array(count*3),velocities=[];for(let i=0;i<count;i++){positions.set([x,y,z],i*3);velocities.push([(Math.random()-.5)*force,Math.random()*force,(Math.random()-.5)*force]);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.PointsMaterial({color,size:.06,transparent:true,opacity:1,depthWrite:false});const m=new THREE.Points(geometry,material);scene.add(m);effects.push({mesh:m,kind:'particles',velocities,life:.5,total:.5});
}
function slash(heavy){
  const p=game.player,w=MELEE[game.melee],reach=w.reach;const g=new THREE.RingGeometry(reach-.17,reach,28,1,-w.arc+Math.PI/2,w.arc*2);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:heavy?0xffbd66:0xe5d5a9,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.rotation.z=p.yaw;m.position.set(p.x,.83,p.z);scene.add(m);effects.push({mesh:m,kind:'slash',life:.19,total:.19});
}
function damageNumber(e){
  if(damageLabels.length>25){damageLabels[0].el.remove();damageLabels.shift();}
  const el=document.createElement('div');el.className='float-damage'+(e.damage>=60?' heavy':'');el.textContent=e.damage;$('damage-labels').append(el);
  damageLabels.push({el,x:e.x,y:e.y+.5,z:e.z,life:.65});
}
function handleEvents(){
  for(const e of game.takeEvents()){
    if(['swing','impact','shoot','hurt','block','dodge','heal','equip'].includes(e.type))sound(e.type);
    if(e.type==='spawn'){
      const a=actor(e.enemy.type);a.enemy=e.enemy;if(e.enemy.boss){a.g.scale.multiplyScalar(1.24);a.skin.color.setHex(0x57423c);}scene.add(a.g);actors.set(e.enemy.id,a);
      a.label=document.createElement('div');a.label.className='enemy-label';a.label.innerHTML='<i><b></b></i>';$('enemy-labels').append(a.label);
      const reach=e.enemy.reach;
      a.warning=new THREE.Mesh(new THREE.RingGeometry(reach-.08,reach,40),new THREE.MeshBasicMaterial({color:0xe84b26,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false}));a.warning.rotation.x=-Math.PI/2;a.warning.visible=false;scene.add(a.warning);
    }
    if(e.type==='removeEnemy'){
      const a=actors.get(e.id);if(a){scene.remove(a.g);scene.remove(a.warning);a.warning.geometry.dispose();a.warning.material.dispose();a.label.remove();a.skin.dispose();a.cloth.dispose();a.armor.dispose();actors.delete(e.id);}
    }
    if(e.type==='equip'){equipVisual();refreshLoadout();}
    if(e.type==='swing')slash(e.heavy);
    if(e.type==='impact'){shake=e.heavy?.17:.07;hitPause=.025;flash=.12;}
    if(e.type==='enemyHit'){particles(e.x,e.y,e.z,e.enemyType==='demon'?0xe57539:0x834733,8,2);damageNumber(e);}
    if(e.type==='hurt'){shake=.23;}
    if(e.type==='block'){particles(game.player.x,1.2,game.player.z,0xffd387,16,4);toast('Blocked');}
    if(e.type==='heal'){particles(game.player.x,.8,game.player.z,0x9fc27c,20,2);toast('Life restored');}
    if(e.type==='empty')toast('Out of ammunition. Swap to melee.');
    if(e.type==='tired')toast('Recover your stamina');
    if(e.type==='pickup')toast(e.kind==='health'?'+25 life':e.kind==='cache'?'Supplies recovered. Life restored.':'Ammunition recovered');
    if(e.type==='death')openMenu('dead');if(e.type==='complete'){levelWorld.portal.visible=false;sound('clear');openMenu('complete');}
    if(['message','objective','checkpoint'].includes(e.type)){toast(e.text);if(e.type!=='message')sound('heal');}
    if(e.type==='enemyAttack'&&e.enemyType==='monster'){particles(e.x,.1,e.z,0xa99267,24,5);if(Math.hypot(e.x-game.player.x,e.z-game.player.z)<7)shake=.14;}
  }
}

function animateActor(a,state,dt){
  const isPlayer=a.type==='player',dead=state.dead,moving=isPlayer?state.speed>.1:['chase','patrol','return'].includes(state.state)&&!state.stagger;
  const phase=isPlayer?walkTime:state.age*(a.type==='demon'?10:5)+state.phase;
  a.g.position.set(state.x,isPlayer&&state.dodge>0?.1:0,state.z);a.g.rotation.y=-state.yaw;
  a.g.rotation.x=dead?-(1-state.death/.85)*Math.PI/2:0;
  a.g.position.y=dead?-.14:0;
  const swing=moving&&!dead?Math.sin(phase)*.53:Math.sin(clock*2)*.035;
  a.legs[0].rotation.x=swing;a.legs[1].rotation.x=-swing;
  a.arms[0].rotation.set(-swing*.55,0,.08);a.arms[1].rotation.set(swing*.55,0,-.08);
  a.torso.rotation.z=moving?Math.sin(phase)*.025:0;a.torso.rotation.x=0;
  if(isPlayer){
    if(state.mode==='ranged'){
      a.arms[1].rotation.x=-1.4;a.arms[0].rotation.x=-1.1;a.arms[0].rotation.y=-.65;
      if(game.ranged==='crossbow')a.arms[1].rotation.x=-.3;
      if(state.attack>0){a.arms[1].rotation.x+=Math.sin(state.attack/.23*Math.PI)*.7;}
    }else if(state.attack>0){
      const t=1-state.attack/state.attackDuration,hit=Math.sin(t*Math.PI);
      a.arms[1].rotation.x=-1.25-hit*1.2;a.arms[1].rotation.z=(state.combo%2?1:-1)*(1.4-t*2.8);a.torso.rotation.y=(state.combo%2?1:-1)*(.6-t*1.2);
      if(state.heavy){a.arms[1].rotation.z=-.2;a.arms[1].rotation.x=-3.1+t*3.8;a.torso.rotation.x=hit*.3;}
    }else{a.torso.rotation.y*=.8;}
    if(state.guard){a.arms[0].rotation.x=-1.8;a.arms[0].rotation.y=-.6;a.arms[1].rotation.x=-.8;}
    if(state.dodge>0){a.torso.rotation.x=.8;a.legs[0].rotation.x=-.7;a.legs[1].rotation.x=.8;a.g.position.y=-.3;}
    if(a.cape){a.cape.rotation.x=Math.sin(clock*4)*.035+(moving?.12:0);}
  }else if(state.state==='windup'){
    const progress=1-state.timer/state.windup;a.arms[0].rotation.x=-2.4*progress;a.arms[1].rotation.x=-2.4*progress;a.torso.rotation.x=-.2*progress;
  }else if(state.state==='recover'){a.arms[0].rotation.x=-.8;a.arms[1].rotation.x=-.8;a.torso.rotation.x=.25;}
  const strength=isPlayer?state.hitFlash>0?1:0:state.flash>0?1:0;
  a.skin.emissive.setHex(strength?0x7b3325:0);a.armor.emissive.setHex(strength?0x70412b:0);
}
function project(v){v.project(camera);return {x:(v.x*.5+.5)*innerWidth,y:(-v.y*.5+.5)*innerHeight,visible:v.z>-1&&v.z<1&&Math.abs(v.x)<1.2&&Math.abs(v.y)<1.2};}
function updateVisuals(dt){
  walkTime+=dt*(game.player.speed>5?12:8);animateActor(playerModel,game.player,dt);
  for(const a of actors.values()){
    animateActor(a,a.enemy,dt);const e=a.enemy; a.g.visible=Math.hypot(e.x-game.player.x,e.z-game.player.z)<43;const pos=project(new THREE.Vector3(e.x,e.height+.32,e.z));
    a.warning.position.set(e.x,.025,e.z);a.warning.visible=a.g.visible&&!e.dead&&e.state==='windup';a.warning.material.opacity=.3+(1-e.timer/e.windup)*.65;
    a.label.hidden=e.dead||!a.g.visible||!pos.visible||e.hp>=e.maxHp&&e.state!=='windup';
    if(!a.label.hidden){a.label.style.left=pos.x+'px';a.label.style.top=pos.y+'px';a.label.querySelector('b').style.width=Math.max(0,e.hp/e.maxHp*100)+'%';}
  }
  for(const s of game.projectiles){
    if(!shotMeshes.has(s.id)){
      let m;if(s.kind==='sling'){m=ball(scene,mat('shotstone',0xbeb298),.075);}else{
        m=new THREE.Group();cyl(m,mat('arrowwood',0xcea967),.015,.015,.7);cone(m,mat('arrowtip',0xd4d6cc,.7),.045,.15,0,.43);scene.add(m);
      }shotMeshes.set(s.id,m);
    }
    const m=shotMeshes.get(s.id);m.position.set(s.x,s.y,s.z);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(s.vx,s.vy,s.vz).normalize());
  }
  const shotIds=new Set(game.projectiles.map(s=>s.id));for(const[id,m]of shotMeshes)if(!shotIds.has(id)){scene.remove(m);shotMeshes.delete(id);}
  for(const a of game.pickups){
    if(!pickupMeshes.has(a.id)){
      const g=new THREE.Group(),m=mat(a.kind+'pickup',a.kind==='health'?0xcd5342:0xadae6c,.3,.4,a.kind==='health'?0x4b0b06:0x2e2b0c);
      if(a.kind==='health'){ball(g,m,.16,0,.22);cyl(g,mat('cork',0xd0b584),.065,.065,.13,0,.41);}else{box(g,m,.26,.28,.21,0,.22);}
      const ring=mesh(g,'RingGeometry',[.29,.34,16],new THREE.MeshBasicMaterial({color:a.kind==='health'?0xc64c35:0xc4b061,transparent:true,opacity:.6,side:THREE.DoubleSide}),0,.04);ring.rotation.x=-Math.PI/2;scene.add(g);pickupMeshes.set(a.id,g);
    }
    const m=pickupMeshes.get(a.id);m.position.set(a.x,.07+Math.sin(clock*3+a.id)*.07,a.z);m.rotation.y=clock*.7;
  }
  const pickupIds=new Set(game.pickups.map(s=>s.id));for(const[id,m]of pickupMeshes)if(!pickupIds.has(id)){scene.remove(m);pickupMeshes.delete(id);}
  for(let i=effects.length-1;i>=0;i--){
    const e=effects[i];e.life-=dt;e.mesh.material.opacity=Math.max(0,e.life/e.total)*.6;
    if(e.kind==='particles'){const a=e.mesh.geometry.attributes.position;for(let j=0;j<a.count;j++){const v=e.velocities[j];v[1]-=dt*7;a.setXYZ(j,a.getX(j)+v[0]*dt,a.getY(j)+v[1]*dt,a.getZ(j)+v[2]*dt);}a.needsUpdate=true;}
    if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1);}
  }
  for(let i=damageLabels.length-1;i>=0;i--){const d=damageLabels[i];d.life-=dt;d.y+=dt*1.8;const pos=project(new THREE.Vector3(d.x,d.y,d.z));d.el.style.left=pos.x+'px';d.el.style.top=pos.y+'px';d.el.style.opacity=Math.max(0,d.life/.65);d.el.hidden=!pos.visible;if(d.life<=0){d.el.remove();damageLabels.splice(i,1);}}
  for(let i=0;i<torchFlames.length;i++){const f=torchFlames[i];f.scale.y=1+Math.sin(clock*12+i)*.15;f.rotation.y=clock*1.5;}
  $('damage-screen').style.opacity=game.player.hitFlash*.95;
}
function updateHud(){
  const p=game.player;$('area-name').textContent=zoneAt(p.x,p.z).name.toUpperCase();$('objective').textContent=game.objective();
  const action=game.contextAction();$('interact-prompt').hidden=!action;$('interact-prompt').textContent=action?(isTouch?'TAP · ':'G · ')+action.label:'';
  const boss=game.enemies.find(e=>e.boss&&!e.dead);$('boss-bar').hidden=!boss||Math.hypot(boss.x-p.x,boss.z-p.z)>21;if(boss)$('boss-health').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
  updateLevelWorld();drawMap();
  $('health').textContent=Math.ceil(p.hp);$('health-fill').style.height=p.hp+'%';$('stamina').textContent=Math.floor(p.stamina);$('stamina-fill').style.height=p.stamina+'%';
  $('score').textContent=game.score.toLocaleString();$('kills').textContent=game.kills+' SLAIN';$('heals').textContent=p.heal;$('touch-heal').textContent='HEAL · '+p.heal;
  $('ammo').textContent=game.ranged==='sling'?'∞ STONES':p.ammo[game.ranged]+(game.ranged==='bow'?' ARROWS':' BOLTS');
  $('melee-slot').classList.toggle('active',p.mode==='melee');$('ranged-slot').classList.toggle('active',p.mode==='ranged');
  $('melee-hint').textContent=p.mode==='melee'?'EQUIPPED':'MELEE';
  $('touch-attack').textContent=p.mode==='melee'?'SLASH':'FIRE';$('touch-guard').textContent=p.mode==='melee'?'GUARD':'AIM';
  $('touch-heavy').disabled=p.mode==='ranged';
  if(clock>toastUntil)$('toast').classList.remove('visible');
  // Fade only architecture directly between the isometric camera and the player.
  const obscuring=new Set();
  if(view==='isometric'){
    const point=new THREE.Vector3(p.x,1.1,p.z),dir=point.sub(camera.position),distance=dir.length();
    cameraRay.set(camera.position,dir.normalize());cameraRay.far=distance;
    for(const hit of cameraRay.intersectObjects(occluders,true)){let group=hit.object;while(group&&!group.userData.occluder)group=group.parent;if(group)obscuring.add(group);}
  }
  for(const group of occluders){if(!group.visible)continue;const fade=obscuring.has(group);group.traverse(m=>{if(m.isMesh){m.material.opacity=fade?.2:1;m.material.depthWrite=!fade;}});}
}
function frame(now){
  requestAnimationFrame(frame);let dt=Math.min((now-last)/1000||.016,.05);last=now;
  // Interactions may finish the level between animation frames.
  handleEvents();
  if(['paused','dead','complete'].includes(game.mode)){renderer.render(scene,camera);return;}
  clock+=dt;shake*=Math.exp(-dt*13);flash=Math.max(0,flash-dt);
  if(hitPause>0){hitPause-=dt;dt*=.2;}
  if(game.mode==='playing'){
    aimPlayer();const movement=getMovement();
    game.step(dt,{...movement,sprint:keys.has('ShiftLeft')||keys.has('ShiftRight'),guard:input.guard});
    if(input.attack){aimPlayer();game.attack(false,getAim());}
    handleEvents();
  }
  updateCamera(dt);updateVisuals(dt);hudTime+=dt;if(hudTime>.07){hudTime=0;updateHud();}
  renderer.render(scene,camera);
}

function registerTools(){
  const context=document.modelContext;if(!context?.registerTool)return;
  const life=new AbortController();
  const add=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:life.signal})).catch(()=>{});}catch{}};
  add({name:'read_swarm_attack_state',description:'Read the current Swarm Attack run, equipped weapons, life, enemies, and score.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>game.getState()});
  add({name:'configure_swarm_attack_loadout',description:'Choose melee, ranged weapon, and third-person camera while the game is paused or on its start screen.',inputSchema:{type:'object',properties:{melee:{type:'string',enum:Object.keys(MELEE)},ranged:{type:'string',enum:Object.keys(RANGED)},camera:{type:'string',enum:['isometric','shoulder']}},required:['melee','ranged','camera'],additionalProperties:false},annotations:{readOnlyHint:false},execute:v=>{
    if(!v||!MELEE[v.melee]||!RANGED[v.ranged]||!['isometric','shoulder'].includes(v.camera))throw Error('Invalid loadout');
    if(game.mode==='playing')throw Error('Pause the game before changing the loadout');
    game.setLoadout(v.melee,v.ranged);switchView(v.camera);refreshLoadout();equipVisual();return {...game.getState(),camera:view};
  }});
  window.addEventListener('pagehide',()=>life.abort(),{once:true});
}

try{
  renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.shadowMap.enabled=!isTouch;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  makeWorld();resize();refreshLoadout();bindInput();updateCamera(0,true);registerTools();last=performance.now();requestAnimationFrame(frame);
}catch(error){console.error('Swarm Attack startup failed',error);fatal();}
