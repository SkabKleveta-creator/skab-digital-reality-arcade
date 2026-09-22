import * as THREE from './vendor/three.module.js';
export const TILE=2.4;
const geometries=new Map(),materials=new Map();
function geo(key,f){if(!geometries.has(key))geometries.set(key,f());return geometries.get(key);}
function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.92,metalness:0}));return materials.get(color);}
export function box(g,x,y,z,w,h,d,color,ry=0){const o=new THREE.Mesh(geo('box',()=>new THREE.BoxGeometry(1,1,1)),mat(color));o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.y=ry;g.add(o);return o;}
export function cylinder(g,x,y,z,r1,r2,h,color,sides=8){const k=`c-${r1}-${r2}-${h}-${sides}`,o=new THREE.Mesh(geo(k,()=>new THREE.CylinderGeometry(r1,r2,h,sides)),mat(color));o.position.set(x,y,z);g.add(o);return o;}
function sphere(g,x,y,z,r,color){const o=new THREE.Mesh(geo('ico',()=>new THREE.IcosahedronGeometry(1,0)),mat(color));o.position.set(x,y,z);o.scale.setScalar(r);g.add(o);return o;}
function beam(g,a,b,width,color){const d=new THREE.Vector3().subVectors(b,a);const o=box(g,0,0,0,width,d.length(),width,color);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
const C={stone:'#b6b5a5',light:'#d9d6c5',dark:'#8f948c',wood:'#75523b',roof:'#354958',red:'#9b4142',gold:'#d2b276',window:'#384448',grass:'#738a4f'};
function roof(g,x,y,z,w,d,color=C.roof){const h=w*.55;const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,h);shape.closePath();const o=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1}),mat(color));o.position.set(x,y,z-d/2);g.add(o);return o;}
function door(g,x,y,z,w=.38,h=.75){box(g,x,y+h/2,z,w,h,.04,C.wood);cylinder(g,x+w*.25,y+h*.5,z+.04,.025,.025,.03,C.gold,5).rotation.x=Math.PI/2;}
function windows(g,x,y,z,w,d,rows=2){for(let row=0;row<rows;row++)for(let n=-1;n<=1;n++){const yy=y+row*.75;box(g,x+n*w*.28,yy,z+d/2+.015,.15,.35,.035,C.window);box(g,x+w/2+.015,yy,z+n*d*.28,.035,.35,.15,C.window);}}
function crenels(g,x,y,z,w,d,step=.55){for(let a=-w/2+.18;a<w/2;a+=step){box(g,x+a,y,z-d/2,.28,.42,.31,C.light);box(g,x+a,y,z+d/2,.28,.42,.31,C.light);}for(let a=-d/2+.25;a<d/2-.1;a+=step){box(g,x-w/2,y,z+a,.31,.42,.28,C.light);box(g,x+w/2,y,z+a,.31,.42,.28,C.light);}}
function flag(g,x,y,z,scale=1){cylinder(g,x,y+scale*.7,z,.025,.035,scale*1.6,'#4f5147',6);box(g,x+scale*.36,y+scale*1.24,z,scale*.69,scale*.45,.025,C.red);box(g,x+scale*.35,y+scale*1.24,z+.018,.065,scale*.24,.018,C.gold);}
function tower(g,x,z,h=3.8,r=.66,roofed=false){cylinder(g,x,h/2,z,r,r*1.07,h,C.stone,8);cylinder(g,x,h-.08,z,r*1.17,r*1.13,.28,C.light,8);cylinder(g,x,h+.05,z,r*.9,r*.9,.12,C.dark,8);for(let i=0;i<8;i++){const a=i*Math.PI/4;box(g,x+Math.sin(a)*r,h+.33,z+Math.cos(a)*r,.27,.46,.27,C.light,a);}for(let i=0;i<4;i++){const a=i*Math.PI/2;box(g,x+Math.sin(a)*(r+.01),h*.63,z+Math.cos(a)*(r+.01),.12,.48,.045,C.window,a);}if(roofed)cylinder(g,x,h+.65,z,.03,r*1.17,1.4,C.roof,8);}
function cottage(g,w=1.6,d=1.55,h=1.3,level=1){box(g,0,.13,0,w+.18,.26,d+.18,C.dark);box(g,0,.26+h/2,0,w,h,d,'#d8c9ac');roof(g,0,h+.3,0,w+.35,d+.32);for(const x of[-w/2+.05,w/2-.05])box(g,x,h/2+.27,d/2+.025,.09,h,.06,C.wood);for(let i=0;i<level;i++)box(g,0,.3+i*.7,d/2+.04,w,.09,.07,C.wood);door(g,-w*.15,.25,d/2+.065);windows(g,0,.88,d*.01,w,d,Math.max(1,level));box(g,w*.27,h+.85,-d*.25,.27,1.1,.3,C.stone);}
function tree(g,x,z,s=1,variant=0){cylinder(g,x,s*.5,z,.095*s,.15*s,s,'#745e42',5);if(variant<.45){for(let i=0;i<3;i++)cylinder(g,x,(1+i*.43)*s,z,.02,(.65-i*.13)*s,1.1*s,['#446949','#547750','#65834f'][i],6);}else{sphere(g,x,1.5*s,z,.8*s,'#67814f');sphere(g,x+.3*s,1.7*s,z-.1*s,.64*s,'#809354');}}
export function makeBuilding(type,level=1,rotation=0){const g=new THREE.Group(),h=1+(level-1)*.24;
 if(type==='keep'){
  box(g,0,.3,0,6.4,.6,6.4,C.dark);box(g,0,2.1*h,0,4.75,3.8*h,4.4,C.stone);box(g,0,4*h,0,4.95,.3,4.65,C.light);crenels(g,0,4*h+.3,0,4.7,4.5);windows(g,0,1.3,0,4.75,4.4,Math.round(3*h));door(g,0,.58,2.24,.7,1.65);box(g,0,.34,2.85,1.45,.32,1.4,C.light);
  box(g,0,4.45*h,-.2,2.9,1.2*h,2.8,C.stone);roof(g,0,5.1*h,-.2,3.3,3.2,C.roof);for(const [x,z]of[[-2.5,-2.4],[2.5,-2.4],[-2.5,2.4],[2.5,2.4]])tower(g,x,z,4.5*h,.67,true);flag(g,0,6.8*h,-.2,1.2);box(g,.4,2.5,2.235,.65,1.7,.035,C.red);box(g,.4,2.5,2.26,.12,.65,.02,C.gold);
 }else if(type==='tower'){tower(g,0,0,3.6*h,.76,level===3);flag(g,0,3.95*h,0,.8);}
 else if(type==='wall'){
  box(g,0,1.03*h,0,TILE,2.06*h,.62,C.stone);box(g,0,2.1*h,0,TILE,.17,.87,C.light);for(let x=-.98;x<1.2;x+=.59)box(g,x,2.4*h,0,.32,.47,.78,C.light);for(let y=.55;y<2*h;y+=.6)box(g,0,y,.317,TILE,.022,.025,C.dark);
 }else if(type==='palisade'){for(let x=-1.1;x<1.2;x+=.26){cylinder(g,x,.95,0,.11,.13,1.9,'#795b3e',5);cylinder(g,x,2.04,0,0,.115,.3,'#c09c65',5);}box(g,0,.7,.13,2.4,.13,.15,'#b29463');box(g,0,1.4,.13,2.4,.13,.15,'#b29463');}
 else if(type==='gate'){
  for(const x of[-1.6,1.6]){box(g,x,1.8*h,0,1.2,3.6*h,1.35,C.stone);crenels(g,x,3.85*h,0,1.2,1.35);}
  box(g,0,3.05*h,0,3.8,1.2,1.05,C.stone);crenels(g,0,3.87*h,0,3.3,1.2);for(let x=-.8;x<=.8;x+=.22)box(g,x,1.2,.26,.085,2.4,.085,'#655846');for(const y of[.6,1.2,1.8])box(g,0,y,.26,1.8,.085,.085,'#655846');flag(g,-1.6,4*h,0,.7);flag(g,1.6,4*h,0,.7);
 }else if(type==='cottage'){cottage(g,1.6,1.5,1.2+(level-1)*.75,level);}
 else if(type==='manor'){cottage(g,3.7,1.65,2.3+(level-1)*.8,level+1);}
 else if(type==='farm'){
  box(g,0,.08,0,4.6,.16,4.6,'#8c7147');for(let z=-2;z<=2;z+=.42){box(g,0,.15,z,4.3,.14,.13,'#b39a55');for(let x=-1.9;x<2;x+=.45){box(g,x,.32,z,.025,.34,.025,'#d4bc71');box(g,x,.48,z,.12,.12,.06,'#d9c878');}}
  const shed=new THREE.Group();cottage(shed,1.05,1.05,.8,1);shed.position.set(-1.45,0,-1.5);g.add(shed);cylinder(g,1.3,1.25,-1.35,.42,.65,2.5,C.light,7);cylinder(g,1.3,2.77,-1.35,0,.66,.85,C.roof,7);const arms=new THREE.Group();arms.name='windmill';arms.position.set(1.3,2.3,-.91);for(let i=0;i<4;i++){const a=new THREE.Group();box(a,0,.66,0,.12,1.35,.08,'#7a6143');box(a,.14,.87,.02,.3,.76,.04,'#e5d6ac');a.rotation.z=i*Math.PI/2;arms.add(a);}g.add(arms);
 }else if(type==='lumber'){
  box(g,0,.05,0,4.6,.1,4.6,'#8f8665');const shed=new THREE.Group();cottage(shed,2.1,1.5,1.1);shed.position.set(-.8,0,-.8);g.add(shed);for(let i=0;i<5;i++){const log=cylinder(g,.7,.3+(i%2)*.35,.2+Math.floor(i/2)*.53,.18,.2,2.1,'#836342',7);log.rotation.z=Math.PI/2;}for(let i=0;i<3;i++)box(g,-.9+i*.5,.7,1.4,.18,1.4,.18,C.wood);box(g,-.4,1.4,1.4,1.4,.1,.12,C.wood);
 }else if(type==='quarry'||type==='mine'){
  box(g,0,-.05,0,4.6,.25,4.6,'#8b918a');for(let i=0;i<9;i++){const x=(i%3-1)*1.25,z=(Math.floor(i/3)-1)*1.15;const rock=sphere(g,x,.4+(i%3)*.22,z,.7+(i%2)*.25,type==='mine'?'#6c7778':'#a6ada5');rock.scale.y*=.7;}
  box(g,0,1.05,1.2,1.6,1.4,.3,C.wood);box(g,0,.88,1.39,1.1,1.1,.08,'#344246');box(g,-.9,1.2,1.2,.16,2.4,.16,C.wood);box(g,.9,1.2,1.2,.16,2.4,.16,C.wood);box(g,0,2.4,1.2,2.15,.2,.25,C.wood);
 }else if(type==='well'){
  cylinder(g,0,.36,0,.58,.63,.72,C.stone,10);cylinder(g,0,.74,0,.46,.46,.04,'#5c858f',10);for(const x of[-.58,.58])box(g,x,1.1,0,.12,1.6,.12,C.wood);roof(g,0,1.8,0,1.6,1.3);}
 else if(type==='garden'){
  box(g,0,.02,0,2.2,.1,2.2,'#89965a');box(g,0,.1,0,2.2,.04,.35,'#b7a582');box(g,0,.1,0,.35,.04,2.2,'#b7a582');for(const x of[-.65,.65])for(const z of[-.65,.65]){box(g,x,.18,z,.55,.22,.55,'#9f8354');for(let i=0;i<3;i++)sphere(g,x+(i-1)*.15,.4,z,.13,['#b9ac7c','#a97b8e','#d0b779'][i]);}
 }else if(type==='chapel'){
  box(g,0,1.1,0,2.2,2.2,3.6,C.light);roof(g,0,2.25,0,2.7,4,C.roof);box(g,0,1.9,1.6,1.1,3.8,1.1,C.stone);cylinder(g,0,4.35,1.6,0,.9,1.7,C.roof,4);box(g,0,5.34,1.6,.08,.6,.08,C.gold);box(g,0,5.42,1.6,.4,.08,.08,C.gold);door(g,0,0,2.17,.5,1.2);windows(g,0,1,0,2.2,3.6,2);
 }else if(type==='barracks'||type==='infirmary'||type==='granary'||type==='market'){
  cottage(g,3.7,1.7,type==='granary'?1.7:1.4,1);if(type==='barracks'){flag(g,-1.4,2.5,.3,.85);for(let i=0;i<4;i++)box(g,-1.25+i*.25,.65,1.15,.035,1.3,.04,C.wood);}
  if(type==='infirmary'){box(g,0,1.35,.88,.57,.35,.03,'#d9e3d3');box(g,0,1.35,.91,.12,.25,.025,'#5f7c70');}
  if(type==='granary'){for(let i=0;i<4;i++)cylinder(g,-1.5+i*.8,.35,1.15,.23,.28,.7,'#c2a774',8);}
  if(type==='market'){for(let i=0;i<6;i++)box(g,-1.7+i*.58,1.45,1.1,.58,.075,.85,i%2?'#c2ae85':C.red);box(g,0,.58,1.25,3.5,.2,.5,C.wood);}
 }else if(type==='smithy'){
  cottage(g,1.6,1.5,1.25);box(g,.6,1.7,-.3,.4,3.4,.45,C.dark);box(g,-.3,.4,1,.55,.4,.25,'#555d5d');box(g,.7,.5,.75,.6,.6,.5,'#a36b47');box(g,.7,.68,1.01,.3,.2,.02,'#e3a863');
 }else if(type==='stables'){
  cottage(g,3.7,3.2,1.7);for(let i=0;i<3;i++){door(g,-1.15+i*1.1,0,1.65,.72,1.25);box(g,-1.15+i*1.1,.4,1.9,.46,.36,.5,'#8d6b46');}
 }else if(type==='siege'){
  box(g,0,.1,0,4.5,.2,4.5,'#a49b7f');for(const x of[-1.3,1.3])for(const z of[-1.4,1.4]){const wheel=cylinder(g,x,.5,z,.48,.48,.2,'#73563f',10);wheel.rotation.z=Math.PI/2;}
  box(g,0,.65,0,2.7,.3,3.3,C.wood);for(const x of[-.8,.8])beam(g,new THREE.Vector3(x,.75,1),new THREE.Vector3(x,2.5,0),.2,C.wood);const arm=box(g,0,2.4,-.25,.18,3.5,.22,C.wood);arm.rotation.x=-.7;box(g,0,3.7,-1.3,.85,.28,.7,C.wood);
 }else if(type==='road'){box(g,0,.015,0,TILE,.03,TILE,'#b3a588');for(let i=0;i<5;i++)box(g,(i%3-.8)*.6,.04,(Math.floor(i/3)-.6)*.7,.45,.025,.45,'#c1b395');}
 g.rotation.y=rotation*Math.PI/2;return g;
}
export function makeScaffold(w,d){const g=new THREE.Group();box(g,0,.04,0,w-.15,.12,d-.15,'#a89470');for(const x of[-w/2+.2,w/2-.2])for(const z of[-d/2+.2,d/2-.2]){box(g,x,1.4,z,.12,2.8,.12,C.wood);box(g,x,2.4,z,.18,.15,d*.2,'#b28d61');}for(const y of[.5,1.5,2.5]){box(g,0,y,d/2-.2,w-.2,.12,.12,C.wood);box(g,0,y,-d/2+.2,w-.2,.12,.12,C.wood);}beam(g,new THREE.Vector3(-w/2+.2,.3,d/2-.2),new THREE.Vector3(w/2-.2,2.5,d/2-.2),.08,C.wood);box(g,0,.35,0,w*.5,.55,d*.5,'#b7b29c');return g;}
export function mergeMeshes(root){
 root.updateMatrixWorld(true);const positions=[],normals=[],colors=[];let meshes=0;
 root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();a.applyMatrix4(o.matrixWorld);const p=a.getAttribute('position'),n=a.getAttribute('normal'),color=o.material.color||new THREE.Color('#ffffff');for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n?n.getX(i):0,n?n.getY(i):1,n?n.getZ(i):0);colors.push(color.r,color.g,color.b);}a.dispose();meshes++;});
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.sourceMeshes=meshes;return mesh;
}
export function landscapeDecor(g,state,terrain,noise,occupied){
 for(let x=0;x<36;x++)for(let z=0;z<36;z++){if(occupied.has(`${x},${z}`))continue;const n=noise(x,z),t=terrain(x,z),wx=(x-18)*TILE+TILE/2,wz=(z-18)*TILE+TILE/2;if(t==='forest'){tree(g,wx,wz,.8+n*.6,n);if(n<.1)tree(g,wx+.7,wz-.5,.55,.6);}else if(t==='rock'){const r=sphere(g,wx,.3,wz,.55,'#9aa596');r.scale.set(1,.65,1.1);sphere(g,wx+.45,.18,wz+.5,.29,'#a4ab9b');}}
 for(let i=0;i<14;i++){const x=-40+i*6.5,z=-48+noise(i,70)*4;const r=sphere(g,x,1.5,z,5+noise(i,90)*5,'#8b9c83');r.scale.y=.6;}
}
