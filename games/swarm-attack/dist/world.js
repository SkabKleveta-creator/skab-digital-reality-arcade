import * as THREE from './three.module.js';
import {LEVEL,WALKABLE,OBSTACLES,onFloor,zoneAt,boundarySegments} from './level.mjs';

export function buildLevel(scene,kit){
  const {mat,mesh,box,ball,cone,cyl,barBetween,floorTexture,occluders,torchFlames}=kit;
  const chunks=[],lights=[],seals=new Map();
  const stone=mat('stone',0x515448),trim=mat('trim',0x777665),dark=mat('darkStone',0x343d36),iron=mat('iron',0x333634,.65,.45),wood=mat('wood',0x5a3923),gold=mat('wardgold',0xd4ad62,.65,.4,0x4a2a09);
  const add=(x,z,radius=3,fade=true)=>{const g=new THREE.Group();g.position.set(x,0,z);g.userData.chunkRadius=radius;chunks.push(g);scene.add(g);if(fade)occluders.push(g);return g;};
  // Build a single floor from the rectangle union; intersections never overlap.
  const xs=[...new Set(WALKABLE.flatMap(r=>[r.x1,r.x2]))].sort((a,b)=>a-b),zs=[...new Set(WALKABLE.flatMap(r=>[r.z1,r.z2]))].sort((a,b)=>a-b);
  const positions=[],uv=[],colors=[],color=new THREE.Color();
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
    const x1=xs[i],x2=xs[i+1],z1=zs[j],z2=zs[j+1],x=(x1+x2)/2,z=(z1+z2)/2;
    if(!onFloor(x,z))continue;const area=zoneAt(x,z);color.setHex(area.tint||0xa0a18e);
    for(const [vx,vz]of[[x1,z1],[x1,z2],[x2,z1],[x2,z1],[x1,z2],[x2,z2]]){positions.push(vx,-.02,vz);uv.push(vx/7,vz/7);colors.push(color.r,color.g,color.b);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const texture=floorTexture();texture.repeat.set(1,1);
  const floor=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,vertexColors:true,roughness:1}));floor.receiveShadow=true;scene.add(floor);
  const soil=mesh(scene,'PlaneGeometry',[220,300],mat('outerSoil',0x20291f),0,-.38,-43);soil.rotation.x=-Math.PI/2;soil.castShadow=false;
  for(const x of[-28,28]){const water=mesh(scene,'PlaneGeometry',[39,40],mat('blackWater',0x111f20,.65,.22),x,-.26,-36);water.rotation.x=-Math.PI/2;water.castShadow=false;}
  const edges=boundarySegments();
  for(const s of edges){
    const x=(s.x1+s.x2)/2,z=(s.z1+s.z2)/2,len=Math.hypot(s.x2-s.x1,s.z2-s.z1),g=add(x,z,len/2+1);
    const horizontal=s.z1===s.z2,w=horizontal?len:.6,d=horizontal?.6:len;
    box(g,dark,w,1.06,d,0,.35);box(g,trim,w+.05,.12,d+.05,0,.94);
    for(let n=1;n<len/6;n++){const a=n*6-len/2;box(g,stone,.85,1.4,.85,horizontal?a:0,.56,horizontal?0:a);}
  }
  for(const o of OBSTACLES){
    if(o.kind==='archpost')continue;
    const g=add(o.x,o.z,4);
    if(o.kind==='pillar'){
      box(g,trim,1.8,.24,1.8,0,.12);box(g,stone,1.5,.3,1.5,0,.37);cyl(g,stone,.5,.63,3.7,0,2.25,0,8);box(g,trim,1.3,.22,1.3,0,4.14);cone(g,dark,.83,.62,0,4.55);
    }else if(o.kind==='tomb'){
      box(g,dark,1.15,.35,1.6,0,.15);box(g,trim,1.22,.15,1.65,0,.37);box(g,stone,.85,1.1,.22,0,.86,-.6);ball(g,trim,.42,0,1.34,-.6).scale.z=.33;
      box(g,dark,.075,.46,.035,0,1.08,-.73);box(g,dark,.31,.065,.035,0,1.14,-.73);
    }else if(o.kind==='stall'){
      box(g,wood,2.5,.8,1.65,0,.4);for(const x of[-1.25,1.25])cyl(g,wood,.06,.075,2.7,x,1.35,.7);
      const awning=box(g,mat('awning',0x5a4732),2.9,.06,2.2,0,2.55);awning.rotation.x=-.18;
      for(const [x,z]of[[-.7,.1],[.3,-.3],[.8,.3]])box(g,mat('crates',0x786043),.42,.36,.46,x,1,z);
    }else if(o.kind==='tree'){
      cyl(g,wood,.09,.34,3.7,0,1.6);for(const side of[-1,1])barBetween(g,wood,new THREE.Vector3(0,1.9,0),new THREE.Vector3(side*1.5,3.1,.5),.07);
      barBetween(g,wood,new THREE.Vector3(0,2.4,0),new THREE.Vector3(.2,3.9,-1),.065);
    }else if(o.kind==='altar'){
      cyl(g,stone,.56,.75,.8,0,.4);box(g,trim,1.4,.19,1.2,0,.88);
    }else{
      for(let i=0;i<4;i++){const b=mesh(g,'DodecahedronGeometry',[.55,0],stone,Math.sin(i*2)*.4,.24,Math.cos(i*2)*.4);b.scale.y=.6;b.rotation.set(i*.4,i,i*.3);}
    }
  }
  function arch(x,z,width=5,height=5,rot=0){
    const g=add(x,z,width);g.rotation.y=rot;const r=width/2;
    for(const side of[-1,1]){box(g,stone,.85,height,.9,side*r,height/2);box(g,trim,1.1,.18,1.2,side*r,height);}
    for(let j=0;j<9;j++){const a=j/8*Math.PI,b=box(g,j%2?stone:trim,.75,.65,.9,Math.cos(a)*r,height+Math.sin(a)*r*.8);b.rotation.z=a;}
    return g;
  }
  arch(0,49,8,5);arch(-17,11,6,3.5,Math.PI/2);arch(17,11,6,3.5,Math.PI/2);
  arch(0,-54.3,14.5,4.2);arch(0,-98,11,4.5);arch(0,-134,11,7);
  // Collapsed cloister arcades sit outside the central route.
  for(const z of[-69,-80,-90]){arch(-19.7,z,5,3.3,Math.PI/2);arch(19.7,z,5,3.3,Math.PI/2);}
  const gate=add(0,-56,9);for(let x=-7.6;x<=7.6;x+=.65){box(gate,iron,.07,4.6,.13,x,2.3);cone(gate,gold,.1,.24,x,4.72);}box(gate,iron,15.8,.15,.15,0,.6);box(gate,iron,15.8,.15,.15,0,3.7);
  for(const seal of LEVEL.seals){
    const g=add(seal.x,seal.z,3,false);const ward=mesh(g,'OctahedronGeometry',[.32],gold,0,1.65);ward.castShadow=false;
    const ring=mesh(g,'RingGeometry',[1.2,1.25,40],new THREE.MeshBasicMaterial({color:0xe9bf71,transparent:true,opacity:.7,side:THREE.DoubleSide}),0,.018);ring.rotation.x=-Math.PI/2;seals.set(seal.id,{g,ward});
  }
  const shrine=add(LEVEL.shrine.x,LEVEL.shrine.z,4,false),shrineMat=mat('shrine',0x91ba9a,.15,.5,0x214536);
  cyl(shrine,stone,1.4,1.6,.16,0,.04,0,12);const crystal=mesh(shrine,'OctahedronGeometry',[.46],shrineMat,0,1.15);crystal.scale.y=1.8;
  const halo=mesh(shrine,'RingGeometry',[2.4,2.47,48],new THREE.MeshBasicMaterial({color:0x98c6a2,transparent:true,opacity:.65,side:THREE.DoubleSide}),0,.018);halo.rotation.x=-Math.PI/2;
  const breach=add(LEVEL.exit.x,LEVEL.exit.z,5,false),breachMat=new THREE.MeshBasicMaterial({color:0xb94127,transparent:true,opacity:.8});
  const portal=mesh(breach,'TorusGeometry',[1.5,.12,8,48],breachMat,0,1.9);portal.scale.y=1.25;
  for(const side of[-1,1]){cyl(breach,dark,.25,.45,3.2,side*1.9,1.6);cone(breach,gold,.24,.6,side*1.9,3.5);}
  const nave=add(0,-140,24);box(nave,dark,32,7,2,0,3);for(const x of[-12,12]){box(nave,stone,3,12,4,x,5.4);cone(nave,trim,2.4,6,x,14);}
  const bell=cyl(nave,mat('bronze',0x9c7843,.7,.5),.65,1.3,1.8,0,6.2,1.5);ball(nave,iron,.15,0,5.15,1.5);box(nave,wood,8,.4,.6,0,7.45,1.5);
  const entrance=add(-11,45,5);box(entrance,wood,2.5,.75,1.7,0,.75);for(const x of[-1.2,1.2])cyl(entrance,iron,.45,.45,.14,x,.4).rotation.z=Math.PI/2;
  for(const [x,z]of[[-10,36],[10,22],[-20,13],[20,13],[-41,-9],[42,-10],[-6,-20],[6,-43],[-6,-59],[6,-68],[-17,-82],[17,-82],[-6,-101],[6,-111],[-7,-130]]){
    const g=add(x,z,3,false);cyl(g,iron,.12,.2,1.3,0,.65);cyl(g,iron,.36,.18,.26,0,1.36);
    const flame=cone(g,new THREE.MeshBasicMaterial({color:0xffbb5f,transparent:true,opacity:.92}),.17,.75,0,1.82);flame.castShadow=false;torchFlames.push(flame);
    const light=new THREE.PointLight(0xff9140,12,8,1.5);light.position.set(x,2,z);scene.add(light);lights.push(light);
  }
  // Baked rubble clusters are instanced to keep the enlarged environment light.
  const rubble=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),stone,edges.length*3),dummy=new THREE.Object3D();
  let n=0;for(const edge of edges)for(let i=0;i<3;i++){const t=(i+.5)/3;dummy.position.set(edge.x1+(edge.x2-edge.x1)*t,.05,edge.z1+(edge.z2-edge.z1)*t);dummy.scale.set(.25,.15,.35);dummy.rotation.set(i,.3*n,i*.3);dummy.updateMatrix();rubble.setMatrixAt(n++,dummy.matrix);}scene.add(rubble);rubble.receiveShadow=true;
  for(const group of occluders){group.userData.occluder=true;group.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.transparent=true;}});}
  return {chunks,lights,seals,gate,shrine,crystal,breach,portal,bell};
}
