/* FIRST KIN simulation. TEACH's head/hand and two-slot camp loop, THREE
   NIGHTS' provider/belly distinction, GREAT KILL's shared party outcomes. */
const Kin = (()=>{
 const skillNames={fire:'Firecraft',root:'Root gathering',green:'Foraging',fish:'Fishing',hunt:'Hunting',craft:'Crafting',warm:'Clothing',farm:'Growing',scout:'Wayfinding'};
 const buildings={
  trail:{name:'Path',cost:{stone:1},work:0,desc:'Connect buildings to the hearth. Paths reduce carrying effort.'},
  hut:{name:'Family shelter',cost:{wood:5,fiber:3},work:2,desc:'Room for three more people. Connected shelters protect against cold.'},
  storage:{name:'Storehouse',cost:{wood:4,stone:3,fiber:2},work:3,desc:'Connected storage reduces fresh-food spoilage from 25% to 8%.'},
  well:{name:'Water place',cost:{stone:5,wood:2},work:2,desc:'A connected water place supplies 2 water each dawn.'},
  drying:{name:'Smoke rack',cost:{wood:4,fiber:2},work:2,desc:'Preserve surplus meat for winter. Requires a path and living hearth.'},
  garden:{name:'Growing plot',cost:{wood:2,stone:2},work:2,tech:'growing',desc:'Plant, water and harvest food. Each plot is a small working garden.'},
  workshop:{name:'Workshop',cost:{wood:5,stone:4},work:3,tech:'tools',desc:'Connected workshops support better tools and lower crafting fatigue.'},
  circle:{name:'Gathering circle',cost:{stone:6,wood:4},work:3,tech:'kinship',desc:'A place to share knowledge, welcome families and form a village.'}
 };
 const techs={
  tools:{name:'Worked tools',need:4,requires:[],skill:'craft',desc:'Unlock a workshop, stone axes and better toolmaking.'},
  growing:{name:'Seeds & seasons',need:5,requires:['tools'],skill:'green',desc:'Unlock growing plots and the farming skill.'},
  kinship:{name:'Shared hearths',need:4,requires:[],skill:'fire',desc:'Unlock the gathering circle and agreements with neighboring families.'},
  bows:{name:'The distant hunt',need:5,requires:['tools'],skill:'hunt',desc:'Unlock bows and the longarm role on group hunts.'},
  exchange:{name:'Paths of exchange',need:5,requires:['kinship'],skill:'scout',desc:'Unlock trade and regional outposts.'}
 };
 const recipes={spear:{name:'Spear',cost:{wood:2,stone:1,fiber:1},skill:1},basket:{name:'Basket',cost:{fiber:3},skill:1},wrap:{name:'Warm wrap',cost:{hide:1,fiber:2},skill:1},hook:{name:'Fishing hook',cost:{bone:1,fiber:1},skill:1},axe:{name:'Stone axe',cost:{wood:2,stone:2,fiber:1},skill:2,tech:'tools'},bow:{name:'Bow',cost:{wood:3,fiber:3},skill:2,tech:'bows'}};
 const places=[
  {id:'home',name:'Hearth Valley',x:2,y:2,type:'home',desc:'Your people, your hearth, the beginning of a lasting home.'},
  {id:'reed',name:'Reedwater',x:3,y:2,type:'river',desc:'Broad shallows. Scouting expands the home fishing grounds.'},
  {id:'flint',name:'Flint Ridge',x:2,y:1,type:'stone',desc:'Good stone on an exposed ridge. Work here brings extra stone.'},
  {id:'pine',name:'Pine Reach',x:1,y:2,type:'forest',desc:'Sheltered woodland. An outpost produces wood each dawn.'},
  {id:'amber',name:'Amber Hearth',x:4,y:2,type:'neighbor',desc:'A fictional neighboring community. Their gatherers exchange fiber for preserved food.'},
  {id:'high',name:'High Meadow',x:3,y:1,type:'game',desc:'Seasonal game trails. Discovering them broadens your hunting grounds.'},
  {id:'south',name:'South Ford',x:2,y:3,type:'neighbor',desc:'A fictional river community. They exchange stone for fiber.'},
  {id:'lake',name:'Stillwater',x:3,y:3,type:'river',desc:'A sheltered lake. An outpost supplies a little food.'},
  {id:'pass',name:'The Far Pass',x:4,y:1,type:'mountain',desc:'A wider horizon. Reaching it marks an established regional presence.'}
 ];
 const nodeMax={fish:20,green:28,root:18,wood:30,fiber:20,game:20};
 const baseProfiles=[
  ['oldM','Orr','Elder · keeper of the fire',0,{fire:3,root:2,craft:1,scout:1},48],
  ['oldF','Ma','Elder · maker and gatherer',1,{warm:3,green:2,craft:2},38],
  ['strongM','Grok','Provider · hunter and fisher',2,{fish:3,hunt:2,craft:1,scout:2},18],
  ['strongF','Nana','Builder · firekeeper',3,{fire:2,green:2,craft:2,hunt:1},16],
  ['youngM','Lug','Young kin · learning the land',4,{},4],
  ['youngF','Eeka','Young kin · learning the craft',5,{},4]
 ];
 const settlers=[['ara','Ara','Wayfinder · new kin',6,{scout:2,green:2,hunt:1}],['tov','Tov','Fisher · new kin',7,{fish:2,craft:1}],['suri','Suri','Grower · new kin',8,{green:3,craft:2,farm:1}],['kell','Kell','Hunter · new kin',9,{hunt:3,fire:2}],['mira','Mira','Maker · new kin',10,{craft:3,warm:2,green:2}],['tal','Tal','Builder · new kin',11,{craft:2,scout:2,hunt:1}]];
 const clone=x=>JSON.parse(JSON.stringify(x));
 function person(a){return{id:a[0],name:a[1],role:a[2],art:a[3],know:Object.keys(a[4]),hand:{...a[4]},fatigue:a[5]??12,health:100,alive:true,belly:3,x:4,y:6}}
 function create(seed=91724){const people=baseProfiles.map(person);people.forEach((p,i)=>{[p.x,p.y]=[[3,7],[4,8],[8,5],[7,7],[5,9],[8,8]][i]});
  return{version:6,seed:seed|0,sun:1,phase:'plan',slot:0,stock:{food:18,greens:6,roots:3,preserved:0,water:8,wood:12,stone:8,fiber:8,hide:2,bone:2,seed:3},tools:{spear:2,basket:1,wrap:1,hook:0,axe:0,bow:0,dig:1},fire:6,trust:3,people,plans:{},nodes:{...nodeMax},buildings:[{id:'cave',type:'cave',x:3,y:5,work:0,done:true},{id:'hearth',type:'hearth',x:5,y:6,work:0,done:true}],paths:['4,6','4,5','5,5','5,7','6,6'],research:{active:'tools',progress:{},done:[]},region:{seen:['home'],outposts:[],relations:{amber:1,south:1}},chronicle:[],lessons:[],history:[],pending:[],applied:[],nextId:1,stage:'family',settlerWave:0,today:{events:[],learned:[],losses:[],gains:{}},lastPlan:null,started:false,fieldTrips:true,policy:'balance'};
 }
 function rng(s){let a=s.seed|0;a=(a+0x6D2B79F5)|0;s.seed=a;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
 const live=s=>s.people.filter(p=>p.alive),get=(s,id)=>s.people.find(p=>p.id===id),key=(x,y)=>x+','+y;
 function log(s,t){s.today.events.push(t);s.history.push({sun:s.sun,text:t});if(s.history.length>1600)s.history.shift()}
 function season(s){return ['Spring','Summer','Autumn','Winter'][Math.floor((s.sun-1)/6)%4]}
 function weather(s){const w=[['Clear','Clear','Rain','Clear','Rain','Clear'],['Clear','Clear','Clear','Rain','Clear','Clear'],['Clear','Rain','Clear','Clear','Rain','Clear'],['Cold','Cold','Clear','Cold','Cold','Cold']];return w[Math.floor((s.sun-1)/6)%4][(s.sun-1)%6]}
 function terrain(x,y){if(x<0||y<0||x>=16||y>=12)return'edge';if(x>=12+(y<4?1:0))return'water';if((x<2&&y<4)||(x===9&&y===1))return'rock';if((x===1&&y>7)||(x===10&&y===2)||(x===8&&y===2)||(x===9&&y===9)||(x===2&&y===2))return'tree';if((x*7+y*11)%13<3)return'grass';return'ground'}
 function connected(s,b){if(['cave','hearth'].includes(b.type))return true;const roads=new Set(s.paths),q=[[5,6]],seen=new Set(['5,6']);for(let i=0;i<q.length;i++){const[x,y]=q[i];if(Math.abs(x-b.x)+Math.abs(y-b.y)<=1)return true;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const k=key(x+dx,y+dy);if(roads.has(k)&&!seen.has(k)){seen.add(k);q.push([x+dx,y+dy])}}}return false}
 const active=(s,type)=>s.buildings.filter(b=>b.type===type&&b.done&&connected(s,b));
 const capacity=s=>6+active(s,'hut').length*3;
 const reserve=s=>s.stock.food+s.stock.greens+s.stock.roots+s.stock.preserved;
 function canPay(s,cost){return Object.entries(cost).every(([k,n])=>s.stock[k]>=n)}
 function pay(s,cost){if(!canPay(s,cost))return false;for(const[k,n]of Object.entries(cost))s.stock[k]-=n;return true}
 function gain(s,k,n){s.stock[k]=Math.max(0,s.stock[k]+n);if(n>0)s.today.gains[k]=(s.today.gains[k]||0)+n}
 function place(s,type,x,y){if(s.phase!=='plan')return'Build between suns.';const b=buildings[type];if(!b)return'Choose a building.';if(b.tech&&!s.research.done.includes(b.tech))return'First discover '+techs[b.tech].name+'.';
  if(!['ground','grass'].includes(terrain(x,y)))return'Choose open ground.';if(s.buildings.some(p=>p.x===x&&p.y===y)||s.paths.includes(key(x,y)))return'This ground is occupied.';
  if(type!=='trail'&&s.buildings.filter(p=>p.type===type).length>=(type==='hut'?6:type==='garden'?6:2))return'There are enough of those here for now.';
  if(!pay(s,b.cost))return'Not enough materials.';
  if(type==='trail')s.paths.push(key(x,y));else s.buildings.push({id:'b'+s.nextId++,type,x,y,done:false,work:0,growth:0,water:0,planted:false});
  log(s,type==='trail'?'A path connects the ground.':`${b.name} site placed. Assign Build to finish it.`);return null;
 }
 function know(s,p,skill,teacher){if(!p.know.includes(skill)){p.know.push(skill);s.trust++;s.lessons.push({sun:s.sun,learner:p.id,teacher,skill,type:'understanding'});s.today.learned.push(`${p.name} understands ${skillNames[skill]}.`);return true}return false}
 function practice(s,p,skill){if(!p.know.includes(skill))return false;const before=p.hand[skill]||0;if(before<5){p.hand[skill]=before+1;s.lessons.push({sun:s.sun,learner:p.id,skill,type:'practice'});s.today.learned.push(`${p.name} practiced ${skillNames[skill]} (${p.hand[skill]}/5).`)}return true}
 function skillFor(a){if(a.startsWith('teach:')||a.startsWith('practice:'))return a.split(':')[1];if(a.startsWith('craft:')||a==='build'||a==='preserve')return'craft';return{fire:'fire',roots:'root',forage:'green',fish:'fish',hunt:'hunt',party:'hunt',plant:'farm',tend:'farm',harvest:'farm',scout:'scout'}[a]||null}
 function plan(s,id,slot,action){if(s.phase!=='plan')return false;if(!s.plans[id])s.plans[id]=['rest','rest'];s.plans[id][slot]=action;return true}
 function firstPlans(s){const am=['teach:fire','forage','fish','build','watch:oldM','watch:oldF'],pm=['rest','craft:basket','hunt','wood','practice:fire','practice:green'];live(s).forEach((p,i)=>s.plans[p.id]=[am[i]||'rest',pm[i]||'rest'])}
 function start(s){if(s.phase!=='plan'||!live(s).length)return false;s.started=true;s.lastPlan=clone(s.plans);s.phase='run';s.slot=0;s.pending=[];s.today={events:[],learned:[],losses:[],gains:{}};gain(s,'water',active(s,'well').length*2);
  s.region.outposts.forEach(id=>{const loc=places.find(p=>p.id===id);gain(s,loc.type==='forest'?'wood':loc.type==='stone'?'stone':'food',2)});log(s,`Sun ${s.sun}. ${season(s)}. ${weather(s)}.`);return true;
 }
 function take(s,node,n){const a=Math.min(s.nodes[node],n);s.nodes[node]-=a;return a}
 function request(s,scene,actors,slot){const id=`${s.sun}:${slot}:${s.nextId++}`;const e={id,scene,actors,slot,seed:Math.floor(rng(s)*2147483647),tools:clone(s.tools),goal:scene==='fish'?3:1,available:s.nodes[scene==='fish'?'fish':'game']};s.pending.push(e);return e}
 function resolveSlot(s){if(s.phase!=='run'||s.pending.length||s.slot>1)return false;const slot=s.slot,done={},stockTools=clone(s.tools),used={};const claim=t=>{if((stockTools[t]||0)-(used[t]||0)<=0)return false;used[t]=(used[t]||0)+1;return true};
  const party=live(s).filter(p=>(s.plans[p.id]||[])[slot]==='party');
  if(party.length){if(party.length<2||party.length>5||party.some(p=>!p.know.includes('hunt')||(p.hand.hunt||0)<1)||s.tools.spear<party.length){log(s,'A group hunt needs 2–5 trained people and one spear each.');party.forEach(p=>p.fatigue+=3)}else{party.forEach(p=>{claim('spear');done[p.id]='party'});(()=>{const e=request(s,'party',party.map(p=>p.id),slot);e.tools.bow=0;while(e.tools.bow<party.length&&claim('bow'))e.tools.bow++})()}}
  live(s).forEach(p=>{const a=(s.plans[p.id]||[])[slot]||'rest';if(a.startsWith('watch:')||a==='party')return;const good=act(s,p,a,claim,slot);if(good)done[p.id]=a});
  live(s).forEach(p=>{const a=(s.plans[p.id]||[])[slot]||'rest';if(!a.startsWith('watch:'))return;const t=get(s,a.split(':')[1]),skill=skillFor(done[t?.id]||'');p.fatigue+=2;
   if(!t?.alive||!skill||!t.know.includes(skill)||(t.hand[skill]||0)<1){log(s,`${p.name} finds no skilled demonstration to watch.`);return}if(s.pending.some(e=>e.actors.includes(t.id))){log(s,`${p.name} cannot watch ${t.name} from camp while they are away.`);return}know(s,p,skill,t.id);log(s,`${p.name} watches ${t.name}. Understanding grows; practice is still needed.`)
  });
  if(!s.pending.length)s.slot++;return true;
 }
 function act(s,p,a,claim,slot){const name=p.name;const tired=n=>p.fatigue+=Math.max(1,n-(['wood','stone','fiber','forage','roots','water'].includes(a)&&s.paths.filter(k=>{const[x,y]=k.split(',').map(Number);return connected(s,{type:'trail',x,y})}).length>8?1:0));
  if(a==='rest'){p.fatigue=Math.max(0,p.fatigue-20);if(reserve(s)>0&&s.fire>0)p.health=Math.min(100,p.health+4);log(s,`${name} rests.`);return false}
  if(a.startsWith('teach:')){const skill=a.split(':')[1];tired(5);if(!p.know.includes(skill)||(p.hand[skill]||0)<1){log(s,`${name} cannot demonstrate ${skillNames[skill]} yet.`);return false}log(s,`${name} teaches ${skillNames[skill]}.`);return true}
  if(a.startsWith('practice:')){const sk=a.split(':')[1];tired(6);if(!p.know.includes(sk)){log(s,`${name} needs to watch ${skillNames[sk]} first.`);return false}if(['fire','craft'].includes(sk)&&!pay(s,{wood:1})){log(s,`${name} needs wood to practice.`);return false}practice(s,p,sk);log(s,`${name} practices ${skillNames[sk]}.`);if(sk==='fire'&&p.hand.fire>=2)s.fire=Math.min(12,s.fire+1);return true}
  if(a==='fire'){tired(4);if(!s.stock.wood||(s.fire===0&&(p.hand.fire||0)<2)){log(s,`${name} needs wood and a practiced firekeeper to relight the hearth.`);return false}pay(s,{wood:1});s.fire=Math.min(12,s.fire+3);practice(s,p,'fire');log(s,`${name} keeps the hearth alive.`);return true}
  if(a==='water'){gain(s,'water',3);tired(5);log(s,`${name} carries water from the river.`);return true}
  if(a==='forage'||a==='roots'){const sk=a==='forage'?'green':'root';tired(5);if(a==='roots'&&(!p.know.includes('root')||!claim('dig'))){log(s,`${name} needs root knowledge and a digging tool.`);return false}const n=take(s,sk,2+((p.hand[sk]||0)>=2?1:0)+(a==='forage'&&claim('basket')?1:0));gain(s,a==='roots'?'roots':'greens',n);if(n)practice(s,p,sk);log(s,`${name} brings ${n} ${a==='roots'?'roots':'greens'}.`);return n>0}
  if(['wood','stone','fiber'].includes(a)){const n=a==='stone'?2+(s.region.seen.includes('flint')?1:0):take(s,a,a==='wood'?3+(claim('axe')?2:0):3);gain(s,a,n);tired(6);log(s,`${name} gathers ${n} ${a}.`);return n>0}
  if(a==='fish'||a==='hunt'){if(a==='hunt'&&(!p.know.includes('hunt')||(p.hand.hunt||0)<1||!claim('spear'))){log(s,`${name} needs hunting knowledge and an available spear.`);return false}const e=request(s,a,[p.id],slot);e.tools.bow=a==='hunt'&&claim('bow')?1:0;e.tools.hook=a==='fish'&&claim('hook')?1:0;return true}
  if(a.startsWith('craft:')){const id=a.split(':')[1],r=recipes[id];tired(active(s,'workshop').length?4:8);if(!r||!p.know.includes('craft')||(p.hand.craft||0)<r.skill||r.tech&&!s.research.done.includes(r.tech)||!pay(s,r.cost)){log(s,`${name} cannot make ${r?.name||'that tool'} yet. Check skill, discovery and materials.`);return false}s.tools[id]++;practice(s,p,'craft');if(id==='wrap')practice(s,p,'warm');log(s,`${name} makes a ${r.name.toLowerCase()}.`);return true}
  if(a==='build'){tired(8);const site=s.buildings.find(b=>!b.done);if(!site){log(s,`${name} finds no unfinished site. Place a building first.`);return false}if((p.hand.craft||0)<1){log(s,`${name} needs crafting practice before building.`);return false}site.work++;practice(s,p,'craft');log(s,`${name} builds ${buildings[site.type].name.toLowerCase()} (${site.work}/${buildings[site.type].work}).`);if(site.work>=buildings[site.type].work){site.done=true;s.today.built=site.type;log(s,`${buildings[site.type].name} complete.${connected(s,site)?' Connected to the hearth.':' Build a path to activate it.'}`)}return true}
  if(a==='study'){tired(5);const id=s.research.active,r=techs[id];if(!r||s.research.done.includes(id)){log(s,`${name} needs a new discovery to explore.`);return false}if(r.requires.some(x=>!s.research.done.includes(x))){log(s,`Discover ${r.requires.map(x=>techs[x].name).join(', ')} first.`);return false}const n=(p.hand[r.skill]||0)>=2?2:1;s.research.progress[id]=(s.research.progress[id]||0)+n;log(s,`${name} explores ${r.name.toLowerCase()} (+${n}).`);if(s.research.progress[id]>=r.need){s.research.done.push(id);log(s,`${r.name} discovered.`);if(id==='growing'){know(s,p,'farm',null);practice(s,p,'farm')}if(id==='exchange'){know(s,p,'scout',null);practice(s,p,'scout')}}return true}
  if(['plant','tend','harvest'].includes(a)){tired(6);const plots=active(s,'garden');if(!plots.length){log(s,'A connected growing plot is needed.');return false}
   if(a==='plant'){const b=plots.find(x=>!x.planted);if(!b||weather(s)==='Cold'||!s.stock.seed){log(s,`${name} needs an empty plot, a seed and warmer ground.`);return false}pay(s,{seed:1});Object.assign(b,{planted:true,water:2,growth:0});log(s,`${name} plants a seed.`)}
   if(a==='tend'){if(!pay(s,{water:1})){log(s,`${name} needs water for the plots.`);return false}plots.filter(x=>x.planted).forEach(x=>x.water=2);log(s,`${name} tends the growing plots.`)}
   if(a==='harvest'){const ready=plots.filter(x=>x.planted&&x.growth>=4);if(!ready.length){log(s,`${name} finds no ripe crop.`);return false}ready.forEach(b=>{b.planted=false;b.growth=0});gain(s,'roots',ready.length*8);gain(s,'seed',ready.length*2);s.today.harvest=true;log(s,`${name} harvests ${ready.length*8} roots and saves seeds.`)}practice(s,p,'farm');return true;
  }
  if(a==='preserve'){tired(5);if(!active(s,'drying').length||s.fire<1||!pay(s,{food:4,wood:1})){log(s,`${name} needs a connected smoke rack, fire, four meat and one wood.`);return false}gain(s,'preserved',4);practice(s,p,'craft');log(s,`${name} preserves four food.`);return true}
  if(a==='scout'){tired(12);const target=places.find(r=>!s.region.seen.includes(r.id)&&places.some(t=>s.region.seen.includes(t.id)&&Math.abs(t.x-r.x)+Math.abs(t.y-r.y)===1));if(!target){log(s,'The known region is fully explored.');return false}s.region.seen.push(target.id);know(s,p,'scout');practice(s,p,'scout');if(target.type==='river')s.nodes.fish=Math.min(30,s.nodes.fish+8);if(target.type==='game')s.nodes.game=Math.min(30,s.nodes.game+8);log(s,`${name} discovers ${target.name}. ${target.desc}`);s.today.discovered=target.id;return true}
  if(a==='story'){tired(3);s.trust=Math.min(100,s.trust+1);const old=s.chronicle.at(-1);log(s,old?`${name} retells the memory of sun ${old.sun}.`:`${name} gathers the family around the fire.`);return true}
  return false;
 }
 function autoResult(s,e){const p=get(s,e.actors[0]);if(e.scene==='fish'){const available=Math.min(e.available,s.nodes.fish),caught=Math.min(available,2+Math.floor((p.hand.fish||0)/2)+(e.tools.hook?1:0));return{id:e.id,caught,food:Math.max(0,caught-1),belly:Math.min(1,caught),injuries:{},success:caught>0}}
  const power=e.actors.reduce((n,id)=>n+(get(s,id).hand.hunt||0),0),success=s.nodes.game>=(e.scene==='party'?4:2)&&rng(s)<Math.min(.93,.43+power*.08),injuries={};if(!success&&rng(s)<.4)injuries[e.actors[0]]=12;return{id:e.id,food:success?(e.scene==='party'?12:6):0,hide:success?(e.scene==='party'?2:1):0,bone:success?2:0,game:success?(e.scene==='party'?4:2):0,injuries,success};
 }
 function applyField(s,e,result){
  if(!s.pending.some(x=>x.id===e.id)||s.applied.includes(e.id)||result.id!==e.id)return false;
  if(!Number.isFinite(result.food)||result.food<0||result.food>30||!Number.isFinite(result.caught??0)||!Number.isFinite(result.hide??0)||!Number.isFinite(result.bone??0)||Object.values(result.injuries||{}).some(n=>!Number.isFinite(n)||n<0))return false;
  let home=0,belly=0,success=false;
  if(e.scene==='fish'){const caught=Math.max(0,Math.min(s.nodes.fish,e.available,Math.floor(result.caught||0)));s.nodes.fish-=caught;belly=Math.min(1,caught);home=caught-belly;gain(s,'food',home);const p=get(s,e.actors[0]);p.belly=Math.min(4,p.belly+belly);success=caught>0}
  else{const spend=e.scene==='party'?4:2;if(result.success&&s.nodes.game>=spend){take(s,'game',spend);home=Math.max(0,Math.min(Math.floor(result.food),e.scene==='party'?12:6));gain(s,'food',home);gain(s,'hide',Math.max(0,Math.min(Math.floor(result.hide||0),e.scene==='party'?2:1)));gain(s,'bone',Math.max(0,Math.min(Math.floor(result.bone||0),2)));success=true}}
  e.actors.forEach(id=>{const p=get(s,id);p.fatigue+=e.scene==='fish'?7:16;p.belly=Math.max(0,p.belly-(e.scene==='fish'?0:1));p.health=Math.max(0,p.health-Math.min(25,result.injuries?.[id]||0));if(success){know(s,p,e.scene==='fish'?'fish':'hunt');practice(s,p,e.scene==='fish'?'fish':'hunt')}});
  log(s,`${e.actors.map(id=>get(s,id).name).join(' and ')} return from ${e.scene==='fish'?'the river':'the hunt'}: ${home} food for home${belly?', one catch for the provider':''}.`);
  s.applied.push(e.id);s.pending=s.pending.filter(x=>x.id!==e.id);if(!s.pending.length)s.slot++;return true;
 }

 function requirements(s){const pop=live(s).length;return{tribe:[{text:'Welcome another family (8 people)',ok:pop>=8},{text:'Connected shelter for everyone',ok:capacity(s)>=pop&&active(s,'hut').length>0},{text:'Three practiced firekeepers',ok:live(s).filter(p=>(p.hand.fire||0)>=2).length>=3}],village:[{text:'Twelve people at home',ok:pop>=12},{text:'Homes connected to the hearth',ok:capacity(s)>=pop},{text:'A storehouse and water place',ok:active(s,'storage').length>0&&active(s,'well').length>0},{text:'A gathering circle',ok:active(s,'circle').length>0},{text:'Seeds & seasons discovered',ok:s.research.done.includes('growing')},{text:'Two suns of food in reserve',ok:reserve(s)>=pop*2}]}}
 function updateStage(s){const r=requirements(s);if(r.tribe.every(x=>x.ok)&&s.stage==='family'){s.stage='tribe';log(s,'The family has become a tribe. More people now carry its knowledge.')}if(s.stage==='tribe'&&r.village.every(x=>x.ok)){s.stage='village';log(s,'A village stands where one family first kept a fire.')}}
 function canWelcome(s){return s.phase==='plan'&&s.settlerWave<3&&s.sun>=3+s.settlerWave*3&&capacity(s)>=live(s).length+2&&reserve(s)>=live(s).length+2&&s.trust>=3+s.settlerWave*2}
 function welcome(s){if(!canWelcome(s))return false;const n=s.settlerWave*2;settlers.slice(n,n+2).forEach(a=>{const p=person(a);p.x=6+(s.people.length%3)*1.2;p.y=9+Math.floor((s.people.length-6)/3);s.people.push(p);s.plans[p.id]=['rest','rest']});s.settlerWave++;log(s,`${settlers[n][1]} and ${settlers[n+1][1]} join the community.`);updateStage(s);return true}
 function trade(s,id){if(s.phase!=='plan'||!s.region.seen.includes(id)||!s.research.done.includes('exchange'))return'Explore the settlement and discover Paths of exchange first.';if(s.region.lastTrade===s.sun)return'Another exchange can be made next sun.';
  if(id==='amber'){if(!pay(s,{preserved:4}))return'Bring four preserved food.';gain(s,'fiber',8)}else if(id==='south'){if(!pay(s,{fiber:5}))return'Bring five fiber.';gain(s,'stone',8)}else return'There is no trade agreement here.';s.region.lastTrade=s.sun;s.region.relations[id]=(s.region.relations[id]||0)+1;log(s,`Goods exchanged with ${places.find(p=>p.id===id).name}.`);return null;
 }
 function outpost(s,id){const p=places.find(x=>x.id===id);if(s.phase!=='plan'||!p||!['forest','river','stone'].includes(p.type)||!s.region.seen.includes(id)||!s.research.done.includes('exchange'))return'Explore suitable ground and discover Paths of exchange first.';if(s.region.outposts.includes(id))return'An outpost already stands here.';if(!pay(s,{wood:8,stone:4,preserved:4}))return'Needs eight wood, four stone and four preserved food.';s.region.outposts.push(id);log(s,`An outpost links ${p.name} to Hearth Valley.`);return null}
 function dinner(s){if(s.phase!=='run'||s.slot<2||s.pending.length)return false;let need=live(s).length;const total=need;s.today.short=0;
  for(const k of ['food','greens','roots','preserved']){const n=Math.min(need,s.stock[k]);s.stock[k]-=n;need-=n}s.today.short=need;s.today.fed=total-need;
  const waterNeed=Math.ceil(total/4),dry=Math.max(0,waterNeed-s.stock.water);s.stock.water=Math.max(0,s.stock.water-waterNeed);s.today.dry=dry;const housing=capacity(s),cold=weather(s)==='Cold',exposed=cold&&(housing<total||s.fire<1);s.today.exposed=exposed;
  live(s).forEach(p=>{p.fatigue+=need?10:0;p.health=Math.max(0,p.health-need*2-dry*5-(exposed?Math.max(0,8-Math.floor(s.tools.wrap/total)*4):0)-(p.fatigue>100?7:0));if(p.health>0&&!need&&!dry&&s.fire>0)p.health=Math.min(100,p.health+3);if(p.health<=0){p.alive=false;s.today.losses.push(p.id);log(s,`${p.name} has died. Their knowledge survives only in those who learned it.`)}});
  const rate=active(s,'storage').length?.08:.25;let spoiled=0;for(const k of ['food','greens']){const loss=Math.floor(s.stock[k]*rate);s.stock[k]-=loss;spoiled+=loss}s.today.spoiled=spoiled;
  s.trust=Math.max(0,Math.min(100,s.trust+(need?-1:1)));
  const lesson=s.lessons.find(l=>l.sun===s.sun&&l.type==='understanding'&&l.teacher),found=places.find(p=>p.id===s.today.discovered);
  let line=s.today.losses.length?`${get(s,s.today.losses[0]).name} is gone. We carry what they gave us.`:need?'The bowl is small. We share what remains.':s.today.harvest?'We kept seeds for a season we could not yet see.':lesson?`${get(s,lesson.learner).name} learned ${skillNames[lesson.skill].toLowerCase()} from ${get(s,lesson.teacher).name}. Our knowledge has another keeper.`:found?`We found ${found.name}. The valley is larger than the paths we inherited.`:s.today.built?`${buildings[s.today.built].name} stands where there was open ground. Our home is taking shape.`:s.today.learned.length?'What one pair of hands knew, another now carries.':'There is food by the fire, and another day ahead.';

  s.chronicle.push({sun:s.sun,line});log(s,`${s.today.fed}/${total} people fed. ${spoiled} fresh food spoiled.`);s.phase='dinner';updateStage(s);return true;
 }
 function sleep(s){if(s.phase!=='dinner')return false;live(s).forEach(p=>p.fatigue=Math.max(0,p.fatigue-(s.today.short?7:18)-(active(s,'hut').length?2:0)));s.fire=Math.max(0,s.fire-(weather(s)==='Rain'?2:1));
  const winter=season(s)==='Winter',pop=live(s).length,bonus=s.region.seen.includes('reed')?1:0;for(const[k,n]of Object.entries(nodeMax)){const r=k==='fish'?(winter?1:4)+bonus:k==='green'?(winter?0:5):k==='root'?(winter?1:2):k==='wood'?4:k==='fiber'?3:2;s.nodes[k]=Math.min(n+(k==='fish'&&bonus?8:0),s.nodes[k]+r)}
  active(s,'garden').filter(b=>b.planted).forEach(b=>{if(weather(s)==='Rain')b.water=2;if(!winter&&b.water>0){b.growth=Math.min(4,b.growth+1);b.water--}});
  s.sun++;s.phase='plan';s.slot=0;s.people.forEach(p=>{s.plans[p.id]=['rest','rest']});updateStage(s);return true;
 }
 function valid(s){try{
  const num=(n,a=0,b=1e7)=>Number.isFinite(n)&&n>=a&&n<=b,integer=(n,a=0,b=1e7)=>Number.isInteger(n)&&num(n,a,b),obj=o=>o&&typeof o==='object'&&!Array.isArray(o),nums=o=>obj(o)&&Object.values(o).every(n=>num(n)),strings=(v,max=2000)=>Array.isArray(v)&&v.length<10000&&v.every(x=>typeof x==='string'&&x.length<=max),idsafe=x=>typeof x==='string'&&/^[a-z][a-zA-Z0-9_-]{0,40}$/.test(x),skills=Object.keys(skillNames),techKeys=Object.keys(techs),placeKeys=places.map(p=>p.id);
  if(!obj(s)||s.version!==6||!integer(s.sun,1)||!['plan','run','dinner'].includes(s.phase)||!integer(s.seed,-2147483648,2147483647)||!Array.isArray(s.people)||s.people.length>12||s.people.length<6)return false;
  if(!num(s.fire,0,12)||!num(s.trust,0,100)||!integer(s.slot,0,2)||!integer(s.nextId,1)||!integer(s.settlerWave,0,3)||!['family','tribe','village'].includes(s.stage)||typeof s.started!=='boolean'||typeof s.fieldTrips!=='boolean')return false;
  const template=create();for(const k of ['stock','tools','nodes'])if(!nums(s[k])||!Object.keys(template[k]).every(x=>integer(s[k][x])))return false;
  const ids=new Set();for(const p of s.people){if(!obj(p)||!idsafe(p.id)||ids.has(p.id)||typeof p.name!=='string'||p.name.length>60||typeof p.role!=='string'||p.role.length>150||!integer(p.art,0,11)||typeof p.alive!=='boolean'||!Array.isArray(p.know)||!p.know.every(k=>skills.includes(k))||!nums(p.hand)||!Object.entries(p.hand).every(([k,n])=>skills.includes(k)&&integer(n,0,5))||!num(p.health,0,100)||!num(p.fatigue,0,10000)||!num(p.belly,0,4)||!num(p.x,0,15)||!num(p.y,0,11))return false;ids.add(p.id)}
  const actionOK=a=>{if(typeof a!=='string')return false;if(['rest','fire','water','forage','roots','wood','stone','fiber','fish','hunt','party','build','study','plant','tend','harvest','preserve','scout','story'].includes(a))return true;const [verb,value,...extra]=a.split(':');return !extra.length&&(verb==='watch'?ids.has(value):['teach','practice'].includes(verb)?skills.includes(value):verb==='craft'?Object.keys(recipes).includes(value):false)};
  const plansOK=o=>obj(o)&&Object.entries(o).every(([id,v])=>ids.has(id)&&Array.isArray(v)&&v.length===2&&v.every(actionOK));if(!plansOK(s.plans)||s.lastPlan!==null&&!plansOK(s.lastPlan))return false;
  if(!Array.isArray(s.buildings)||s.buildings.length>80||!s.buildings.every(b=>obj(b)&&idsafe(b.id)&&['cave','hearth',...Object.keys(buildings).filter(k=>k!=='trail')].includes(b.type)&&integer(b.x,0,15)&&integer(b.y,0,11)&&integer(b.work,0,3)&&typeof b.done==='boolean'&&['growth','water'].every(k=>b[k]===undefined||integer(b[k],0,4)))||!s.buildings.some(b=>b.type==='hearth')||!s.buildings.some(b=>b.type==='cave'))return false;
  if(!Array.isArray(s.paths)||s.paths.length>192||!s.paths.every(k=>typeof k==='string'&&/^\d+,\d+$/.test(k)&&k.split(',').every((n,i)=>integer(Number(n),0,i?11:15))))return false;
  if(!obj(s.research)||!Array.isArray(s.research.done)||!s.research.done.every(k=>techKeys.includes(k))||!techKeys.includes(s.research.active)||!nums(s.research.progress)||!Object.keys(s.research.progress).every(k=>techKeys.includes(k)))return false;
  if(!obj(s.region)||!Array.isArray(s.region.seen)||!s.region.seen.includes('home')||!s.region.seen.every(k=>placeKeys.includes(k))||!Array.isArray(s.region.outposts)||new Set(s.region.outposts).size!==s.region.outposts.length||!s.region.outposts.every(k=>s.region.seen.includes(k)&&['forest','river','stone'].includes(places.find(p=>p.id===k)?.type))||!nums(s.region.relations))return false;
  if(!['pending','applied','chronicle','lessons','history'].every(k=>Array.isArray(s[k])&&s[k].length<10000)||!obj(s.today)||!strings(s.today.events)||!strings(s.today.learned)||!Array.isArray(s.today.losses)||!s.today.losses.every(id=>ids.has(id))||!nums(s.today.gains))return false;
  if(s.pending.some(e=>!obj(e)||typeof e.id!=='string'||!['fish','hunt','party'].includes(e.scene)||!Array.isArray(e.actors)||!e.actors.length||!e.actors.every(id=>ids.has(id))||!nums(e.tools)||!integer(e.available)))return false;
  if(!s.chronicle.every(x=>obj(x)&&typeof x.line==='string'&&x.line.length<2000&&integer(x.sun,1))||!s.history.every(x=>obj(x)&&typeof x.text==='string'&&x.text.length<2000&&integer(x.sun,1))||!s.lessons.every(x=>obj(x)&&ids.has(x.learner)&&(!x.teacher||ids.has(x.teacher))&&skills.includes(x.skill)&&['practice','understanding'].includes(x.type)&&integer(x.sun,1)))return false;
  return true;
 }catch{return false}}

 return{create,clone,live,get,log,rng,season,weather,terrain,connected,active,capacity,reserve,canPay,pay,gain,place,know,practice,skillFor,plan,firstPlans,start,resolveSlot,autoResult,applyField,requirements,updateStage,canWelcome,welcome,trade,outpost,dinner,sleep,valid,skillNames,buildings,techs,recipes,places,nodeMax};
})();
if(typeof module!=='undefined')module.exports=Kin;
