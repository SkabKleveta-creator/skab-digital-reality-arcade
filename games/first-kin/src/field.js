/* Playable field scenes: provider hunting and rod timing from THREE NIGHTS;
   pre-placed coordinated roles and autonomous resolution from GREAT KILL. */
const Field=(()=>{
 const roles={tracker:{name:'Tracker',desc:'Marks quarry, making the party more effective.',range:3.2,dmg:.6},longarm:{name:'Longarm',desc:'Attacks at a distance. Requires a bow.',range:4.8,dmg:1.5},spearwall:{name:'Spearwall',desc:'Holds the line and slows the quarry.',range:1.7,dmg:1.1},breaker:{name:'Breaker',desc:'Closes in and delivers the strongest strike.',range:1.6,dmg:2.4},keeper:{name:'Keeper',desc:'Uses fire to turn the quarry and exhaust it.',range:3.8,dmg:.3}};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function random(f){let a=f.seed|0;a=(a+0x6D2B79F5)|0;f.seed=a;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
 function create(s,e){const actors=e.actors.map((id,i)=>{const p=Kin.get(s,id);return{id,art:p.art,name:p.name,x:e.scene==='hunt'?3:3+i*1.7,y:9,role:i===0?'tracker':i===1?'breaker':i===2?'spearwall':i===3?'keeper':e.tools.bow>0?'longarm':'spearwall',hp:Math.max(1,Math.ceil(p.health/10)),startHp:Math.max(1,Math.ceil(p.health/10)),vigour:p.fatigue>75?.85:1,cool:0,skill:p.hand[e.scene==='fish'?'fish':'hunt']||0,path:[],step:0}});
  const f={id:e.id,scene:e.scene,seed:e.seed,time:0,actors,phase:e.scene==='party'?'plan':e.scene==='fish'?'waiting':'hunt',selected:0,prey:{x:9,y:3,hp:e.scene==='party'?8+actors.length*2:5,stamina:1,marked:false,slow:0},fires:[],caught:0,casts:0,wait:1.5,bite:0,message:e.scene==='party'?'Position the party, choose their roles, then commit.':e.scene==='fish'?'Wait for the rod to bend.':'Move through the grass. Get close enough to strike.',done:false,success:false,tools:e.tools,available:e.available,paused:false};
  if(e.available<(e.scene==='party'?4:e.scene==='hunt'?2:1)){f.done=true;f.phase='result';f.message='The grounds need time to recover. The party returns empty.'}return f;
 }
 function pass(x,y){return x>=1&&y>=1&&x<12&&y<11&&!((x===6&&y===5)||(x===3&&y===3)||(x===10&&y===7))}
 function path(sx,sy,tx,ty){sx=Math.round(sx);sy=Math.round(sy);tx=Math.round(tx);ty=Math.round(ty);if(!pass(tx,ty))return[];const q=[[sx,sy]],seen=new Set([sx+','+sy]),prev={};for(let i=0;i<q.length;i++){const[x,y]=q[i];if(x===tx&&y===ty){const out=[];let at=[x,y];while(at&&(at[0]!==sx||at[1]!==sy)){out.unshift(at);at=prev[at.join(',')]}return out}for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(pass(nx,ny)&&!seen.has(k)){seen.add(k);prev[k]=[x,y];q.push([nx,ny])}}}return[]}
 function move(a,tx,ty,dt,speed){const d=Math.hypot(tx-a.x,ty-a.y);if(d<.05)return false;const n=Math.min(d,dt*speed),nx=a.x+(tx-a.x)/d*n,ny=a.y+(ty-a.y)/d*n;if(pass(Math.round(nx),Math.round(a.y)))a.x=nx;if(pass(Math.round(a.x),Math.round(ny)))a.y=ny;a.step+=dt*9;return true}
 function tap(f,x,y){if(f.done)return;if(f.phase==='plan'){if(y<6||!pass(x,y)||f.actors.some((a,i)=>i!==f.selected&&Math.hypot(a.x-x,a.y-y)<.7)){f.message='Place each hunter on open ground south of the tracks.';return}f.actors[f.selected].x=x;f.actors[f.selected].y=y;f.message=f.actors[f.selected].name+' is in position.';return}
  if(f.scene==='hunt'&&f.phase==='hunt')f.actors[0].path=path(f.actors[0].x,f.actors[0].y,x,y);
 }
 function setRole(f,index,role){if(f.phase!=='plan'||!roles[role])return false;if(role==='longarm'&&f.actors.filter((a,i)=>a.role===role&&i!==index).length>=f.tools.bow)return false;f.actors[index].role=role;return true}
 function commit(f){if(f.phase!=='plan')return false;if(f.actors.filter(a=>a.role==='longarm').length>f.tools.bow){f.message='Equip a bow for each Longarm, or change that role.';return false}f.phase='hunt';f.time=0;f.message='The plan is committed. Watch the party work together.';return true}
 function hook(f){if(f.scene!=='fish'||f.done||f.paused)return;if(f.phase==='biting'){f.caught=Math.min(f.available,f.caught+2);f.casts++;f.phase='reeling';f.bite=.6;f.message='A catch. Food for the journey and the hearth.'}else if(f.phase==='waiting'){f.wait+=.4;f.message='Too soon. Wait for the rod to bend.'}}
 function attack(f){if(f.scene!=='hunt'||f.done||f.paused)return;const a=f.actors[0],d=Math.hypot(a.x-f.prey.x,a.y-f.prey.y),range=f.tools.bow>0?4:1.8;if(a.cool>0)return;if(d>range){f.message='Get closer. '+(f.tools.bow>0?'Bow':'Spear')+' range: '+range+' tiles.';return}a.cool=.9;f.prey.hp-=1.3+a.skill*.18;f.prey.stamina=Math.max(.1,f.prey.stamina-.12);f.message='The strike lands.';if(d<1.3)a.hp=Math.max(0,a.hp-1);if(f.prey.hp<=0)finish(f,true)}
 function finish(f,success){if(f.done)return;f.done=true;f.success=success;f.phase='result';f.message=success?(f.scene==='fish'?`${f.caught} caught. One feeds the provider; the rest go home.`:'The hunt is over. Bring food, hide and bone back to the hearth.'):'The party returns. Experience and injuries stay with them.'}
 function step(f,dt){if(f.done||f.paused||f.phase==='plan')return;dt=Math.min(.05,dt);f.time+=dt;
  if(f.scene==='fish'){if(f.phase==='waiting'){f.wait-=dt;if(f.wait<=0){f.phase='biting';f.bite=.65+f.actors[0].skill*.14+(f.tools.hook>0?.15:0);f.message='The rod bends — pull now!'}}else if(f.phase==='biting'){f.bite-=dt;if(f.bite<=0){f.casts++;f.phase='waiting';f.wait=1.2+random(f);f.message='The fish slipped away. Watch the next bite.'}}else if(f.phase==='reeling'){f.bite-=dt;if(f.bite<=0){f.phase='waiting';f.wait=1.3+random(f)}}if(f.casts>=3||f.time>=22){f.caught=Math.min(f.caught,f.available);finish(f,f.caught>0)}return}
  const prey=f.prey;prey.slow=Math.max(0,prey.slow-dt);f.fires=f.fires.filter(x=>(x.life-=dt)>0);
  f.actors.forEach(a=>{a.cool=Math.max(0,a.cool-dt);if(a.hp<=0)return;if(f.scene==='hunt'){if(a.path.length){const t=a.path[0];move(a,t[0],t[1],dt,3.0*a.vigour);if(Math.hypot(a.x-t[0],a.y-t[1])<.12)a.path.shift()}return}
   const role=roles[a.role],d=Math.hypot(a.x-prey.x,a.y-prey.y);if(a.role==='tracker'&&d<role.range)prey.marked=true;
   if(d>role.range*.8)move(a,prey.x,prey.y,dt,a.role==='spearwall'?1.5:2.1);
   if(d<=role.range&&a.cool<=0){if(a.role==='keeper'){prey.stamina=Math.max(0,prey.stamina-.25);f.fires.push({x:clamp(prey.x+1,1,11),y:prey.y,life:2})}if(a.role==='spearwall')prey.slow=1.4;
    prey.hp-=role.dmg*(prey.marked?1.35:.75)*(1+a.skill*.08);a.cool=1.4;if(d<1.5)a.hp=Math.max(0,a.hp-.8);prey.stamina=Math.max(0,prey.stamina-.04);
   }
  });
  if(prey.hp<=0){finish(f,true);return}const alive=f.actors.filter(a=>a.hp>0);if(!alive.length||f.time>65){finish(f,false);return}
  const near=alive.reduce((a,b)=>Math.hypot(a.x-prey.x,a.y-prey.y)<Math.hypot(b.x-prey.x,b.y-prey.y)?a:b);const d=Math.hypot(near.x-prey.x,near.y-prey.y);
  if(d<(f.scene==='hunt'?3.8:5.4)){prey.stamina=Math.max(0,prey.stamina-dt*.03);const dx=prey.x-near.x,dy=prey.y-near.y,n=Math.hypot(dx,dy)||1;const speed=(prey.slow?.45:1.0)*(0.3+prey.stamina*1.4);move(prey,clamp(prey.x+dx/n,1,11),clamp(prey.y+dy/n,1,10),dt,speed)}else prey.stamina=Math.min(1,prey.stamina+dt*.01);
 }
 function result(f){const injuries={};f.actors.forEach(a=>{if(a.hp<a.startHp)injuries[a.id]=Math.round((a.startHp-a.hp)*2)});if(f.scene==='fish')return{id:f.id,caught:f.caught,food:Math.max(0,f.caught-1),belly:Math.min(1,f.caught),injuries,success:f.caught>0};return{id:f.id,food:f.success?(f.scene==='party'?12:6):0,hide:f.success?(f.scene==='party'?2:1):0,bone:f.success?2:0,injuries,success:f.success}}
 return{create,step,tap,setRole,commit,hook,attack,result,finish,roles,path,pass};
})();
if(typeof module!=='undefined')module.exports=Field;
