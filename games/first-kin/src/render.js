/* Human atlas rendering and deterministic, code-drawn settlement/field terrain. */
const View=(()=>{
 let atlases=[];
 const faces=[[279,20,94,118],[712,35,104,124],[1182,16,119,123],[251,532,121,118],[714,531,108,117],[1200,548,104,110],[269,14,106,109],[726,9,108,112],[1156,15,119,112],[266,534,120,118],[699,528,120,122],[1184,532,119,120]];
 const fallbackArt=[3,2,3,2,1,2];
 function assets(a){atlases=a}
 function metrics(W,H,camera={}){const z=camera.zoom||1,tw=Math.min(W/14.9,(H-90)/7.9,78),th=tw*.49,ox=W*.49-tw,oy=Math.max(28,(H-14*th)/2);return{tw:tw*z,th:th*z,ox:W/2+(ox-W/2)*z+(camera.dx||0),oy:H/2+(oy-H/2)*z+(camera.dy||0)}}
 function project(x,y,m){return{x:m.ox+(x-y)*m.tw/2,y:m.oy+(x+y)*m.th/2}}
 function unproject(x,y,m){const xx=(x-m.ox)/(m.tw/2),yy=(y-m.oy)/(m.th/2);return{x:Math.round((xx+yy)/2),y:Math.round((yy-xx)/2)}}
 function path(ctx,pts,fill,stroke){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
 function ellipse(ctx,x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
 function line(ctx,pts,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
 function text(ctx,str,x,y,size=12,color='#dddbc4',align='center'){ctx.font=`${size}px system-ui, sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(str,x,y)}
 function terrain(ctx,x,y,t,m,time,winter=false){const p=project(x,y,m),h=m.th/2,w=m.tw/2;const colors=t==='water'?['#3c686a','#477677']:winter?['#8c9582','#939c86']:['#687555','#707b58'];
  path(ctx,[[p.x,p.y-h],[p.x+w,p.y],[p.x,p.y+h],[p.x-w,p.y]],colors[(x+y)%2],'#192c1718');
  if(t==='water'){for(let i=0;i<2;i++)line(ctx,[[p.x-w*.55,p.y+i*4],[p.x+w*.5,p.y+i*4+Math.sin(time+i+x)*1.5]],'#a4c5b238',1)}
  else if((x*13+y*17)%3===0){for(let i=0;i<4;i++){const xx=p.x+((x*31+y*19+i*13)%30-15)*m.tw/65,yy=p.y+((i*3)%9-3);line(ctx,[[xx,yy],[xx+2,yy-3]],winter?'#b4baa44a':'#a4ad783d',1)}}
 }
 function tree(ctx,p,scale,time){ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);ellipse(ctx,5,4,20,7,'#14291655');path(ctx,[[-4,0],[-3,-33],[4,-33],[6,1]],'#60543b');for(let i=0;i<3;i++){const yy=-30-i*13;path(ctx,[[-25+i*4,yy+10],[0,yy-28],[26-i*4,yy+10]],['#314c38','#3d5d40','#4b6744'][i]);line(ctx,[[0,yy-24],[12,yy+4]],'#80926b33',1)}ctx.restore()}
 function rock(ctx,p,sc){ctx.save();ctx.translate(p.x,p.y);ctx.scale(sc,sc);path(ctx,[[-19,2],[-15,-17],[-3,-28],[14,-20],[24,-1],[5,9]],'#777967');path(ctx,[[-15,-17],[-3,-28],[14,-20],[3,-9]],'#a0a18a');ctx.restore()}
 function fire(ctx,p,size,time){ellipse(ctx,p.x,p.y+1,size*.8,size*.32,'#efb55822');line(ctx,[[p.x-size*.5,p.y+2],[p.x+size*.5,p.y-2]],'#725132',3);line(ctx,[[p.x-size*.4,p.y-3],[p.x+size*.4,p.y+4]],'#423424',3);path(ctx,[[p.x-size*.4,p.y],[p.x-size*.24,p.y-size*.65],[p.x,p.y-size*(1.25+.12*Math.sin(time*9))],[p.x+size*.16,p.y-size*.53],[p.x+size*.43,p.y],[p.x,p.y+3]],'#d9813f');path(ctx,[[p.x-size*.18,p.y],[p.x+size*.05,p.y-size*.75],[p.x+size*.25,p.y],[p.x,p.y+2]],'#f4d28a')}
 function building(ctx,b,m,s,time){const p=project(b.x,b.y,m),sc=m.tw/65;ctx.save();ctx.translate(p.x,p.y);ctx.scale(sc,sc);
  if(b.type==='hearth'){fire(ctx,{x:0,y:0},s.fire>0?20:3,time);for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(ctx,Math.cos(a)*20,Math.sin(a)*8,4,2,'#868672')}ctx.restore();return}
  if(b.type==='cave'){path(ctx,[[-58,5],[-49,-39],[-29,-67],[12,-69],[43,-40],[48,4]],'#777360');path(ctx,[[-49,-39],[-29,-67],[12,-69],[34,-45],[-4,-40]],'#99917a');ctx.fillStyle='#2c3428';ctx.beginPath();ctx.ellipse(0,-10,22,33,0,Math.PI,0);ctx.lineTo(22,10);ctx.lineTo(-22,10);ctx.fill();ellipse(ctx,0,10,22,5,'#273125');ctx.restore();return}
  if(!b.done){path(ctx,[[-28,8],[0,22],[30,7],[0,-8]],'#3d483044','#baae7488');for(const[x,y]of[[-23,7],[0,17],[23,5]])line(ctx,[[x,y],[x,y-22]],'#ad9369',3);line(ctx,[[-23,-15],[23,-17]],'#c0ad7c',2);text(ctx,`${b.work}/${Kin.buildings[b.type].work}`,0,-29,11,'#f1d899');ctx.restore();return}
  if(b.type==='hut'){ellipse(ctx,2,5,33,13,'#21351e55');path(ctx,[[-31,3],[-21,-38],[0,-54],[29,-26],[32,6],[0,19]],'#ad8755');path(ctx,[[0,-54],[29,-26],[32,6],[0,19]],'#8d693e');path(ctx,[[-31,3],[-21,-38],[0,-54],[2,16]],'#b89b67');path(ctx,[[-9,12],[-8,-8],[0,-20],[9,-7],[11,12]],'#342d22');line(ctx,[[-31,3],[0,-54],[32,6]],'#d2b783',2);line(ctx,[[-21,-38],[17,2]],'#715034',1)}
  if(b.type==='storage'||b.type==='workshop'){const shop=b.type==='workshop';path(ctx,[[-32,2],[-31,-22],[4,-38],[37,-17],[36,11],[4,26]],shop?'#7b7755':'#9b8056');path(ctx,[[-39,-22],[2,-51],[43,-20],[4,0]],'#bbaa70');path(ctx,[[2,-51],[43,-20],[4,0]],'#8d8458');line(ctx,[[-30,-20],[-29,4]],'#554631',3);line(ctx,[[35,-19],[34,12]],'#554631',3);ellipse(ctx,0,8,11,5,'#b5a16b');if(shop){rock(ctx,{x:7,y:4},.45);line(ctx,[[-10,0],[8,-9]],'#755f39',3)}}
  if(b.type==='well'){ellipse(ctx,0,3,23,12,'#9e9981');ellipse(ctx,0,-3,23,12,'#aaa38a');ellipse(ctx,0,-4,15,7,'#344e4b');for(const x of[-23,24])line(ctx,[[x,0],[x,-35]],'#82704c',4);line(ctx,[[-24,-35],[25,-35]],'#a18a5d',5);line(ctx,[[4,-35],[4,-10]],'#d1bd8a',1)}
  if(b.type==='drying'){for(const x of[-24,24])line(ctx,[[x,6],[x,-38]],'#9c845a',4);line(ctx,[[-27,-35],[28,-35]],'#ad9564',4);for(let i=-1;i<=1;i++){line(ctx,[[i*15,-35],[i*15,-16]],'#c6b47f',1);path(ctx,[[i*15-5,-25],[i*15+6,-24],[i*15+5,-9],[i*15-4,-8]],'#98634a')}fire(ctx,{x:0,y:8},10,time)}
  if(b.type==='garden'){path(ctx,[[-30,0],[0,-15],[31,1],[0,17]],'#4b4a2f');for(let i=-2;i<=2;i++)line(ctx,[[-20+i*5,-5+i*3],[i*5+7,i*3+9]],'#2e352477',2);if(b.planted)for(let i=0;i<7;i++){const x=(i%3-1)*12,y=Math.floor(i/3)*5-5,h=5+b.growth*3;line(ctx,[[x,y],[x,y-h]],'#9da75b',2);line(ctx,[[x,y-h*.5],[x-5,y-h*.8]],b.growth>=4?'#c5b16a':'#7a9c53',2)}}
  if(b.type==='circle'){for(let i=0;i<9;i++){const a=i*6.28/9;rock(ctx,{x:Math.cos(a)*29,y:Math.sin(a)*14},.25)}fire(ctx,{x:0,y:0},15,time)}
  ctx.restore();if(!b.region&&!Kin.connected(s,b))text(ctx,'Needs path',p.x,p.y+20*sc,Math.max(9,10*sc),'#f0c68d');
 }
 function human(ctx,a,x,y,size,time=0,moving=false,selected=false){const source=a.art<6?a.art:fallbackArt[a.art-6],img=atlases[0];if(!img||!img.width)return;const sx=(source%3)*512,sy=Math.floor(source/3)*512;ctx.save();ctx.translate(x,y);const phase=time*8+(a.art||0);const bob=moving?Math.abs(Math.sin(phase))*2:Math.sin(time*1.7+(a.art||0))*.45;ellipse(ctx,0,1,size*.14,size*.045,selected?'#edcd8c88':'#16271877');if(selected){ctx.strokeStyle='#edcf89';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,1,size*.17,size*.065,0,0,6.28);ctx.stroke()}
  if(a.art>=6)ctx.filter='sepia(.15)';ctx.translate(0,-bob);if(moving){const cut=346,ratio=cut/512;ctx.drawImage(img,sx,sy,512,cut,-size/2,-size,size,size*ratio);for(let i=0;i<2;i++){const step=Math.sin(phase+(i?Math.PI:0))*2;ctx.drawImage(img,sx+i*256,sy+cut,256,512-cut,-size/2+i*size/2+step,-size*(1-ratio),size/2,size*(1-ratio))}}
  else ctx.drawImage(img,sx,sy,512,512,-size/2,-size,size,size);ctx.restore();
 }
 function portrait(ctx,art,size){ctx.clearRect(0,0,size,size);ctx.save();ctx.beginPath();ctx.arc(size/2,size/2,size/2,0,6.28);ctx.clip();ctx.fillStyle='#443c2c';ctx.fillRect(0,0,size,size);const r=faces[art]||faces[0],img=atlases[art>=6?1:0];if(img?.width)ctx.drawImage(img,...r,0,0,size,size);ctx.restore()}
 function deer(ctx,p,sc,time,down=false){ctx.save();ctx.translate(p.x,p.y);ctx.scale(sc,sc);ellipse(ctx,0,2,22,6,'#182c1755');if(down)ctx.rotate(-.45);for(let i=0;i<4;i++){const x=-13+i*8;line(ctx,[[x,-7],[x+(i%2?2:-2),4+Math.sin(time*7+i)*1.5]],'#614631',2)}ellipse(ctx,0,-15,24,10,'#9b7850');ellipse(ctx,20,-29,8,13,'#a08357');ellipse(ctx,27,-36,9,5,'#ad8e5d');ellipse(ctx,30,-38,1.3,1.3,'#1c281d');line(ctx,[[19,-40],[14,-53],[10,-57]],'#cebd91',2);line(ctx,[[14,-53],[22,-55]],'#cebd91',1.5);line(ctx,[[-22,-15],[-29,-20]],'#d0bd90',2);ctx.restore()}
 function base(ctx,W,H,s){const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,Kin.season(s)==='Winter'?'#61766c':'#788d73');gr.addColorStop(.5,'#3e5941');gr.addColorStop(1,'#1e382c');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);for(let i=0;i<3;i++)path(ctx,[[0,H*.4+i*20],[W*.1,H*.23+i*10],[W*.24,H*.33+i*14],[W*.4,H*.16+i*20],[W*.56,H*.36+i*15],[W*.77,H*.19+i*13],[W,H*.34+i*20],[W,H],[0,H]],['#59745c','#4c684f','#39573e'][i])}
 function draw(ctx,W,H,s,v={},f=null){const time=v.time||0,m=metrics(W,H,v.camera);base(ctx,W,H,s);if(v.scene==='region'){region(ctx,W,H,s,v,time);return m}
  if(f&&f.scene==='fish'){fishing(ctx,W,H,s,f,time);return m}
  const terrainFn=f?(x,y)=>x>=12?'water':!Field.pass(x,y)?'tree':(x*3+y*7)%5<2?'grass':'ground':Kin.terrain;
  for(let y=0;y<12;y++)for(let x=0;x<16;x++)terrain(ctx,x,y,terrainFn(x,y),m,time,Kin.season(s)==='Winter');
  if(!f){for(const k of s.paths){const[x,y]=k.split(',').map(Number),p=project(x,y,m);for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]])if(s.paths.includes((x+dx)+','+(y+dy))||s.buildings.some(b=>b.x===x+dx&&b.y===y+dy)){const q=project(x+dx*.6,y+dy*.6,m);line(ctx,[[p.x,p.y],[q.x,q.y]],'#b1a177',m.tw*.14)}ellipse(ctx,p.x,p.y,m.tw*.1,m.th*.1,'#b1a177')}}
  const things=[];for(let y=0;y<12;y++)for(let x=0;x<12;x++){const t=terrainFn(x,y);if(t==='tree'||t==='rock')things.push({depth:x+y,kind:t,x,y})}
  if(!f){s.buildings.forEach(b=>things.push({depth:b.x+b.y,kind:'building',b,x:b.x,y:b.y}));Kin.live(s).forEach((a,i)=>{const target=v.actorPositions?.[a.id]||a;things.push({depth:target.x+target.y+.3,kind:'human',a,x:target.x,y:target.y,moving:target.moving})})}
  else {f.actors.forEach(a=>things.push({depth:a.x+a.y+.3,kind:'human',a,x:a.x,y:a.y,moving:f.phase==='hunt'}));things.push({depth:f.prey.x+f.prey.y,kind:'deer',x:f.prey.x,y:f.prey.y});f.fires.forEach(a=>things.push({depth:a.x+a.y,kind:'fire',x:a.x,y:a.y}))}
  things.sort((a,b)=>a.depth-b.depth).forEach(o=>{const p=project(o.x,o.y,m),sc=m.tw/65;if(o.kind==='tree')tree(ctx,p,sc,time);if(o.kind==='rock')rock(ctx,p,sc);if(o.kind==='building')building(ctx,o.b,m,s,time);if(o.kind==='human'){human(ctx,o.a,p.x,p.y,Math.max(43,84*sc),time,o.moving,v.selected===o.a.id||f?.actors[f.selected]?.id===o.a.id);if(v.selected===o.a.id||f)text(ctx,o.a.name,p.x,p.y+13,Math.max(10,11*sc),'#fff0ce')}
   if(o.kind==='deer')deer(ctx,p,sc,time,f.done&&f.success);if(o.kind==='fire')fire(ctx,p,14*sc,time)
  });
  if(!f&&v.hover&&v.build){const p=project(v.hover.x,v.hover.y,m);path(ctx,[[p.x,p.y-m.th/2],[p.x+m.tw/2,p.y],[p.x,p.y+m.th/2],[p.x-m.tw/2,p.y]],'#e0c38577','#f4daa2');text(ctx,Kin.buildings[v.build].name,p.x,p.y-12,12,'#fff1d1')}
  if(!f){const p=project(11,7,m);text(ctx,'REED RIVER',p.x+25,p.y+35,9,'#c7ddd4');const q=project(5,1,m);text(ctx,'HEARTH VALLEY',q.x,q.y-30,10,'#dce4ca')}
  if(Kin.weather(s)==='Rain'&&!f){ctx.strokeStyle='#d4ded222';ctx.lineWidth=1;for(let i=0;i<35;i++){const x=(i*71+time*21)%W,y=(i*43+time*160)%H;line(ctx,[[x,y],[x-5,y+17]],'#d3e1d32b',1)}}
  if(s.phase==='dinner'&&!f){ctx.fillStyle='#121b372f';ctx.fillRect(0,0,W,H)}return m;
 }
 function fishing(ctx,W,H,s,f,time){const cx=W*.5,cy=H*.5,rx=W*.37,ry=H*.26;ellipse(ctx,cx,cy,rx+20,ry+13,'#817652');ellipse(ctx,cx,cy,rx,ry,'#3d7276');for(let i=0;i<6;i++){ctx.strokeStyle='#a3c9bd38';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,rx*(.23+i*.12),ry*(.23+i*.12),0,0,6.28);ctx.stroke()}
  const px=cx,py=cy+ry+40;human(ctx,f.actors[0],px,py,Math.min(200,H*.37),time,false,true);const biting=f.phase==='biting',bend=biting?20+Math.sin(time*25)*3:0;ctx.strokeStyle='#c0a374';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px+20,py-60);ctx.quadraticCurveTo(px+65,py-160,px+52-bend,cy+15+bend);ctx.stroke();line(ctx,[[px+52-bend,cy+15+bend],[cx+25,cy+30]],'#e1d8b9',1);ellipse(ctx,cx+25,cy+30,biting?8+Math.sin(time*20)*3:3,2,biting?'#e9be71':'#cad3af');
  text(ctx,biting?'PULL NOW':'WATCH THE ROD',W/2,42,18,biting?'#ffe0a0':'#e4e7d1');text(ctx,`${f.caught} caught · ${f.casts}/3 casts`,W/2,70,12,'#ccdec9');
 }
 function regionMetrics(W,H){return{size:Math.min(W/8,H/6.3),ox:W*.15,oy:H*.12}}
 function regionPoint(x,y,m){return{x:m.ox+x*m.size*1.1,y:m.oy+y*m.size*.97+(x%2)*m.size*.45}}
 function region(ctx,W,H,s,v,time){const m=regionMetrics(W,H);for(let y=0;y<5;y++)for(let x=0;x<6;x++){const p=regionPoint(x,y,m),loc=Kin.places.find(p=>p.x===x&&p.y===y),seen=loc&&s.region.seen.includes(loc.id);const pts=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return[p.x+Math.cos(a)*m.size*.61,p.y+Math.sin(a)*m.size*.61]});path(ctx,pts,seen?(loc.type==='river'?'#497975':loc.type==='mountain'?'#929379':'#7d885e'):'#31493a','#a5b38719');if(seen&&loc.type==='forest')tree(ctx,p,.7,time);if(seen&&loc.type==='stone')rock(ctx,p,.8);if(!seen&&loc)text(ctx,'?',p.x,p.y+5,18,'#98ab8b77');if(seen){if(loc.type==='neighbor'){building(ctx,{x:0,y:0,type:'hut',done:true,region:true},{tw:45,th:22,ox:p.x,oy:p.y},s,time)}if(loc.id==='home')fire(ctx,p,20,time);if(s.region.outposts.includes(loc.id))path(ctx,[[p.x-7,p.y],[p.x-7,p.y-22],[p.x+11,p.y-15],[p.x-7,p.y-9]],'#e4c483');text(ctx,loc.name,p.x,p.y+m.size*.37,Math.max(10,Math.min(12,m.size*.16)),'#f3ecd0');if(v.regionSelection===loc.id){ctx.strokeStyle='#eace91';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,m.size*.5,0,6.28);ctx.stroke()}}}
  text(ctx,'THE KNOWN WORLD',W/2,26,11,'#d5dfc6');text(ctx,'Scout to reveal places. Discover exchange to trade and establish outposts.',W/2,H-22,Math.max(10,Math.min(12,W/72)),'#c2d3b7');
 }
 function regionHit(x,y,W,H){const m=regionMetrics(W,H);return Kin.places.find(loc=>{const p=regionPoint(loc.x,loc.y,m);return Math.hypot(p.x-x,p.y-y)<m.size*.58})?.id}
 return{assets,draw,portrait,human,metrics,project,unproject,regionHit};
})();
if(typeof module!=='undefined')module.exports=View;
