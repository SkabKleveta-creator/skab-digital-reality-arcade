// Level I is authored here: geometry, encounters, routes, objectives, and supplies.
// Coordinates use x (east/west), z (north/south). North is negative z.
export const LEVEL = {
  id:'hollow-wake-01', name:'Hollow Wake', number:1,
  bounds:{x1:-46,x2:46,z1:-136,z2:50}, start:{x:0,z:44},
  rooms:[
    {id:'gate',name:"Pilgrim’s Gate",x1:-16,x2:16,z1:18,z2:50,tint:0xb1b39b},
    {id:'graves',name:'The Forgotten Graves',x1:-46,x2:-16,z1:-16,z2:20,tint:0x958b6c},
    {id:'market',name:'Ash Market',x1:16,x2:46,z1:-16,z2:20,tint:0xafa18a},
    {id:'bridge',name:'Mourning Bridge',x1:-8,x2:8,z1:-62,z2:24,tint:0xa0a9a5},
    {id:'cloister',name:'The Broken Cloister',x1:-21,x2:21,z1:-94,z2:-57,tint:0xacaaa0},
    {id:'sanctuary',name:'Bell Sanctuary',x1:-18,x2:18,z1:-136,z2:-100,tint:0xb6a998},
  ],
  connectors:[{x1:-36,x2:36,z1:6,z2:18},{x1:-7,x2:7,z1:-105,z2:-90}],
  gate:{id:'ward-gate',x1:-8,x2:8,z1:-57,z2:-55},
  seals:[{id:'grave-seal',name:'Grave ward',x:-40,z:-12},{id:'ash-seal',name:'Ash ward',x:41,z:-12}],
  shrine:{id:'cloister-shrine',name:'Cloister shrine',x:0,z:-61},
  exit:{id:'breach',name:'The breach',x:0,z:-131},
};
export const WALKABLE=[...LEVEL.rooms,...LEVEL.connectors];
export const OBSTACLES=[
  ...[[-12,39],[12,39],[-12,20],[12,20],[-17,-61],[17,-61],[-17,-89],[17,-89],[-14,-105],[14,-105],[-14,-131],[14,-131]].map(([x,z])=>({kind:'pillar',x,z,r:1.05})),
  ...[[-24,12],[-32,12],[-39,14],[-21,1],[-30,2],[-39,3],[-25,-10],[-34,-13]].map(([x,z])=>({kind:'tomb',x,z,r:.78})),
  ...[[24,10],[35,11],[42,6],[25,-4],[36,-6]].map(([x,z])=>({kind:'stall',x,z,r:1.45})),
  ...[[-11,28],[-43,-5],[44,16],[-12,-70],[13,-83]].map(([x,z])=>({kind:'tree',x,z,r:.65})),
  ...[[-3,-18],[3,-38],[-8,-74],[8,-86]].map(([x,z])=>({kind:'rubble',x,z,r:.9})),
  ...LEVEL.seals.map(p=>({kind:'altar',x:p.x,z:p.z,r:.65})),
  ...[[-4,49],[4,49],[-17,8],[-17,14],[17,8],[17,14],[-7.25,-54.3],[7.25,-54.3],[-5.5,-98],[5.5,-98],[-5.5,-134],[5.5,-134],
    ...[-19.7,19.7].flatMap(x=>[-66.5,-71.5,-77.5,-82.5,-87.5,-92.5].map(z=>[x,z]))].map(([x,z])=>({kind:'archpost',x,z,r:.55})),
];

function placement(zone,type,points,patrols=[]){return points.map(([x,z],i)=>({id:`${zone}-${type}-${i+1}`,zone,type,x,z,patrol:patrols[i]||[],aggro:type==='demon'?12:type==='monster'?10:9}));}
export const ENCOUNTERS=[
  ...placement('gate','zombie',[[-4,32],[4,30],[-8,24],[8,23],[-2,21],[3,18]],[[[-4,32],[-4,26]],[],[],[[8,23],[6,18]]]),
  ...placement('graves','zombie',[[-22,15],[-29,16],[-24,4],[-33,6],[-42,8],[-41,-1],[-34,-5],[-27,-5],[-20,-11],[-43,-11]],[[[-22,15],[-28,16]],[],[],[],[[-42,8],[-43,0]]]),
  ...placement('graves','demon',[[-30,-9],[-39,-7]]),
  ...placement('graves','monster',[[-36,-10]]),
  ...placement('market','zombie',[[21,14],[29,16],[39,10],[24,0],[33,-3],[43,-8]]),
  ...placement('market','demon',[[28,7],[37,3],[40,-3],[30,-10],[21,-7]],[[[28,7],[31,1]],[[37,3],[42,0]],[],[],[[21,-7],[22,1]]]),
  ...placement('market','monster',[[36,-11]]),
  ...placement('bridge','zombie',[[0,-5],[-3,-10],[3,-13]]),
  ...placement('bridge','demon',[[-2,-27],[3,-35]],[[[-2,-27],[2,-31]]]),
  ...placement('bridge','monster',[[0,-46]]),
  ...placement('cloister','zombie',[[-12,-63],[12,-65],[-9,-77],[8,-73],[-14,-84],[12,-88]]),
  ...placement('cloister','demon',[[-5,-69],[4,-81],[0,-90]],[[[-5,-69],[5,-69]],[],[[0,-90],[6,-89]]]),
  ...placement('cloister','monster',[[-11,-81],[12,-77]]),
  ...placement('sanctuary','zombie',[[-10,-110],[10,-112]]),
  ...placement('sanctuary','demon',[[-8,-123],[8,-120]]),
  {id:'bellkeeper',zone:'sanctuary',type:'monster',name:'The Bellkeeper',x:0,z:-119,boss:true,aggro:17,patrol:[]},
];
export const SUPPLIES=[
  {id:'gate-ammo',x:9,z:38,kind:'ammo'},
  {id:'grave-supplies',x:-43,z:17,kind:'cache'},
  {id:'market-supplies',x:43,z:16,kind:'cache'},
  {id:'bridge-life',x:5,z:-21,kind:'health'},
  {id:'cloister-ammo',x:-17,z:-66,kind:'cache'},
  {id:'sanctuary-life',x:12,z:-103,kind:'health'},
  {id:'sanctuary-ammo',x:-12,z:-103,kind:'ammo'},
];
export const inside=(x,z,r)=>x>=r.x1&&x<=r.x2&&z>=r.z1&&z<=r.z2;
export const onFloor=(x,z)=>WALKABLE.some(r=>inside(x,z,r));
export const zoneAt=(x,z)=>LEVEL.rooms.find(r=>inside(x,z,r))||{id:'crossroads',name:'The Crossroads'};
export function canStand(x,z,radius=.4,gateOpen=false){
  if(!onFloor(x,z))return false;
  for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[.707,-.707],[-.707,.707],[-.707,-.707]])if(!onFloor(x+dx*radius,z+dz*radius))return false;
  if(!gateOpen){const g=LEVEL.gate;if(x>g.x1-radius&&x<g.x2+radius&&z>g.z1-radius&&z<g.z2+radius)return false;}
  return !OBSTACLES.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+radius);
}
export function clearLine(ax,az,bx,bz,radius=.05,gateOpen=false){
  const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/.45));
  for(let i=1;i<=steps;i++){const t=i/steps;if(!canStand(ax+(bx-ax)*t,az+(bz-az)*t,radius,gateOpen))return false;}return true;
}
// Slice rectangle edges at every junction, then remove interior edges.
export function boundarySegments(){
  const xs=[...new Set(WALKABLE.flatMap(r=>[r.x1,r.x2]))].sort((a,b)=>a-b),zs=[...new Set(WALKABLE.flatMap(r=>[r.z1,r.z2]))].sort((a,b)=>a-b),out=[];
  for(const x of xs)for(let i=0;i<zs.length-1;i++){const z=(zs[i]+zs[i+1])/2;if(onFloor(x-.01,z)!==onFloor(x+.01,z))out.push({x1:x,x2:x,z1:zs[i],z2:zs[i+1]});}
  for(const z of zs)for(let i=0;i<xs.length-1;i++){const x=(xs[i]+xs[i+1])/2;if(onFloor(x,z-.01)!==onFloor(x,z+.01))out.push({x1:xs[i],x2:xs[i+1],z1:z,z2:z});}
  return out;
}

// A* is shared by enemy pursuit and regression tests. Closed wards are solid.
const navCache=new Map(),STEP=2;
function nav(gateOpen,radius){
  const r=radius>.9?1.2:.65,key=`${gateOpen}:${r}`;if(navCache.has(key))return navCache.get(key);
  const nodes=new Map();for(let x=-44;x<46;x+=STEP)for(let z=-134;z<50;z+=STEP)if(canStand(x,z,r,gateOpen))nodes.set(`${x},${z}`,{x,z});
  const data={nodes,r};navCache.set(key,data);return data;
}
function nearestNode(nodes,x,z,gateOpen,r){
  let best=null,d=Infinity;for(const n of nodes.values()){const v=Math.hypot(n.x-x,n.z-z);if(v<d&&v<7&&clearLine(x,z,n.x,n.z,Math.min(r,.4),gateOpen)){best=n;d=v;}}return best;
}
export function findPath(ax,az,bx,bz,gateOpen=false,radius=.65){
  if(clearLine(ax,az,bx,bz,radius,gateOpen))return [{x:bx,z:bz}];
  const {nodes,r}=nav(gateOpen,radius),start=nearestNode(nodes,ax,az,gateOpen,r),end=nearestNode(nodes,bx,bz,gateOpen,r);
  if(!start||!end)return [];
  const id=n=>`${n.x},${n.z}`,target=id(end),first=id(start),open=[first],cost=new Map([[first,0]]),priority=new Map([[first,0]]),from=new Map(),closed=new Set();
  for(let turns=0;open.length&&turns<6000;turns++){
    let best=0;for(let i=1;i<open.length;i++)if(priority.get(open[i])<priority.get(open[best]))best=i;
    const key=open.splice(best,1)[0];if(key===target){const route=[end];let k=key;while(from.has(k)){k=from.get(k);route.push(nodes.get(k));}route.reverse();route.push({x:bx,z:bz});return route;}
    closed.add(key);const n=nodes.get(key);
    for(const [dx,dz]of[[2,0],[-2,0],[0,2],[0,-2],[2,2],[2,-2],[-2,2],[-2,-2]]){
      const nk=`${n.x+dx},${n.z+dz}`;if(closed.has(nk)||!nodes.has(nk))continue;
      if(dx&&dz&&(!nodes.has(`${n.x+dx},${n.z}`)||!nodes.has(`${n.x},${n.z+dz}`)))continue;
      if(!clearLine(n.x,n.z,n.x+dx,n.z+dz,r,gateOpen))continue;
      const g=cost.get(key)+Math.hypot(dx,dz);if(g>=(cost.get(nk)??Infinity))continue;
      from.set(nk,key);cost.set(nk,g);priority.set(nk,g+Math.hypot(n.x+dx-end.x,n.z+dz-end.z));if(!open.includes(nk))open.push(nk);
    }
  }return [];
}
