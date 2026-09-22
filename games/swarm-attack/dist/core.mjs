import {LEVEL,OBSTACLES,ENCOUNTERS,SUPPLIES,canStand,clearLine,findPath,zoneAt} from './level.mjs';
export {OBSTACLES} from './level.mjs';
export const MELEE = {
  sword: { name: 'Longsword', detail: 'Quick, balanced sweeps', damage: 34, reach: 2.9, arc: 1.2, cooldown: .43, cost: 9 },
  axe: { name: 'Battle axe', detail: 'Wide cuts. Heavy impact.', damage: 52, reach: 2.8, arc: 1.55, cooldown: .69, cost: 15 },
  mace: { name: 'Iron mace', detail: 'Crush and stagger', damage: 47, reach: 2.6, arc: 1.05, cooldown: .57, cost: 12 },
  club: { name: 'War club', detail: 'Fast swings. Low stamina.', damage: 26, reach: 2.7, arc: 1.3, cooldown: .34, cost: 6 },
};
export const RANGED = {
  bow: { name: 'Longbow', detail: '24 arrows · steady rhythm', damage: 56, speed: 34, gravity: 1.8, cooldown: .75, capacity: 24 },
  crossbow: { name: 'Crossbow', detail: '16 bolts · high damage', damage: 92, speed: 48, gravity: .55, cooldown: 1.3, capacity: 16 },
  sling: { name: 'Sling', detail: 'Unlimited stones · fast release', damage: 29, speed: 29, gravity: 4.2, cooldown: .49, capacity: Infinity },
};
export const ENEMIES = {
  zombie: { name: 'Hollow', hp: 66, speed: 1.18, radius: .43, damage: 10, windup: .8, reach: 1.65, height: 1.75, score: 100 },
  demon: { name: 'Cinder demon', hp: 86, speed: 2.4, radius: .43, damage: 14, windup: .58, reach: 1.9, height: 1.95, score: 175 },
  monster: { name: 'Grave brute', hp: 250, speed: .87, radius: .87, damage: 28, windup: 1.25, reach: 3.15, height: 3.3, score: 450 },
};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const toward=(x,z)=>Math.atan2(x,-z);
const length=(x,z)=>Math.hypot(x,z);
let serial=1;

export class HordeGame {
  constructor(random=Math.random) {
    this.random=random;
    this.melee='sword'; this.ranged='bow';
    this.reset(); this.mode='ready';
  }
  reset() {
    this.player={...LEVEL.start,yaw:0,hp:100,stamina:100,mode:'melee',attack:0,attackDuration:0,heavy:false,combo:0,dodge:0,dodgeCooldown:0,invuln:0,guard:false,aim:false,speed:0,hitFlash:0,heal:3,ammo:{bow:24,crossbow:16,sling:Infinity}};
    this.enemies=[]; this.projectiles=[]; this.pickups=[]; this.events=[];
    this.kills=0; this.score=0; this.elapsed=0;this.level=1;
    this.seals=new Set();this.defeated=new Set();this.visited=new Set(['gate']);
    this.gateOpen=false;this.bossDefeated=false;this.checkpoint={...LEVEL.start,name:"Pilgrim’s Gate"};this.shrineReached=false;
    this.mode='playing'; this.cooldown=0; this.staminaWait=0; this.comboAge=0; this.pendingSwing=null;
  }
  start(){this.reset();for(const e of ENCOUNTERS)this.spawn(e.type,e.x,e.z,e);this.pickups=SUPPLIES.map(s=>({...s,life:Infinity}));}
  emit(type,data={}){ this.events.push({...data,type}); }
  takeEvents(){const e=this.events;this.events=[];return e;}
  setLoadout(melee,ranged){
    if(!MELEE[melee]||!RANGED[ranged])throw new Error('Unknown weapon');
    this.melee=melee;this.ranged=ranged;this.emit('equip');
  }
  toggleWeapon(){if(this.mode!=='playing')return;this.player.mode=this.player.mode==='melee'?'ranged':'melee';this.cooldown=Math.max(this.cooldown,.22);this.emit('equip');}
  spawn(type,x,z,options={}){
    const d=ENEMIES[type],p=this.player;
    if(!d||!Number.isFinite(x)||!Number.isFinite(z))throw Error('Enemies require a type and an authored position');
    const boss=!!options.boss,hp=boss?850:d.hp;
    const e={id:options.id||serial++,type,x,z,yaw:options.yaw??toward(p.x-x,p.z-z),hp,maxHp:hp,
      radius:boss?1.1:d.radius,height:boss?4.1:d.height,speed:boss?1.12:d.speed,
      state:options.patrol?.length?'patrol':'idle',timer:0,stagger:0,flash:0,age:0,phase:this.random()*6.28,
      windup:boss?1.15:d.windup,reach:boss?4.3:d.reach,damage:boss?34:d.damage,attackAngle:0,dead:false,death:0,
      home:{x,z},zone:options.zone||zoneAt(x,z).id,patrol:options.patrol||[],patrolIndex:0,aggro:options.aggro||10,alert:false,boss,name:options.name||d.name,path:[],pathTimer:0};
    this.enemies.push(e);this.emit('spawn',{enemy:e});return e;
  }
  resolve(actor){
    const r=actor.radius||.4;
    if(canStand(actor.x,actor.z,r,this.gateOpen))return;
    for(let step=.15;step<=3;step+=.15)for(let i=0;i<16;i++){
      const a=i*Math.PI/8,x=actor.x+Math.sin(a)*step,z=actor.z+Math.cos(a)*step;
      if(canStand(x,z,r,this.gateOpen)){actor.x=x;actor.z=z;return;}
    }
  }
  move(actor,dx,dz){
    const r=actor.radius||.4,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.22));
    for(let i=0;i<n;i++){if(canStand(actor.x+dx/n,actor.z+dz/n,r,this.gateOpen)){actor.x+=dx/n;actor.z+=dz/n;}
      else{if(canStand(actor.x+dx/n,actor.z,r,this.gateOpen))actor.x+=dx/n;if(canStand(actor.x,actor.z+dz/n,r,this.gateOpen))actor.z+=dz/n;}}
  }
  wake(e){
    if(e.dead||e.alert)return;e.alert=true;e.state='chase';e.path=[];e.pathTimer=0;
    for(const a of this.enemies)if(!a.dead&&a.zone===e.zone&&Math.hypot(a.x-e.x,a.z-e.z)<8){a.alert=true;if(a.state==='idle'||a.state==='patrol')a.state='chase';}
  }
  navigate(e,x,z,dt,speed){
    e.pathTimer-=dt;
    let target={x,z};
    if(!clearLine(e.x,e.z,x,z,e.radius+.06,this.gateOpen)){
      if(e.pathTimer<=0){e.path=findPath(e.x,e.z,x,z,this.gateOpen,e.radius);e.pathTimer=.9+(Number(String(e.id).length)%3)*.13;}
      while(e.path.length&&Math.hypot(e.path[0].x-e.x,e.path[0].z-e.z)<.65)e.path.shift();
      if(!e.path.length)return;target=e.path[0];
    }
    const dx=target.x-e.x,dz=target.z-e.z,n=Math.hypot(dx,dz);if(n<.12)return;
    const a=toward(dx,dz);e.yaw+=angleDiff(a,e.yaw)*Math.min(1,dt*5);this.move(e,dx/n*speed*dt,dz/n*speed*dt);
  }
  contextAction(){
    const p=this.player,near=q=>Math.hypot(p.x-q.x,p.z-q.z)<2.8;
    for(const seal of LEVEL.seals)if(!this.seals.has(seal.id)&&near(seal))return {type:'seal',id:seal.id,label:'Take '+seal.name};
    if(near(LEVEL.shrine))return {type:'shrine',label:this.shrineReached?'Shrine restored':'Rest at the shrine'};
    if(near(LEVEL.exit))return {type:'exit',label:this.bossDefeated?'Seal the breach':'Defeat the Bellkeeper'};
    return null;
  }
  interact(){
    if(this.mode!=='playing')return false;const a=this.contextAction();if(!a)return false;
    const danger=this.enemies.some(e=>!e.dead&&Math.hypot(e.x-this.player.x,e.z-this.player.z)<7&&clearLine(e.x,e.z,this.player.x,this.player.z,.1,this.gateOpen));
    if(a.type==='seal'){
      if(danger){this.emit('message',{text:'Clear the ward’s guardians first'});return false;}
      this.seals.add(a.id);this.score+=500;this.player.hp=Math.min(100,this.player.hp+25);this.player.ammo.bow=Math.min(40,this.player.ammo.bow+8);this.player.ammo.crossbow=Math.min(28,this.player.ammo.crossbow+5);
      this.gateOpen=this.seals.size===2;this.emit('objective',{text:this.gateOpen?'Both wards recovered. The cloister gate is open.':'Ward recovered. Life and ammunition restored.'});return true;
    }
    if(a.type==='shrine'&&!this.shrineReached){
      if(danger){this.emit('message',{text:'Clear nearby enemies before resting'});return false;}
      this.shrineReached=true;this.checkpoint={x:LEVEL.shrine.x,z:LEVEL.shrine.z,name:'Cloister shrine'};this.restoreResources();this.emit('checkpoint',{text:'Checkpoint reached. Life and supplies restored.'});return true;
    }
    if(a.type==='exit'){
      if(!this.bossDefeated||this.seals.size<2){this.emit('message',{text:'Defeat the Bellkeeper to close the breach'});return false;}
      if(danger){this.emit('message',{text:'Clear the sanctuary before sealing the breach'});return false;}
      this.mode='complete';this.score+=2000;this.emit('complete');return true;
    }return false;
  }
  restoreResources(){const p=this.player;p.hp=100;p.stamina=100;p.heal=3;p.ammo={bow:24,crossbow:16,sling:Infinity};}
  respawn(){
    if(this.mode!=='dead')return;this.mode='playing';Object.assign(this.player,this.checkpoint,{invuln:2,hitFlash:0,attack:0,dodge:0,dodgeCooldown:0,speed:0,guard:false,aim:false});this.restoreResources();this.pendingSwing=null;this.cooldown=0;this.projectiles=[];
    for(const e of this.enemies)if(!e.dead){Object.assign(e,e.home,{hp:e.maxHp,alert:false,state:e.patrol.length?'patrol':'idle',stagger:0,timer:0,path:[],pathTimer:0});}
    this.emit('respawn');
  }
  objective(){
    if(this.mode==='complete')return 'Hollow Wake is free of the breach.';
    if(this.seals.size<2)return `Recover the two ward seals · ${this.seals.size}/2`;
    if(!this.shrineReached)return 'Cross the bridge. Reach the cloister shrine.';
    if(!this.bossDefeated)return 'Find and defeat the Bellkeeper.';
    return 'Enter the sanctuary and seal the breach.';
  }
  dodge(dx=0,dz=0){
    const p=this.player;if(this.mode!=='playing'||p.stamina<24||p.dodgeCooldown>0)return false;
    p.stamina-=24;this.staminaWait=.65;p.dodge=.36;p.dodgeCooldown=.75;p.invuln=.4;
    if(length(dx,dz)<.1){dx=Math.sin(p.yaw);dz=-Math.cos(p.yaw);}
    const n=length(dx,dz);p.dodgeX=dx/n;p.dodgeZ=dz/n;p.guard=false;
    this.emit('dodge');return true;
  }
  heal(){const p=this.player;if(this.mode!=='playing'||p.heal<1||p.hp>=100)return false;
    p.heal--;p.hp=Math.min(100,p.hp+45);this.emit('heal');return true;}
  attack(heavy=false,aimPoint=null){
    const p=this.player;
    if(this.mode!=='playing'||this.cooldown>0||p.dodge>0||p.guard)return false;
    if(p.mode==='ranged')return this.shoot(aimPoint);
    const w=MELEE[this.melee],cost=w.cost*(heavy?2:1);
    if(p.stamina<cost){this.emit('tired');return false;}
    p.stamina-=cost;this.staminaWait=.48;this.cooldown=w.cooldown*(heavy?1.65:1);
    p.attack=this.cooldown;p.attackDuration=this.cooldown;p.heavy=heavy;
    p.combo=this.comboAge<1.2?(p.combo+1)%3:0;this.comboAge=0;
    this.emit('swing',{heavy,weapon:this.melee});
    const reach=w.reach+(heavy?.55:0),arc=w.arc+(heavy?.45:0);
    // Apply impact partway through the animation; the player can still turn.
    this.pendingSwing={time:heavy?.27:.13,reach,arc,damage:w.damage*(heavy?1.85:1),heavy,hit:false};
    return true;
  }
  strike(swing){
    const p=this.player;let count=0;
    for(const e of this.enemies){
      if(e.dead)continue;
      const dx=e.x-p.x,dz=e.z-p.z,d=length(dx,dz);
      if(d>swing.reach+e.radius)continue;
      if(d>.75&&Math.abs(angleDiff(toward(dx,dz),p.yaw))>swing.arc)continue;
      if(!clearLine(p.x,p.z,e.x,e.z,.05,this.gateOpen))continue;
      this.hurtEnemy(e,swing.damage,swing.heavy?1.3:.35);count++;
      this.move(e,Math.sin(p.yaw)*(e.boss?.06:swing.heavy?.85:.28),-Math.cos(p.yaw)*(e.boss?.06:swing.heavy?.85:.28));
    }
    if(count){this.emit('impact',{count,heavy:swing.heavy});}
  }
  shoot(aimPoint){
    const p=this.player,w=RANGED[this.ranged];
    if(p.ammo[this.ranged]<=0){this.emit('empty');return false;}
    p.ammo[this.ranged]--;this.cooldown=w.cooldown;p.attack=.23;p.attackDuration=.23;
    const x=p.x+Math.cos(p.yaw)*.25+Math.sin(p.yaw)*.5,z=p.z+Math.sin(p.yaw)*.25-Math.cos(p.yaw)*.5,y=1.5;
    let dx=Math.sin(p.yaw),dy=0,dz=-Math.cos(p.yaw);
    if(aimPoint){dx=aimPoint.x-x;dy=aimPoint.y-y;dz=aimPoint.z-z;}
    const d=Math.hypot(dx,dy,dz)||1;dx/=d;dy/=d;dz/=d;
    const shot={id:serial++,x,y,z,vx:dx*w.speed,vy:dy*w.speed,vz:dz*w.speed,life:2.5,kind:this.ranged,damage:w.damage,gravity:w.gravity};
    this.projectiles.push(shot);this.emit('shoot',{kind:this.ranged});return true;
  }
  hurtEnemy(e,amount,stagger=.1){
    if(e.dead)return;this.wake(e);e.hp-=amount;e.flash=.16;
    // Heavy blows and maces interrupt attacks; light blows only interrupt small enemies.
    if(!e.boss&&(stagger>1||this.melee==='mace'||e.type!=='monster')){e.stagger=stagger;e.state='chase';e.timer=0;}
    this.emit('enemyHit',{x:e.x,y:e.height*.6,z:e.z,damage:Math.round(amount),enemyType:e.type});
    if(e.hp<=0){
      e.dead=true;e.death=.85;this.kills++;this.score+=ENEMIES[e.type].score;
      this.defeated.add(e.id);if(e.boss){this.bossDefeated=true;this.score+=1500;this.emit('objective',{text:'The Bellkeeper has fallen. Seal the breach.'});}
      this.emit('kill',{x:e.x,z:e.z,enemyType:e.type});
      if(this.random()<.19||e.type==='monster')this.pickups.push({id:serial++,x:e.x,z:e.z,kind:this.random()<.45?'health':'ammo',life:26});
    }
  }
  hurtPlayer(amount,source){
    const p=this.player;if(p.invuln>0||this.mode!=='playing')return;
    const front=Math.abs(angleDiff(toward(source.x-p.x,source.z-p.z),p.yaw))<1.35;
    if(p.guard&&front&&p.stamina>=amount*.9){
      p.stamina-=amount*.9;this.staminaWait=.8;this.emit('block');p.invuln=.16;return;
    }
    p.hp=Math.max(0,p.hp-amount);p.hitFlash=.45;p.invuln=.48;this.emit('hurt',{amount});
    if(p.hp<=0){this.mode='dead';this.emit('death');}
  }
  step(dt,input={}){
    if(this.mode!=='playing')return;
    dt=Math.min(dt,.05);this.elapsed+=dt;this.comboAge+=dt;
    const p=this.player;this.cooldown=Math.max(0,this.cooldown-dt);this.staminaWait=Math.max(0,this.staminaWait-dt);
    p.attack=Math.max(0,p.attack-dt);p.invuln=Math.max(0,p.invuln-dt);p.hitFlash=Math.max(0,p.hitFlash-dt);
    p.dodgeCooldown=Math.max(0,p.dodgeCooldown-dt);
    p.guard=!!input.guard&&p.mode==='melee'&&p.dodge<=0&&p.attack<=0&&p.stamina>2;
    p.aim=!!input.guard&&p.mode==='ranged';
    let dx=input.x||0,dz=input.z||0,n=length(dx,dz);if(n>1){dx/=n;dz/=n;}
    let speed=p.guard?2.1:p.aim?2.5:input.sprint&&p.stamina>2&&n>.1?6.4:4.05;
    if(p.attack>0&&p.mode==='melee')speed*=.65;
    p.speed=n>.1?speed:0;
    if(p.dodge>0){p.dodge-=dt;this.move(p,p.dodgeX*12*dt,p.dodgeZ*12*dt);}
    else{this.move(p,dx*speed*dt,dz*speed*dt);}
    this.visited.add(zoneAt(p.x,p.z).id);
    if(speed>6&&n>.1&&p.dodge<=0){p.stamina=Math.max(0,p.stamina-dt*16);this.staminaWait=.25;}
    else if(this.staminaWait===0&&!p.guard){p.stamina=Math.min(100,p.stamina+dt*24);}
    if(this.pendingSwing){this.pendingSwing.time-=dt;if(this.pendingSwing.time<=0){this.strike(this.pendingSwing);this.pendingSwing=null;}}
    for(let i=this.enemies.length-1;i>=0;i--){
      const e=this.enemies[i],d=ENEMIES[e.type];e.age+=dt;e.flash=Math.max(0,e.flash-dt);
      if(e.dead){e.death-=dt;if(e.death<=0){this.enemies.splice(i,1);this.emit('removeEnemy',{id:e.id});}continue;}
      if(e.stagger>0){e.stagger-=dt;continue;}
      const ex=p.x-e.x,ez=p.z-e.z,dist=length(ex,ez),angle=toward(ex,ez);
      if(!e.alert&&dist<e.aggro&&clearLine(e.x,e.z,p.x,p.z,.05,this.gateOpen))this.wake(e);
      if(!e.alert){
        if(e.patrol.length&&dist<42){const q=e.patrol[e.patrolIndex];if(Math.hypot(e.x-q[0],e.z-q[1])<.7)e.patrolIndex=(e.patrolIndex+1)%e.patrol.length;this.navigate(e,q[0],q[1],dt,e.speed*.45);}
        continue;
      }
      if(dist>28||Math.hypot(e.x-e.home.x,e.z-e.home.z)>34){e.state='return';}
      if(e.state==='return'){
        this.navigate(e,e.home.x,e.home.z,dt,e.speed*1.2);
        if(Math.hypot(e.x-e.home.x,e.z-e.home.z)<1){e.alert=false;e.state=e.patrol.length?'patrol':'idle';e.path=[];}continue;
      }
      const reach=e.reach;
      if(e.state==='windup'){
        e.timer-=dt;
        if(e.timer<=0){
          const within=dist<reach+.45&&clearLine(e.x,e.z,p.x,p.z,.05,this.gateOpen);
          const facing=Math.abs(angleDiff(angle,e.attackAngle))<(e.type==='monster'?Math.PI:1.25);
          if(within&&facing)this.hurtPlayer(e.damage,e);
          this.emit('enemyAttack',{x:e.x,z:e.z,enemyType:e.type});e.state='recover';e.timer=e.type==='monster'?1.45:.95;
        }
      }else if(e.state==='recover'){e.timer-=dt;if(e.timer<=0)e.state='chase';}
      else{
        e.yaw+=angleDiff(angle,e.yaw)*Math.min(1,dt*5);
        if(dist<reach&&clearLine(e.x,e.z,p.x,p.z,.05,this.gateOpen)){e.state='windup';e.timer=e.windup*(e.boss&&e.hp<e.maxHp*.5?.85:1);e.attackAngle=angle;e.yaw=angle;}
        else{
          let tx=p.x,tz=p.z;
          if(e.type==='demon'&&dist>4&&dist<11){const side=Math.sin(e.phase+e.age*.6)*2;const x=p.x+Math.cos(angle)*side,z=p.z+Math.sin(angle)*side;if(canStand(x,z,e.radius,this.gateOpen)){tx=x;tz=z;}}
          this.navigate(e,tx,tz,dt,e.speed*(e.boss&&e.hp<e.maxHp*.5?1.3:1));
        }
      }
      for(let j=0;j<i;j++){
        const other=this.enemies[j];if(other.dead)continue;
        const sx=e.x-other.x,sz=e.z-other.z,sep=length(sx,sz),min=e.radius+other.radius;
        if(sep<min&&sep>.001){const push=(min-sep)*.5;this.move(e,sx/sep*push,sz/sep*push);this.move(other,-sx/sep*push,-sz/sep*push);}
      }
      if(dist<e.radius+.35&&p.dodge<=0){const s=(e.radius+.35-dist)*.5;this.move(e,-ex/(dist||1)*s,-ez/(dist||1)*s);}
    }
    for(let i=this.projectiles.length-1;i>=0;i--){
      const s=this.projectiles[i],ox=s.x,oy=s.y,oz=s.z;
      s.vy-=s.gravity*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;s.life-=dt;
      let hit=!clearLine(ox,oz,s.x,s.z,.025,this.gateOpen);
      for(const e of this.enemies){
        if(hit)break;
        if(e.dead)continue;
        const dx=s.x-ox,dy=s.y-oy,dz=s.z-oz;
        const t=clamp(((e.x-ox)*dx+(e.height*.57-oy)*dy+(e.z-oz)*dz)/(dx*dx+dy*dy+dz*dz||1),0,1);
        const px=ox+dx*t,pz=oz+dz*t,py=oy+dy*t;
        if(length(px-e.x,pz-e.z)<e.radius+.16&&py>.15&&py<e.height+.12){
          const headshot=py>e.height*.8;this.hurtEnemy(e,s.damage*(headshot?1.5:1),s.kind==='crossbow'?.8:.25);this.emit('impact',{heavy:headshot,ranged:true});hit=true;break;
        }
      }
      if(hit||s.life<=0||s.y<0){this.projectiles.splice(i,1);this.emit('removeProjectile',{id:s.id});}
    }
    for(let i=this.pickups.length-1;i>=0;i--){
      const a=this.pickups[i];a.life-=dt;
      if(length(a.x-p.x,a.z-p.z)<1.35){
        if(a.kind==='health'){p.hp=Math.min(100,p.hp+25);}else{p.ammo.bow=Math.min(40,p.ammo.bow+(a.kind==='cache'?12:8));p.ammo.crossbow=Math.min(28,p.ammo.crossbow+(a.kind==='cache'?8:5));if(a.kind==='cache'){p.hp=Math.min(100,p.hp+25);p.heal=Math.min(3,p.heal+1);}}
        this.emit('pickup',{kind:a.kind});this.pickups.splice(i,1);
      }else if(a.life<=0)this.pickups.splice(i,1);
    }
    if(!this.shrineReached&&this.gateOpen&&Math.hypot(p.x-LEVEL.shrine.x,p.z-LEVEL.shrine.z)<2.8&&!this.enemies.some(e=>!e.dead&&Math.hypot(e.x-p.x,e.z-p.z)<7))this.interact();
  }
  getState(){return {status:this.mode,level:this.level,area:zoneAt(this.player.x,this.player.z).name,objective:this.objective(),seals:this.seals.size,gateOpen:this.gateOpen,bossDefeated:this.bossDefeated,checkpoint:this.checkpoint.name,kills:this.kills,score:this.score,health:Math.ceil(this.player.hp),stamina:Math.ceil(this.player.stamina),enemies:this.enemies.filter(e=>!e.dead).length,melee:this.melee,ranged:this.ranged,active:this.player.mode};}
}
