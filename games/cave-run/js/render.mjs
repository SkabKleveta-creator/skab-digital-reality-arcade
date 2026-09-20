/* Cave Run — an illustrated, continuous world. Canvas art is authored here;
   all traversable edges are derived from the simulation's actual tile map. */
const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const mix = (a,b,t) => a+(b-a)*t;
const hash = n => { const x = Math.sin(n*127.1+311.7)*43758.5453123; return x-Math.floor(x); };
const RELIC_COLORS=['#e2a869','#b9e5eb','#a5d4bd','#dca67e','#e9dbb4','#9edbd5','#c8d6e2','#cfb5df','#b7c997','#eebc8a'];
const PALETTES = [
  { sky:['#152f34','#66807a','#e9bc80'], sun:'#ffe2a1', far:'#65827c', mid:'#375f5c', near:'#1d4547', rock:'#384849', shade:'#14272c', edge:'#a8b58b', moss:'#6e9979', mist:'#bec5a0', glow:'#ffce7c', night:false },
  { sky:['#1e334a','#778da0','#c1c8c2'], sun:'#e5e9d9', far:'#7c97a0', mid:'#4d6d80', near:'#2b475c', rock:'#3c5362', shade:'#182b3d', edge:'#d4e0d3', moss:'#86afa6', mist:'#c5d5d8', glow:'#bee8ec', snow:true },
  { sky:['#11272b','#42615b','#92a395'], sun:'#d4d7b3', far:'#456660', mid:'#26433c', near:'#172f30', rock:'#354842', shade:'#102426', edge:'#8bac8f', moss:'#7cb49d', mist:'#8fb9a5', glow:'#8fe3c4', night:true },
  { sky:['#303d55','#a9989a','#f5d2a4'], sun:'#ffead1', far:'#8e94a0', mid:'#66728a', near:'#394f64', rock:'#4f535c', shade:'#252a39', edge:'#c6b69b', moss:'#939e82', mist:'#d2c8b6', glow:'#ffcf83' },
  { sky:['#302d35','#8f7167','#d9a271'], sun:'#ffe1a1', far:'#8a766a', mid:'#5c6158', near:'#334a40', rock:'#555042', shade:'#292f2b', edge:'#b6ad7e', moss:'#9d9e62', mist:'#ccbc89', glow:'#ffd16d' },
  { sky:['#183d49','#558d90','#becbbb'], sun:'#e1eed6', far:'#689f9e', mid:'#3b727a', near:'#23505e', rock:'#41616b', shade:'#173442', edge:'#adced0', moss:'#79b8ad', mist:'#acd9d3', glow:'#92dbda', water:true },
  { sky:['#101b32','#283855','#607a88'], sun:'#d2deeb', far:'#344c65', mid:'#253e51', near:'#152c3c', rock:'#2d424e', shade:'#101c2b', edge:'#879fa9', moss:'#659889', mist:'#7eabc5', glow:'#9ceadf', night:true },
  { sky:['#342d4b','#937887','#e5af8a'], sun:'#ffe2b3', far:'#987e8d', mid:'#655d7a', near:'#3c425a', rock:'#515065', shade:'#252739', edge:'#bdb6b5', moss:'#96a699', mist:'#d6b7bb', glow:'#ffcfa1' },
  { sky:['#172c32','#4d6669','#a3aaa0'], sun:'#d3d4b0', far:'#536d6b', mid:'#354e52', near:'#213c43', rock:'#435457', shade:'#1c2e35', edge:'#abb6a5', moss:'#7a9c7e', mist:'#acc3b1', glow:'#b9ddaa', night:true },
  { sky:['#30242d','#83514a','#e39767'], sun:'#ffd98b', far:'#8a6359', mid:'#5f4143', near:'#392f37', rock:'#59463f', shade:'#28242c', edge:'#c79e7d', moss:'#9f8560', mist:'#dd9b79', glow:'#ffb866', ember:true },
];

export class Renderer {
  constructor(canvas) {
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d',{alpha:false});
    this.reducedMotion=false;
    this.width=1280;this.height=720;this.dpr=1;
    this.camera=0;this.cameraStage=-1;this.time=0;this.shake=0;
    this.particles=[];this.eventSerial=0;this.paths=new Map();
    this.resize();
  }
  resize() {
    const rect=this.canvas.getBoundingClientRect();
    this.width=Math.max(1,rect.width||1280);
    this.height=Math.max(1,rect.height||720);
    this.dpr=Math.min(2,globalThis.devicePixelRatio||1);
    this.canvas.width=Math.round(this.width*this.dpr);
    this.canvas.height=Math.round(this.height*this.dpr);
    this.ctx.imageSmoothingEnabled=true;
    this.lastFrozenKey=null;
  }
  path(svg,fill,stroke=null,lineWidth=1) {
    let p=this.paths.get(svg);
    if(!p){
      p=new Path2D(svg);
      // Animated geometry is intentionally uncached: continuous poses must not
      // retain one Path2D per frame for the lifetime of a campaign.
      if(!/\d\.\d{4}/.test(svg)){
        if(this.paths.size>=384)this.paths.delete(this.paths.keys().next().value);
        this.paths.set(svg,p);
      }
    }
    const c=this.ctx;
    if(fill){c.fillStyle=fill;c.fill(p);}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=lineWidth;c.stroke(p);}
  }
  ellipse(x,y,rx,ry,fill,rot=0) {
    const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.fillStyle=fill;c.fill();
  }
  line(points,color,width=1) {
    const c=this.ctx;c.beginPath();c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
  }
  addEvents(events=[]) {
    for(const e of events){
      const n=++this.eventSerial;
      if(e.type==='hurt')this.shake=6;
      if(e.type==='hit'||e.type==='boss')this.shake=Math.max(this.shake,3);
      if(e.type==='slam')this.shake=Math.max(this.shake,5);
      let count=0,color='#dfd2a0',lift=12;
      if(e.type==='hit'){count=13;color='#ffd38a';lift=35;}
      if(e.type==='hurt'){count=10;color='#dd846b';lift=27;}
      if(e.type==='land'){count=9;color='#a8ac90';}
      if(e.type==='jump'||e.type==='dodge'){count=6;color='#b3bfac';}
      if(e.type==='pickup'||e.type==='checkpoint'){count=16;color=e.type==='checkpoint'?'#ffce84':'#bff2d1';lift=23;}
      if(e.type==='death'){count=14;color='#b5a290';lift=20;}
      if(e.type==='slam'){count=18;color='#d7ba96';lift=28;}
      if(e.type==='hazardactive'){count=7;color='#e4d2ad';lift=16;}
      for(let i=0;i<count;i++){
        const r=hash(n*79+i*17);
        const feetEvent=e.type==='jump'||e.type==='land'||e.type==='dodge';
        this.particles.push({x:(e.x||0)+(feetEvent?6:0),y:(e.y||0)+(feetEvent?22:0),vx:(r-.5)*50,vy:-lift*(.2+hash(n+i*3)),age:0,life:.3+hash(n+i*7)*.55,size:.25+hash(i+n)*.6,color,gravity:e.type==='pickup'?-8:35});
      }
    }
    if(this.particles.length>180)this.particles.splice(0,this.particles.length-180);
  }
  render(game,dt=0) {
    if(!game?.level||!game.player)return;
    const c=this.ctx,w=this.width,h=this.height;
    const active=game.state==='playing'||game.state==='title';
    const frozenKey=`${game.state}:${game.levelIndex}:${game.player.x}:${game.player.y}:${this.width}:${this.height}`;
    if(!active&&this.lastFrozenKey===frozenKey)return;
    this.lastFrozenKey=active?null:frozenKey;
    const tick=active?Math.min(.05,Math.max(0,dt)):0;
    this.time+=tick;
    this.pal=PALETTES[clamp(game.levelIndex||0,0,9)];
    this.scale=w/clamp(w/h*174,160,322);
    this.view=w/this.scale;
    this.groundScreen=h*(h>w? .70:.76);
    this.originY=this.groundScreen-96*this.scale;
    const p=game.player;
    const aim=clamp(p.x+p.w/2-this.view*.34+(p.facing||1)*11,0,Math.max(0,game.level.width-this.view));
    if(this.cameraStage!==game.levelIndex||Math.abs(this.camera-aim)>this.view*.75){this.camera=aim;this.cameraStage=game.levelIndex;this.particles.length=0;}
    else this.camera=mix(this.camera,aim,this.reducedMotion?1:1-Math.exp(-tick*7));
    const shake=this.reducedMotion?0:this.shake;
    this.shake=Math.max(0,this.shake-tick*30);
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    c.clearRect(0,0,w,h);
    this.background(game);
    c.save();
    c.translate(-this.camera*this.scale+(Math.sin(this.time*74)*shake),this.originY+(Math.cos(this.time*92)*shake*.45));
    c.scale(this.scale,this.scale);
    this.caves(game.level);
    this.environment(game.level,false);
    this.terrain(game.level);
    this.hazards(game.level);
    this.camps(game.level);
    this.goal(game.level,game);
    for(const item of game.level.items||[])if(item.alive&&this.visible(item.x,20))this.item(item);
    if(game.state!=='title')for(const enemy of game.level.enemies||[])if(enemy.alive&&this.visible(enemy.x,enemy.boss?110:55))this.enemy(enemy);
    if(game.state==='title'){
      const hero={...p,x:this.camera+this.view*.68-9,y:58,w:18,h:38,vx:0,vy:0,onGround:true,facing:1,attackTimer:0,dodgeTimer:0,invuln:0};
      this.human(hero,game);
    }else this.human(p,game);
    this.drawParticles(tick);
    this.environment(game.level,true);
    c.restore();
    this.atmosphere(game);
  }
  visible(x,margin=20){return x>this.camera-margin&&x<this.camera+this.view+margin;}
  background(game) {
    const c=this.ctx,w=this.width,h=this.height,p=this.pal,t=this.time;
    let grad=c.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,p.sky[0]);grad.addColorStop(.55,p.sky[1]);grad.addColorStop(1,p.sky[2]);
    c.fillStyle=grad;c.fillRect(0,0,w,h);
    const sx=w*.71-this.camera*this.scale*.018,sy=h*.31;
    grad=c.createRadialGradient(sx,sy,4,sx,sy,w*.38);
    grad.addColorStop(0,p.night?'#b6d4dd22':'#ffe0a248');grad.addColorStop(.35,p.night?'#b6d4dd10':'#edcd9720');grad.addColorStop(1,'#ffdb9900');
    c.fillStyle=grad;c.fillRect(0,0,w,h);
    this.ellipse(sx,sy,h*(p.night?.033:.044),h*(p.night?.033:.044),p.sun);
    if(p.night){
      this.ellipse(sx-7,sy-5,h*.030,h*.030,p.sky[1]);
      for(let i=0;i<65;i++){
        const x=hash(i*91)*w,y=hash(i*27)*h*.46;
        const a=.13+hash(i*31)*.4;
        c.globalAlpha=a;this.ellipse(x,y,.5+hash(i)*.8,.5+hash(i)*.8,'#eff9f4');
      }
      c.globalAlpha=1;
    }
    // Veils of cloud form long soft bands, never a repeating sprite backdrop.
    for(let i=0;i<6;i++){
      const cx=((hash(i*23)*w*1.4-this.camera*this.scale*.035+(this.reducedMotion?0:t*1.6)+w*2)%(w*1.4))-w*.2;
      const cy=h*(.12+hash(i+40)*.32);
      c.globalAlpha=.055;
      this.ellipse(cx,cy,w*(.13+hash(i)*.13),h*.018,p.sun,-.02);
    }
    c.globalAlpha=1;
    this.mountainLayer(.055,h*.55,h*.21,p.far,game.levelIndex*7+4,420);
    this.mountainLayer(.12,h*.66,h*.27,p.mid,game.levelIndex*9+11,350);
    // Weathered pillars rise out of the distant valley.
    for(let layer=0;layer<2;layer++){
      const factor=layer?.26:.16,unit=layer?330:430;
      const off=this.camera*this.scale*factor;
      const start=Math.floor(off/unit)-1;
      for(let i=start;i<start+Math.ceil(w/unit)+3;i++){
        const seed=i+game.levelIndex*23+layer*127;
        const x=i*unit-off+hash(seed)*70;
        const base=h*(layer?.91:.78),height=h*(.14+hash(seed+2)*.3),wide=unit*(.14+hash(seed+3)*.14);
        this.monolith(x,base,wide,height,layer?p.near:p.mid,seed);
      }
    }
    this.mountainLayer(.33,h*.87,h*.13,p.near,game.levelIndex+4,260);
    // Far water catches sky light in the stone river route.
    if(p.water){
      grad=c.createLinearGradient(0,h*.66,0,h*.93);grad.addColorStop(0,'#a0d1cf00');grad.addColorStop(.25,'#a0d1cf66');grad.addColorStop(1,'#397b8270');
      c.fillStyle=grad;c.fillRect(0,h*.65,w,h*.3);
      c.globalAlpha=.3;
      for(let i=0;i<24;i++){const yy=h*(.68+i*.008);const xx=hash(i*13)*w;this.line([[xx,yy],[xx+w*(.025+hash(i)*.09),yy]],p.mist,.5+hash(i)*1.2);}
      c.globalAlpha=1;
    }
    // Tree ferns silhouette against the valley at a separate parallax depth.
    const step=185,offset=this.camera*this.scale*.42;
    const start=Math.floor(offset/step)-1;
    for(let i=start;i<start+Math.ceil(w/step)+3;i++){
      const seed=i+game.levelIndex*35;
      const x=i*step-offset+hash(seed)*80;
      c.save();c.translate(x,h*(.93+hash(i)*.07));c.scale(.8+hash(seed)*.9,.8+hash(seed)*.9);
      this.treeFern(0,0,60+hash(seed+8)*135,p.near,seed);
      c.restore();
    }
    // A little aerial life adds scale to a world larger than its route.
    if(!p.night){
      c.strokeStyle=p.near;c.lineWidth=1.15;c.globalAlpha=.45;
      for(let i=0;i<5;i++){
        const bx=((w*.29+i*29-this.camera*this.scale*.05+t*(this.reducedMotion?0:3)+w*2)%(w*1.2))-30;
        const by=h*.22+Math.sin(i*8)*15;
        const flap=Math.sin(t*3+i)*2;
        c.beginPath();c.moveTo(bx-5,by-flap);c.quadraticCurveTo(bx-2,by-2,bx,by+1);c.quadraticCurveTo(bx+2,by-2,bx+5,by-flap);c.stroke();
      }
      c.globalAlpha=1;
    }
    grad=c.createLinearGradient(0,h*.50,0,h*.92);
    grad.addColorStop(0,p.mist+'00');grad.addColorStop(.55,p.mist+'13');grad.addColorStop(1,p.mist+'00');
    c.fillStyle=grad;c.fillRect(0,h*.5,w,h*.42);
  }
  mountainLayer(parallax,base,amplitude,color,seed,period) {
    const c=this.ctx,w=this.width,off=this.camera*this.scale*parallax;
    c.beginPath();c.moveTo(-30,this.height+1);
    const start=Math.floor(off/period)-1;
    for(let i=start;i<start+Math.ceil(w/period)+4;i++){
      const x=i*period-off;
      const peak=base-amplitude*(.25+hash(i*3+seed)*.8);
      c.lineTo(x,base-amplitude*.15);
      c.lineTo(x+period*.22,peak+amplitude*.14);
      c.lineTo(x+period*.40,peak);
      c.lineTo(x+period*.54,peak+amplitude*.06);
      c.lineTo(x+period*.71,base-amplitude*(.1+hash(i+seed)*.2));
    }
    c.lineTo(w+period,this.height+1);c.closePath();c.fillStyle=color;c.fill();
  }
  monolith(x,base,w,h,color,seed) {
    const c=this.ctx;
    c.beginPath();c.moveTo(x-w*.7,base);c.lineTo(x-w*.42,base-h*.18);c.lineTo(x-w*.34,base-h*.72);c.lineTo(x-w*.15,base-h*.92);c.lineTo(x+w*.02,base-h);c.lineTo(x+w*.36,base-h*.97);c.lineTo(x+w*.48,base-h*.79);c.lineTo(x+w*.40,base-h*.58);c.lineTo(x+w*.65,base-h*.13);c.lineTo(x+w*.95,base);c.closePath();c.fillStyle=color;c.fill();
    c.fillStyle='#e2d5b014';c.beginPath();c.moveTo(x+w*.02,base-h);c.lineTo(x+w*.36,base-h*.97);c.lineTo(x+w*.21,base-h*.74);c.lineTo(x+w*.35,base-h*.37);c.lineTo(x+w*.1,base-h*.18);c.lineTo(x-w*.06,base-h*.57);c.closePath();c.fill();
    for(let i=0;i<4;i++){const y=base-h*(.25+i*.15);this.line([[x-w*.27,y],[x+w*(.22+hash(seed+i)*.2),y+h*.013]],'#101f251a',1.5);}
  }
  treeFern(x,y,size,color,seed=0) {
    const c=this.ctx;c.save();c.translate(x,y);
    this.line([[0,0],[-size*.055,-size*.55],[0,-size]],color,size*.055);
    // One compound silhouette replaces dozens of per-frond draw calls.
    c.beginPath();
    for(let k=0;k<7;k++){
      const a=-Math.PI+.18+k*(Math.PI-.36)/6;
      const tx=Math.cos(a)*size*.52,ty=-size+Math.sin(a)*size*.29;
      c.moveTo(0,-size*.94);c.quadraticCurveTo(tx*.42,-size*1.19,tx,ty);c.quadraticCurveTo(tx*.42,-size*1.14,0,-size*.91);
      for(let j=1;j<8;j++){
        const u=j/8,px=tx*u,py=-size*.94+(ty+size*.94)*u-Math.sin(u*Math.PI)*size*.15;
        c.moveTo(px,py);c.lineTo(px+Math.sign(tx)*size*.035,py+size*(.15*(1-u)+.03));c.lineTo(px+tx*.11,py+size*.005);c.closePath();
      }
    }
    c.fillStyle=color;c.fill();c.restore();
  }
  caves(level) {
    const c=this.ctx,p=this.pal,lo=Math.max(0,Math.floor(this.camera/16)-2),hi=Math.min(level.cols.length,Math.ceil((this.camera+this.view)/16)+2);
    for(let col=lo;col<hi;){
      if(!level.caveFlags?.[col]){col++;continue;}
      let end=col+1;while(end<hi&&level.caveFlags[end])end++;
      const x=col*16,r=end*16;
      const fade=c.createLinearGradient(x,0,r,0);fade.addColorStop(0,'#12272b22');fade.addColorStop(Math.min(.12,16/(r-x)),'#10272af5');fade.addColorStop(.87,'#10272af5');fade.addColorStop(1,'#13272b22');
      c.fillStyle=fade;c.fillRect(x,31,r-x,68);
      for(let k=col;k<end;k++){
        const xx=k*16;
        c.beginPath();c.moveTo(xx,34);c.lineTo(xx+8,42+hash(k)*11);c.lineTo(xx+16,36);c.lineTo(xx+13,86);c.lineTo(xx+5,97);c.lineTo(xx,80);c.closePath();c.fillStyle=k%2?'#263c3a55':'#34504a38';c.fill();
        if(k%5===1){
          c.save();c.globalAlpha=.35;c.translate(xx+8,71);c.scale(.16,.16);
          this.path('M-20 12 L-15 -6 L4 -8 L16 -20 L23 -16 L15 -4 L7 1 L10 18 M-7 0 L-9 17 M-15 -5 L-28 -15',null,p.edge,3);
          this.path('M14 -19 L13 -29 M19 -19 L23 -27',null,p.edge,2);
          c.restore();
        }
        if(k%7===3){
          const gx=xx+5,gy=88;
          let gl=c.createRadialGradient(gx,gy,0,gx,gy,18);gl.addColorStop(0,p.glow+'24');gl.addColorStop(1,p.glow+'00');c.fillStyle=gl;c.fillRect(gx-18,gy-18,36,36);
          for(let j=0;j<3;j++){this.line([[gx+j*1.8,gy],[gx+j*1.8-.3,gy-2.5-hash(k+j)*2]],'#769e91',.4);this.ellipse(gx+j*1.8-.3,gy-2.7-hash(k+j)*2,1.8,.65,p.glow);}
        }
      }
      // A rounded stone brow explains the dark passage while respecting y=32.
      const roofTop=Math.min(-30,-this.originY/this.scale-4);
      const stone=c.createLinearGradient(0,roofTop,0,32);stone.addColorStop(0,p.shade);stone.addColorStop(.78,'#20393a');stone.addColorStop(1,p.rock);
      c.fillStyle=stone;c.fillRect(x,roofTop,r-x,32-roofTop);
      c.save();c.beginPath();c.rect(x,roofTop,r-x,32-roofTop);c.clip();
      for(let band=Math.floor(roofTop/22);band<2;band++){
        c.beginPath();
        for(let k=col;k<end;k++){
          const yy=band*22,xx=k*16,seed=k*13+band*41;
          c.moveTo(xx,yy+hash(seed)*6);c.lineTo(xx+13,yy-5+hash(seed+1)*5);c.lineTo(xx+18,yy+9);c.lineTo(xx+8,Math.min(31,yy+19));c.lineTo(xx-3,yy+11);c.closePath();
        }
        c.fillStyle=band%2?'#8ba1940a':'#071a2026';c.fill();
      }
      c.restore();
      for(let k=col;k<end;k++){
        const xx=k*16;
        c.beginPath();c.moveTo(xx,27-hash(k)*7);c.lineTo(xx+4,24+hash(k+1)*5);c.lineTo(xx+12,26-hash(k+2)*4);c.lineTo(xx+16,30);c.lineTo(xx+16,32);c.lineTo(xx,32);c.closePath();c.fillStyle=p.rock;c.fill();
        this.line([[xx,31.7],[xx+7,31.7],[xx+12,30.8],[xx+16,31.7]],'#7a93904a',.45);
        // Small non-solid mineral teeth stay inside the solid ceiling bounds.
        if(k%3===0)this.line([[xx+4,20],[xx+6,30.7]],'#75908c45',1.3);
      }
      col=end;
    }
  }
  terrain(level) {
    const c=this.ctx,p=this.pal,lo=Math.max(0,Math.floor(this.camera/16)-2),hi=Math.min(level.cols.length,Math.ceil((this.camera+this.view)/16)+2);
    for(let row=2;row<=6;row++){
      for(let col=lo;col<hi;){
        const tile=level.cols[col]?.[row]||0;
        if(!tile){col++;continue;}
        const floating=tile===3;
        let end=col+1;while(end<hi&&!!level.cols[end]?.[row]&&(level.cols[end][row]===3)===floating)end++;
        const x=col*16,right=end*16,y=row*16;
        const bottom=floating?y+16:Math.max(165,(this.height-this.originY)/this.scale+8);
        const grad=c.createLinearGradient(0,y,0,bottom);grad.addColorStop(0,p.rock);grad.addColorStop(.35,p.shade);grad.addColorStop(1,'#101d24');
        const leftOpen=!level.cols[col-1]?.[row],rightOpen=!level.cols[end]?.[row];
        c.beginPath();c.moveTo(x,y);c.lineTo(right,y);
        if(floating){c.lineTo(right,bottom-3);c.lineTo(right-4,bottom);c.lineTo(x+5,bottom);c.lineTo(x,bottom-5);}
        else {
          if(rightOpen){c.lineTo(right-.5,y+5);c.lineTo(right-2,y+10);c.lineTo(right-.6,y+18);c.lineTo(right-3,y+26);}
          c.lineTo(right-(rightOpen?1.5:0),bottom);c.lineTo(x+(leftOpen?1:0),bottom);
          if(leftOpen){c.lineTo(x+2,y+28);c.lineTo(x+.6,y+20);c.lineTo(x+2,y+13);c.lineTo(x+.4,y+6);}
        }
        c.closePath();c.fillStyle=grad;c.fill();
        // Cut stone strata are continuous across tiles, with seeded facets.
        c.save();c.beginPath();c.rect(x,y+.8,right-x,bottom-y);c.clip();
        for(let k=col;k<end;k++){
          const xx=k*16,seed=k*7+row*113;
          c.beginPath();c.moveTo(xx,y+3+hash(seed)*4);c.lineTo(xx+13,y+6);c.lineTo(xx+18,y+15);c.lineTo(xx+7,y+20+hash(seed+2)*9);c.lineTo(xx-2,y+15);c.closePath();c.fillStyle=hash(seed)>.5?'#a2b2a51b':'#09171d38';c.fill();
          this.line([[xx-2,y+11+hash(seed+3)*4],[xx+8,y+14+hash(seed+2)*4],[xx+16,y+13+hash(seed)*5]],'#acb5a51b',.4);
          this.line([[xx+4,y+25],[xx+9,y+22],[xx+13,y+29],[xx+17,y+30]],'#7c8c8118',.5);
          if(!floating){
            this.line([[xx+8,y+3],[xx+10,y+11],[xx+8,y+17]],'#101f2639',.55);
            c.beginPath();c.moveTo(xx-1,y+35);c.lineTo(xx+12,y+31);c.lineTo(xx+17,y+47);c.lineTo(xx+3,y+50);c.closePath();c.fillStyle='#7f98800b';c.fill();
          }
        }
        c.restore();
        // Landable top is exactly the collision plane, including short shelves.
        this.line([[x+.2,y+.2],[right-.2,y+.2]],p.edge,1.0);
        this.line([[x+.4,y+1.6],[right-.4,y+1.6]],p.moss,.85);
        for(let k=col;k<end;k++){
          const xx=k*16;
          for(let j=0;j<5;j++){
            const gx=xx+1+hash(k*23+j*19)*14;
            this.line([[gx,y+.25],[gx+.45,y-.25-hash(k+j)*.65]],p.moss,.35);
          }
          if(p.snow){c.fillStyle='#dce9df';c.fillRect(xx,y-.2,16,.7);this.ellipse(xx+4,y+.1,3,.75,'#dce9df');}
          if(k%3===1&&floating){this.line([[xx+3,y+14],[xx+2,y+20],[xx+3.5,y+23]],p.moss+'88',.6);this.ellipse(xx+3.2,y+19,.7,1.5,p.moss,-.5);}
        }
        // Exposed ledges receive a bright cut face; the empty pit stays empty.
        if(leftOpen)this.line([[x+.4,y+.8],[x+.7,y+5],[x+1.9,y+12]],p.edge+'66',.6);
        if(rightOpen)this.line([[right-.4,y+.8],[right-.8,y+5],[right-2,y+10],[right-1.3,y+14]],p.edge+'99',.7);
        col=end;
      }
    }
  }
  environment(level,front) {
    const c=this.ctx,p=this.pal;
    const lo=Math.max(0,Math.floor(this.camera/16)-2),hi=Math.min(level.cols.length,Math.ceil((this.camera+this.view)/16)+2);
    for(let i=lo;i<hi;i++){
      if(!level.cols[i]?.[6]||!level.cols[i-1]?.[6]||!level.cols[i+1]?.[6])continue;
      const seed=i+this.cameraStage*77,x=i*16+8;
      if(front){
        // Only small plants share the traversable plane. Tall framing is below it.
        if(hash(seed*5)>.72){c.save();c.globalAlpha=.50;this.fern(x+3,101,4+hash(seed)*4,p.near,seed);c.restore();}
        continue;
      }
      const cave=level.caveFlags?.[i];
      if(!cave&&i%9===3){
        c.save();c.globalAlpha=.86;this.treeFern(x,96,24+hash(seed)*20,p.near,seed);c.restore();
      }
      if(i%4===0){
        const rw=3+hash(seed)*3,rh=2+hash(seed+4)*3;
        c.beginPath();c.moveTo(x-rw,96);c.lineTo(x-rw*.7,96-rh*.7);c.lineTo(x+rw*.15,96-rh);c.lineTo(x+rw*.8,96-rh*.5);c.lineTo(x+rw,96);c.fillStyle=cave?'#324542':p.rock;c.fill();
        this.line([[x-rw*.7,96-rh*.7],[x+rw*.15,96-rh],[x+rw*.8,96-rh*.5]],p.edge+'5c',.45);
      }
      if(i%3===2)this.fern(x,96,3+hash(seed)*5,cave?'#456d5e':p.moss,seed);
      if(!cave&&i%13===8){
        this.line([[x-4,95.2],[x+5,94]],'#526052',1.4);
        this.line([[x+2,94.4],[x+3,91.3]],'#7b8571',.55);
      }
    }
  }
  fern(x,y,size,color,seed=0) {
    const c=this.ctx;c.save();c.translate(x,y);c.beginPath();
    for(let i=0;i<5;i++){
      const a=-2.8+i*.62,ex=Math.cos(a)*size,ey=Math.sin(a)*size;
      c.moveTo(0,0);c.quadraticCurveTo(ex*.1,ey*1.15,ex,ey);c.quadraticCurveTo(ex*.6,ey*.6,0,0);
      for(let j=1;j<4;j++){
        const u=j/4;c.moveTo(ex*u,ey*u);c.lineTo(ex*u-size*.16,ey*u-size*.13);c.lineTo(ex*u*.8,ey*u*.8);c.lineTo(ex*u+size*.15,ey*u-size*.1);c.closePath();
      }
    }
    c.fillStyle=color;c.fill();c.restore();
  }
  hazards(level) {
    const c=this.ctx;
    for(const hazard of level.hazards||[]){
      if(!this.visible(hazard.x,hazard.w+16))continue;
      const {x,y,w,h,type,phase}=hazard,base=y+h,cx=x+w/2;
      const warning=phase==='warning',active=phase==='active';
      const t=this.reducedMotion?0:this.time;
      c.save();
      // The persistent vent/scree and exact-width floor band remain readable
      // with reduced motion. Animated wisps are decoration, never the warning.
      this.ellipse(cx,base+.2,w*.55,1.2,'#14252bd9');
      this.line([[x+1,base+.1],[cx-2,base+1.4],[cx+1,base-.2],[x+w-1,base+.5]],'#b8a987',.55);
      for(let i=0;i<5;i++){
        const rx=x+1+i*(w-2)/4,ry=base+.2;
        this.ellipse(rx,ry,1.1+hash(i+x)*.7,.65,i%2?'#8d8b7a':'#4b5a55');
      }
      if(warning||active){
        c.fillStyle=active?'#ffb45730':'#eac48118';c.fillRect(x,y,w,h);
        this.line([[x,base],[x,base-3]],'#ffe3a3',.85);
        this.line([[x+w,base],[x+w,base-3]],'#ffe3a3',.85);
        this.line([[x,base-.7],[x+w,base-.7]],active?'#fff0c3':'#efc886',1.2);
      }
      if(type==='rockfall'){
        // A loose ceiling seam is only drawn where the level has a real roof.
        if(level.caveFlags?.[Math.floor(cx/16)]){
          this.line([[x,y+.4],[x+3,y+1.6],[cx,y],[x+w-2,y+2],[x+w,y+.7]],'#d2b58f',.75);
        }
        if(warning){
          this.line([[cx-2.1,base-10],[cx,base-7.2],[cx+2.1,base-10]],'#ffe2a1',.9);
          this.line([[cx,base-13],[cx,base-8]],'#ffe2a1',.75);
          for(let i=0;i<4;i++){
            const u=(t*.65+i*.27)%1;
            this.ellipse(x+2+hash(i+x)*(w-4),y+4+u*(h-21),.4,.6,'#eacfa090');
          }
        }else if(active){
          // Multiple staggered stones occupy the damaging column throughout
          // its active window; a lone falling sprite could imply false safety.
          for(let i=0;i<7;i++){
            const u=(t*2.8+i*.143)%1,rx=x+2+hash(i+x)*(w-4),ry=y+4+u*(h-6),r=1.1+hash(i*17+x)*1.4;
            this.line([[rx,ry-r-4],[rx,ry-r]],'#ead6b66b',.6);
            c.beginPath();c.moveTo(rx-r,ry-r*.4);c.lineTo(rx-r*.3,ry-r);c.lineTo(rx+r*.75,ry-r*.6);c.lineTo(rx+r,ry+r*.5);c.lineTo(rx,ry+r);c.lineTo(rx-r*.8,ry+r*.3);c.closePath();c.fillStyle=i%2?'#bba88a':'#8b8b7f';c.fill();
            this.line([[rx-r*.3,ry-r],[rx+r*.75,ry-r*.6]],'#e1c7a1',.4);
          }
          this.ellipse(cx,base-1,w*.61,2,'#d7bea450');
        }
      }else{
        this.ellipse(cx,base-.25,w*.32,.7,active?'#ffe4a3':warning?'#daa56e':'#668d88');
        // Wisps stay within the simulation's hot plume, tapering at its top.
        const count=active?9:warning?4:2;
        for(let i=0;i<count;i++){
          const u=(t*(active?.75:.25)+i/count)%1;
          const height=active?h-2:warning?8:3;
          const px=cx+Math.sin(i*3.1+u*5)*w*.15,py=base-1-u*height;
          c.globalAlpha=(active?.5:warning?.3:.13)*(1-u*.65);
          this.ellipse(px,py,w*(.2+(1-u)*.12),active?3.1:1.4,'#f3e1bd');
        }
        c.globalAlpha=1;
        if(warning){
          for(const offset of [-3,3])this.line([[cx+offset-1.3,base-7],[cx+offset,base-9],[cx+offset+1.3,base-7]],'#ffe2a1',.7);
        }
      }
      c.restore();
    }
  }
  camps(level) {
    for(const camp of level.checkpoints||[]){
      if(!this.visible(camp.x,30))continue;
      const c=this.ctx,x=camp.x,y=camp.y??96;
      // Engine camp y denotes surface height.
      const base=y>85?y:96;
      this.ellipse(x,base+.5,7.5,1.5,'#10222670');
      for(let i=0;i<7;i++){
        const a=i/7*TAU;this.ellipse(x+Math.cos(a)*5,base+Math.sin(a)*1.2,1.7,1.1,i%2?'#798780':'#465550');
      }
      this.line([[x-3,base],[x+2,base-2]],'#8b6650',1.2);this.line([[x+3,base],[x-2,base-2]],'#6b4b37',1.4);
      c.save();c.translate(x,base-1);
      if(camp.reached||camp.active){
        const g=c.createRadialGradient(0,-3,0,0,-3,22);g.addColorStop(0,'#fbc27b38');g.addColorStop(.4,'#f7ad6220');g.addColorStop(1,'#f7ad6200');c.fillStyle=g;c.fillRect(-22,-25,44,44);
        const sway=this.reducedMotion?0:Math.sin(this.time*9+x)*.5;
        c.scale(1+sway*.12,1-sway*.1);
        this.path('M-3 0 Q-5 -4 -1 -8 Q0 -5 1 -11 Q4 -7 2 -5 Q6 -2 3 0Z','#e98149');
        this.path('M-1.6 0 Q-3 -3 0 -6 Q0 -3 1.5 -5 Q3 -2 1.5 0Z','#ffc56e');
        this.path('M-.7 0 Q-1 -2 .3 -3 Q1 -1 .7 0Z','#ffeabd');
        for(let i=0;i<4;i++){const u=(this.time*.6+i*.27)%1;this.ellipse(Math.sin(i*4+u*5)*2,-7-u*9,.18*(1-u),.3*(1-u),'#ffce87');}
      }else{c.fillStyle='#b9a589';c.fillRect(-1,-2,2,1);}
      c.restore();
      // A raised hide pennant is the camp's readable landmark.
      this.line([[x+9,base],[x+8.2,base-23]],'#8b765b',.9);
      c.save();c.translate(x+8.2,base-22);
      this.path('M0 0 Q5 1 10 0 L8 7 Q4 5 .2 6Z',camp.reached?'#bfbf90':'#697c70');
      this.path('M3 2.5 L5 1.5 L7 3 L5 4.5Z','#223f3a');c.restore();
    }
  }
  goal(level,game) {
    const x=level.goalX;if(!this.visible(x,40))return;
    const c=this.ctx,p=this.pal;
    c.save();c.translate(x,96);
    const glow=c.createRadialGradient(0,-18,1,0,-18,28);glow.addColorStop(0,p.glow+'2a');glow.addColorStop(1,p.glow+'00');c.fillStyle=glow;c.fillRect(-29,-48,58,58);
    this.path('M-15 0 L-14 -23 L-11 -28 L-5 -26 L-5 0Z',p.rock,p.edge+'70',.5);
    this.path('M9 0 L7 -26 L11 -28 L17 -22 L18 0Z',p.rock,p.edge+'70',.5);
    this.path('M-14 -26 L-12 -31 L12 -31 L16 -26 L5 -25Z',p.rock,p.edge+'90',.6);
    this.path('M-4 -28 L0 -30 L4 -28 L0 -26Z',p.glow);
    for(let i=0;i<7;i++){const t=(this.time*.1+i/7)%1;this.ellipse(Math.sin(i*19)*6,-t*25,.18,.3,p.glow+'90');}
    c.restore();
  }
  item(it) {
    const c=this.ctx,x=it.x+it.w/2,y=it.y+it.h/2;
    const bob=this.reducedMotion?0:Math.sin(this.time*2.5+x)*.65;
    c.save();c.translate(x,y+bob);
    const relicIndex=clamp(Number(String(it.id||'r0').slice(1))||0,0,9);
    const color=it.type==='relic'?RELIC_COLORS[relicIndex]:it.type==='meat'?'#ffb49b':'#edce8f';
    const g=c.createRadialGradient(0,0,1,0,0,8);g.addColorStop(0,color+'25');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(-8,-8,16,16);
    if(it.type==='meat'){
      c.rotate(-.35);this.path('M1 0 L5 1 L6 0 L7 1 L6 3 L4 3 L0 2Z','#e4dcc2','#654940',.35);
      this.path('M-5 -3 Q-1 -5 2 -1 Q3 2 -1 4 Q-4 4 -6 1 Q-7 -1 -5 -3Z','#b9614c','#593b35',.5);
      this.path('M-4 -2 Q-1 -4 1 -1 Q0 0 -3 1Z','#e49a73');
      this.line([[-4,2],[-1,2.5]],'#f2c396',.45);
    }else if(it.type==='club'){
      c.rotate(.65);this.drawClub(0,5,.25);
    }else{
      this.relic(relicIndex,color);
      this.line([[-4,-1],[-5,-1]],color,.35);this.line([[4,1],[5,1]],color,.35);
    }
    c.restore();
  }
  relic(index,color) {
    const ink='#294b49',rim='#efe8cb';
    if(index===0){
      this.path('M-3 -3 L0 -4.5 L3.2 -2 L3.8 1 L1.3 4 L-2 3.5 L-4 .5Z',color,rim,.45);
      this.ellipse(0,0,1.4,1.4,'#85583c');
      for(let i=0;i<6;i++){const a=i/6*TAU;this.line([[Math.cos(a)*2,Math.sin(a)*2],[Math.cos(a)*2.7,Math.sin(a)*2.7]],'#85583c',.5);}
    }else if(index===1){
      this.path('M-3 -3.5 Q.2 -5 3.5 -2.5 Q3 2 -.8 5 Q.1 1 -1.8 -.5Z',color,rim,.5);
      this.line([[-2.3,-2],[2.3,-1.5]],index===1?'#628f9f':'#ab8549',.6);
      this.path('M1 -1 L2 -1.5 Q2 1 .1 3Z',rim);
    }else if(index===2){
      this.path('M-4 0 Q0 -5 4 0 Q0 5 -4 0Z',color,rim,.5);
      this.ellipse(0,0,1.5,2,ink);this.ellipse(.3,-.4,.5,.7,rim);
    }else if(index===3){
      this.path('M-2 4 Q-5 -2 3 -5 Q5 1 -2 4Z',color,rim,.4);
      this.line([[-2.5,5],[2,-3.5]],'#8b785b',.6);
      for(let i=0;i<3;i++)this.line([[-1.4+i*.8,2.6-i*1.6],[1.6+i*.5,2-i*1.8]],'#b4a180',.4);
    }else if(index===4){
      this.path('M-3.5 -3.2 Q-2 -4.5 -.3 -3 Q.5 1 -2.3 4 Q-1.4 0 -3.5 -3.2Z',color,rim,.4);
      this.path('M.6 -3 Q2.5 -4.3 3.8 -2.5 Q4.5 1.7 1.5 4.5 Q2.3 .8 .6 -3Z',color,rim,.4);
      this.line([[-3,-2],[0,-2],[3.4,-1.5]],'#9b8b6c',.6);
    }else if(index===5){
      this.path('M3 4 Q-5 4 -4 -1 Q-3 -5 1 -4 Q5 -3 3.5 1 Q2 3 -.8 1 Q-2 -.5 0 -1 Q1 -1 1.2 0',color,rim,.55);
      this.path('M3 4 L4 -1 L1 3Z','#5d9690');
    }else if(index===6){
      this.path('M2 -4.2 C-5 -5 -6 4.5 2.5 4 Q-1 3.4 -1.1 0 Q-1 -2.8 2 -4.2Z',color,rim,.45);
    }else if(index===7){
      this.path('M1 -5 L3.5 -1.5 L1.5 4 L-3 2 L-2 -2Z',color,rim,.4);
      this.path('M1 -3.5 L-.8 -.2 L1.5 -.5 L-.8 3',null,'#f8eddb',.75);
    }else if(index===8){
      this.path('M0 -5 L4 0 L0 5 L-4 0Z',color,rim,.4);
      this.path('M0 -2.7 L2 0 L0 2.7 L-2 0Z M-2 -1.2 L2 1.2 M-2 1.2 L2 -1.2',null,ink,.55);
    }else{
      this.path('M-3.5 3 Q3 4 3.4 -4.5 Q5 1 2.3 4.4 Q-.2 6 -3.5 3Z',color,rim,.5);
      this.line([[-2.7,3.2],[-.7,4.2]],'#936b4d',.55);this.line([[-.9,2.5],[1,3.4]],'#936b4d',.55);
    }
  }
  shadow(x,y,w,alpha=.26){this.ellipse(x,y,w,Math.max(.7,w*.14),`rgba(3,13,19,${alpha})`);}
  human(p,game) {
    const c=this.ctx,t=this.time,x=p.x+p.w/2,y=p.y+p.h;
    const moving=Math.abs(p.vx||0)>2,ground=p.onGround;
    if(ground)this.shadow(x,y+.4,7.5,.32);
    const stride=ground&&moving?Math.sin(t*13):0;
    const stride2=ground&&moving?Math.cos(t*13):0;
    let bob=ground&&moving?Math.abs(stride)*1.3:Math.sin(t*2)*.3;
    if(this.reducedMotion&&!moving)bob=0;
    c.save();c.translate(x,y);c.scale((p.facing||1)*p.h/100,p.h/100);
    if(p.dodgeTimer>0){c.translate(0,-25);c.rotate((p.facing||1)*-.65);c.scale(1,.82);}
    if(p.invuln>0&&Math.floor(t*18)%2===0)c.globalAlpha=.65;
    c.translate(0,-bob);
    // Far arm and leg have full volume, with the near side catching warm light.
    const backKnee={x:-9-stride*10,y:-24+Math.max(0,-stride)*7};
    const backFoot={x:-12+stride*21,y:-2-Math.max(0,-stride)*11};
    if(!ground){backKnee.x=-11;backKnee.y=-29;backFoot.x=-19;backFoot.y=-15;}
    this.limb(-6,-45,backKnee.x,backKnee.y,backFoot.x,backFoot.y,11,'#8e624b','#664738');
    this.path(`M${backFoot.x-5} ${backFoot.y-4} Q${backFoot.x+2} ${backFoot.y-5} ${backFoot.x+9} ${backFoot.y-1} L${backFoot.x+9} ${backFoot.y+2} L${backFoot.x-5} ${backFoot.y+2}Z`,'#7f5740');
    const farElbow={x:-18+stride*4,y:-58};
    this.limb(-9,-76,farElbow.x,farElbow.y,-13+stride*10,-45,9,'#92644b','#694b3e');
    // Torso: one-shoulder hide, a heavy belt and a ragged hem.
    this.path('M-11 -78 Q-19 -69 -14 -53 L-18 -40 L-9 -41 L-6 -35 L0 -40 L6 -35 L10 -41 L17 -39 L12 -56 L13 -72 Q6 -80 -11 -78Z','#8b6950','#463a31',1.1);
    this.path('M-11 -77 Q-4 -80 1 -75 L-5 -50 L-14 -48 L-14 -57Z','#baa17a');
    this.path('M2 -75 Q10 -75 13 -69 L9 -47 L2 -45 L-3 -51Z','#735440');
    this.path('M-15 -49 Q0 -45 14 -49 L15 -43 Q0 -40 -16 -43Z','#463c33');
    this.path('M-3 -48 L3 -48 L4 -42 L-3 -42Z','#c9b78a','#342f28',.6);
    this.line([[-10,-70],[-7,-64]],'#d6bd8d',1.5);
    this.line([[-8,-59],[-10,-53]],'#6c5946',1.2);
    this.line([[5,-69],[2,-60],[4,-53]],'#a7855e',.9);
    // Near leg is offset during flight for a readable jumping silhouette.
    let kx=9+stride*10,ky=-23-Math.max(0,stride)*8,fx=12-stride*21,fy=-2-Math.max(0,stride)*12;
    if(!ground){kx=12;ky=-30;fx=10;fy=-12;}
    this.limb(7,-42,kx,ky,fx,fy,12,'#c18b60','#956446');
    this.line([[kx+2,ky-4],[fx+2,fy-5]],'#dca775',2.4);
    this.path(`M${fx-5} ${fy-4} Q${fx+3} ${fy-4} ${fx+10} ${fy} L${fx+10} ${fy+2} L${fx-5} ${fy+2}Z`,'#b37e56','#81583e',.65);
    this.line([[kx-4,ky+5],[kx+5,ky+7]],'#514a3d',3);
    this.line([[kx-3,ky+3],[kx+5,ky+5]],'#b7ab82',1.4);
    // Neck, profile, ear, brow, nose, eye and a dense swept mane.
    this.path('M-4 -83 L6 -85 L8 -74 Q1 -69 -5 -76Z','#ba865c');
    this.path('M-11 -95 Q-6 -105 6 -101 Q14 -99 13 -91 L18 -86 L13 -83 L12 -76 Q5 -72 -4 -78 L-9 -83Z','#c9986a','#513d31',.8);
    this.ellipse(-7,-87,4.2,5.4,'#a57553');this.ellipse(-6,-87,1.6,2.7,'#cf9b70');
    this.path('M-13 -84 Q-20 -94 -10 -103 Q-5 -109 5 -104 Q15 -106 16 -96 L8 -97 L4 -92 L-2 -94 L-5 -83 L-8 -78 L-11 -82 L-14 -78Z','#382f2a');
    this.path('M-12 -99 Q-5 -106 4 -102 L8 -99 Q-4 -103 -12 -92Z','#665040');
    this.path('M-2 -85 L3 -82 L12 -83 L14 -78 L9 -71 L4 -74 L-1 -74 L-5 -80Z','#503b2d');
    this.line([[7,-91],[12,-91]],'#453228',1.9);
    this.ellipse(10.4,-89.5,1.0,.85,'#f1dfb8');this.ellipse(11,-89.5,.42,.6,'#1b2929');
    this.line([[9,-80],[12,-80]],'#e0b381',.65);
    // The arm and club share the simulation's attack window.
    let ex=17-stride*7,ey=-60,hx=23-stride*7,hy=-47;
    let clubAngle=.3;
    if(p.attackTimer>0){
      const progress=clamp(1-p.attackTimer/.25,0,1);
      ex=20;ey=-74+progress*14;hx=27+progress*11;hy=-87+progress*34;clubAngle=-.9+progress*2.4;
      c.save();c.globalAlpha=.30*(1-progress);c.strokeStyle='#ffdfaa';c.lineWidth=6;c.beginPath();c.arc(10,-65,p.club>0?50:33,-1.2,.8);c.stroke();c.restore();
    }else if(!ground){ex=20;ey=-71;hx=22;hy=-84;clubAngle=-.25;}
    this.limb(10,-75,ex,ey,hx,hy,10.5,'#c49266','#956548');
    this.line([[14,-72],[ex+1,ey-4]],'#e2b17e',2.0);
    if(p.club>0){c.save();c.translate(hx,hy);c.rotate(clubAngle);this.drawClub(0,5,1);c.restore();}
    else {this.ellipse(hx+2,hy-.5,5.5,5.2,'#d3a276');this.line([[hx-1,hy-2],[hx+4,hy-2]],'#865d41',.8);}
    this.ellipse(hx,hy,5,5.3,'#ca986a');
    this.line([[hx-2,hy+1],[hx+2,hy+1]],'#865d41',.8);
    c.restore();
  }
  limb(x1,y1,x2,y2,x3,y3,width,base,shade) {
    const c=this.ctx;
    const segment=(ax,ay,bx,by,wa,wb)=>{
      const len=Math.hypot(bx-ax,by-ay)||1,nx=-(by-ay)/len,ny=(bx-ax)/len;
      c.beginPath();c.moveTo(ax+nx*wa/2,ay+ny*wa/2);c.lineTo(bx+nx*wb/2,by+ny*wb/2);c.lineTo(bx-nx*wb/2,by-ny*wb/2);c.lineTo(ax-nx*wa/2,ay-ny*wa/2);c.closePath();c.fillStyle=base;c.fill();c.strokeStyle=shade;c.lineWidth=.65;c.stroke();
      this.line([[ax-nx*wa*.28,ay-ny*wa*.28],[bx-nx*wb*.28,by-ny*wb*.28]],shade,width*.13);
    };
    this.ellipse(x1,y1,width*.5,width*.5,base);
    segment(x1,y1,x2,y2,width,width*.83);
    this.ellipse(x2,y2,width*.43,width*.44,base);
    segment(x2,y2,x3,y3,width*.84,width*.63);
    this.ellipse(x3,y3,width*.33,width*.34,base);
  }
  drawClub(x,y,s=1) {
    const c=this.ctx;c.save();c.translate(x,y);c.scale(s,s);
    this.path('M-2 4 L-3 -20 L-7 -27 L-7 -36 L-3 -42 L3 -43 L8 -37 L7 -28 L3 -20 L2 4Z','#806347','#3a342c',1);
    this.path('M-3 -22 L-4 -34 L-1 -39 L3 -39 L5 -34 L2 -23Z','#b3966d');
    this.line([[-2,-20],[2,-21]],'#c9bc94',2.5);this.line([[-2,-16],[2,-17]],'#a29d7d',2);this.line([[-1,-12],[2,-13]],'#c9bc94',2);
    this.path('M-5 -33 L-8 -35 L-7 -39 L-3 -38Z','#a5a99e');
    this.path('M4 -28 L8 -30 L9 -34 L5 -33Z','#b5b4a1');
    c.restore();
  }
  enemy(e) {
    const c=this.ctx,x=e.x+e.w/2,y=e.y+e.h;
    if(e.boss)this.bossTelegraph(e);
    if(e.type!=='bat'&&e.type!=='pterodactyl')this.shadow(x,y+.5,e.w*.61,.30);
    c.save();c.translate(x,y);c.scale(e.dir||1,1);
    if(e.tell>0&&e.move!=='slam'){
      // Telegraphs are grounded directional marks, visible before a lunge.
      c.save();c.globalAlpha=.8;
      this.line([[e.w*.15,1.3],[e.w*.65,1.3],[e.w*.54,-.1]],'#e9ba78',.6);
      this.line([[e.w*.65,1.3],[e.w*.54,2.6]],'#e9ba78',.6);
      c.restore();
      c.save();c.globalAlpha=this.reducedMotion?.7:.45+.3*Math.sin(this.time*14);this.ellipse(e.w*.17,-e.h*.72,1.2,1.2,'#ffe1a3');c.restore();
      const g=c.createRadialGradient(0,-e.h*.4,1,0,-e.h*.4,e.w);g.addColorStop(0,'#fd9b4430');g.addColorStop(1,'#ffae5500');c.fillStyle=g;c.fillRect(-e.w,-e.h-e.w*.3,e.w*2,e.h+e.w*.6);
    }
    if(e.type==='raptor'){c.scale(e.w/64,e.h/58);this.raptor(e);}
    else if(e.type==='tiger'){c.scale(e.w/85,e.h/55);this.tiger(e,false);}
    else if(e.type==='greatbeast'){c.scale(e.w/106,e.h/94);this.beast(e);}
    else if(e.type==='bat'){c.scale(e.w/44,e.h/35);this.bat(e);}
    else if(e.type==='pterodactyl'){c.scale(e.w/72,e.h/46);this.pterodactyl(e);}
    c.restore();
    // Small creature health appears only after damage; the boss gets HTML UI.
    if(e.hp<e.maxHp&&!e.boss&&e.alive){
      c.save();c.globalAlpha=.85;const bw=Math.min(15,e.w),bx=x-bw/2,by=e.y-4.5;
      c.fillStyle='#0a171dcc';c.fillRect(bx,by,bw,1);c.fillStyle='#d8b780';c.fillRect(bx,by,bw*clamp(e.hp/e.maxHp,0,1),1);c.restore();
    }
  }
  bossTelegraph(e) {
    if(e.move!=='slam'||!['windup','slam'].includes(e.phase))return;
    const c=this.ctx,cx=e.x+e.w/2,ground=96,half=75,active=e.phase==='slam';
    c.save();
    // The full 150-by-8 ground strike is painted from its actual damage box.
    // Static boundaries and upward arrows convey "jump" without flashing.
    c.fillStyle=active?'#ffc98943':'#edb77922';c.fillRect(cx-half,ground-8,half*2,8);
    this.line([[cx-half,ground-8],[cx-half,ground],[cx+half,ground],[cx+half,ground-8]],active?'#ffe4b9':'#e8b783',.85);
    c.strokeStyle=active?'#ffdda0':'#e9be86';c.lineWidth=active?1.3:.7;
    c.beginPath();c.ellipse(cx,ground-1,half,3.8,0,0,TAU);c.stroke();
    if(active){
      const progress=this.reducedMotion?.7:clamp(1-e.phaseTimer/.25,0,1);
      for(let i=0;i<2;i++){
        const radius=half*clamp(progress-i*.28,0,1);if(radius<3)continue;
        c.globalAlpha=.8-i*.2;c.beginPath();c.ellipse(cx,ground-1,radius,3.5,0,0,TAU);c.stroke();
      }
      c.globalAlpha=.75;
      for(let i=0;i<14;i++){
        const xx=cx-half+5+i*10;
        this.line([[xx-2,ground],[xx,ground-2-hash(i)*4],[xx+2.7,ground]],'#ffd9a0',.7);
      }
    }else{
      const jumpNow=e.phaseTimer<=.28;
      if(jumpNow)for(const offset of [-55,-29,29,55]){
          const xx=cx+offset;
          this.line([[xx-2.2,ground-10],[xx,ground-13],[xx+2.2,ground-10]],'#fff0c5',1.0);
          this.line([[xx,ground-7],[xx,ground-12]],'#fff0c5',.8);
        }
      // A raised stone warning above the beast distinguishes slam from charge.
      this.ellipse(cx,e.y-7,4.6,4.6,'#302821d9');
      if(jumpNow){
        this.line([[cx-2,e.y-7],[cx,e.y-9.5],[cx+2,e.y-7]],'#ffdda3',.85);
        this.line([[cx,e.y-5],[cx,e.y-8.5]],'#ffdda3',.75);
      }else{
        this.line([[cx,e.y-9.5],[cx,e.y-7]],'#ffdda3',.9);
        this.ellipse(cx,e.y-5.3,.55,.55,'#ffdda3');
      }
    }
    c.restore();
  }
  raptor(e) {
    const c=this.ctx,t=this.time,run=Math.abs(e.vx||0)>1?Math.sin(t*15+e.x):0;
    const body=e.flash>0?'#d8e2b6':e.phase==='lunge'?'#8eaf82':'#709781';
    // Counterbalancing tail, a muscular haunch, hooked face, and sickle claws.
    this.path('M-13 -37 Q-39 -39 -57 -52 Q-52 -38 -34 -29 L-14 -24Z','#426b63','#284941',1);
    this.limb(-9,-25,-17-run*7,-13,-13+run*9,-3,7,'#467063','#2d514a');
    this.path(`M${-14+run*9} -5 L${-3+run*9} -3 L${-1+run*9} 0 L${-18+run*9} 0Z`,'#355149');
    this.path('M-23 -34 Q-13 -46 5 -42 L11 -54 Q22 -60 30 -53 L35 -43 L24 -37 L14 -37 Q12 -19 -5 -17 Q-19 -18 -23 -34Z',body,'#294f48',1.2);
    this.path('M-6 -23 Q9 -23 12 -38 L23 -39 L28 -44 L31 -42 L25 -37 L15 -33 Q12 -17 -5 -17Z','#b2c2a0');
    this.path('M13 -51 L29 -51 L31 -45 L19 -44Z','#96b195');
    this.path('M23 -42 L34 -44 L31 -39 L25 -39Z','#354941');
    this.line([[26,-41],[32,-42]],'#d5d3af',1.1);
    this.ellipse(22,-49,2.0,1.5,'#ead484');this.ellipse(22.7,-49,.55,1.5,'#263632');
    this.line([[17,-52],[25,-52]],'#385a4e',1.8);
    for(let i=0;i<6;i++){const xx=-20+i*5;this.path(`M${xx} -39 L${xx+2} -45 L${xx+5} -41Z`,'#365f56');}
    for(let i=0;i<5;i++)this.line([[-17+i*5,-36+Math.sin(i)*2],[-14+i*5,-27+Math.sin(i)*2]],'#305d514f',2.5);
    this.limb(2,-27,6+run*8,-15,-2-run*12,-3,9,body,'#395c4d');
    this.path(`M${-5-run*12} -5 L${7-run*12} -3 L${10-run*12} 0 L${-8-run*12} 0Z`,'#628574');
    this.path(`M${5-run*12} -3 Q${12-run*12} -8 ${11-run*12} -1 L${5-run*12} 0Z`,'#d5c9a2');
    this.limb(9,-35,15,-28,21,-30,4.5,body,'#345447');this.line([[21,-30],[25,-28]],'#cec3a0',1.1);
  }
  tiger(e) {
    const c=this.ctx,t=this.time,run=Math.abs(e.vx||0)>1?Math.sin(t*12+e.x):0;
    const color=e.flash>0?'#f5d8a5':'#c39857';
    this.path('M-28 -30 Q-48 -29 -47 -46 Q-45 -53 -48 -56',null,'#876541',4.5);
    this.limb(-24,-23,-24-run*8,-12,-29+run*11,-3,8,'#987446','#65523b');
    this.limb(20,-25,21+run*6,-13,18-run*10,-3,8,'#977345','#65523b');
    this.path('M-32 -34 Q-24 -43 -8 -41 L17 -44 Q33 -44 35 -32 L30 -20 L4 -17 L-18 -20 L-29 -17Z',color,'#66523b',1.1);
    this.path('M-16 -20 Q4 -23 26 -23 L28 -17 L8 -13 L-16 -17Z','#d5bf85');
    this.limb(-20,-23,-14+run*8,-12,-18-run*11,-3,9,color,'#755b3d');
    this.limb(24,-26,28-run*7,-13,30+run*9,-3,9,color,'#755b3d');
    for(const fx of [-18-run*11,30+run*9]){this.ellipse(fx+3,-2,7,3,color);this.line([[fx+5,-2],[fx+8,-1]],'#e1d4af',.8);}
    // Saber-toothed cat: broad muzzle and unmistakable paired upper canines.
    this.path('M18 -44 L18 -51 Q22 -55 26 -48 Q38 -53 43 -43 L46 -30 Q46 -22 32 -22 L23 -28 L19 -35Z',color,'#6b563d',1.2);
    this.path('M21 -48 L21 -51 L25 -48Z','#785545');
    this.path('M29 -35 Q41 -38 47 -32 Q46 -26 35 -27 L30 -29Z','#ddd0a2');
    this.path('M42 -33 L47 -32 L46 -29 L43 -29Z','#443d32');
    this.path('M31 -28 L35 -28 Q38 -20 33 -13 L32 -22Z','#f5e7ba','#9b875e',.5);
    this.path('M39 -28 L42 -28 Q44 -21 40 -16Z','#efe3b6');
    this.ellipse(36,-40,2.1,1.3,'#e6d783');this.ellipse(36.7,-40,.55,1.2,'#242d29');
    this.line([[31,-43],[40,-42]],'#5b4a32',2.1);
    for(let i=0;i<6;i++){
      const xx=-24+i*8;
      this.path(`M${xx} ${-38-(i>3?4:0)} L${xx+6} ${-39-(i>3?4:0)} Q${xx+1} -29 ${xx+5} -25 L${xx} -27 L${xx-2} -33Z`,'#65553b');
    }
    this.line([[23,-43],[29,-37]],'#695438',2);this.line([[23,-38],[28,-33]],'#695438',1.7);
  }
  bat(e) {
    const c=this.ctx,t=this.time,flap=this.reducedMotion?0:Math.sin(t*17+e.x)*11;
    const body=e.flash>0?'#e4d6ce':'#8a8496';
    for(const side of [-1,1]){
      c.save();c.scale(side,1);
      this.path(`M0 -18 Q10 ${-38-flap} 30 ${-28-flap} Q20 ${-21-flap*.4} 23 -10 Q14 -18 11 -5 Q5 -13 0 -10Z`,'#635b72','#353446',1);
      this.line([[0,-18],[16,-29-flap*.5],[11,-8]],'#9b8ba1',.6);
      this.line([[16,-29-flap*.5],[24,-12]],'#9b8ba1',.6);
      c.restore();
    }
    this.ellipse(0,-17,5,9,body);this.ellipse(0,-24,6,5,body);
    this.path('M-5 -25 L-6 -34 L-1 -28 M1 -28 L6 -34 L5 -25',body,'#5d5269',.8);
    this.ellipse(-2.3,-24,1,1,'#e4d589');this.ellipse(2.3,-24,1,1,'#e4d589');
    this.path('M-2 -20 L-1 -17 L0 -20 L1 -17 L2 -20Z','#ded1b8');
  }
  pterodactyl(e) {
    const c=this.ctx,t=this.time,flap=this.reducedMotion?0:Math.sin(t*8+e.x)*14;
    this.path(`M-7 -18 Q-21 ${-45-flap} -47 ${-50-flap} L-31 -19 L-12 -12Z`,'#756e84','#424859',1.2);
    this.path(`M-9 -19 L-35 ${-43-flap} L-22 -22Z`,'#998898');
    this.path('M-21 -14 L-35 -8 L-27 -18Z','#67707b');
    this.path('M-21 -16 Q-7 -29 8 -26 L16 -34 L26 -32 L22 -23 L12 -16 Q-3 -5 -17 -9Z',e.flash>0?'#e8d0bd':'#a39391','#4f515b',1.2);
    this.path('M16 -33 L9 -45 L23 -36 L29 -31 L42 -27 L25 -25 L20 -22Z','#c5a48b','#655b58',.8);
    this.path('M27 -31 L42 -27 L25 -27Z','#dec19c');
    this.ellipse(24,-31,1.5,1.1,'#ffde94');this.ellipse(24.4,-31,.5,.8,'#3e4448');
    this.path(`M-6 -20 Q-15 ${-46+flap} -39 ${-54+flap} L-26 -16 L-6 -9 Q3 -10 4 -18Z`,'#ae9087','#57535d',1.1);
    this.path(`M-6 -20 L-34 ${-48+flap} L-26 -16Z`,'#ba9d90');
    this.line([[-6,-20],[-34,-48+flap],[-19,-17]],'#e0bba0',.9);
    this.line([[-12,-10],[-5,-4],[0,-6]],'#7a747c',2);this.line([[-3,-10],[4,-5],[8,-7]],'#7a747c',2);
  }
  beast(e) {
    const c=this.ctx,t=this.time,run=Math.abs(e.vx||0)>1?Math.sin(t*9):0;
    const skin=e.flash>0?'#e1c5a3':'#8a7060';
    const rearing=e.move==='slam'&&e.phase==='windup',slamming=e.phase==='slam';
    c.save();
    if(rearing){c.translate(-25,-3);c.rotate(-.22-.12*(1-clamp(e.phaseTimer,0,1)));c.translate(25,3);}
    else if(slamming)c.scale(1.04,.91);
    // A distinct elder beast: massive shaggy shoulders, a scarred stone brow,
    // curved antler-horns and saber tusks. This is not a scaled regular tiger.
    this.path('M-37 -36 Q-64 -38 -62 -62 Q-56 -76 -65 -83',null,'#5a4a42',6);
    this.limb(-28,-36,-35-run*6,-17,-37+run*12,-4,15,'#68584e','#3f3934');
    this.limb(31,-40,32+run*5,rearing?-36:-18,rearing?42:31-run*11,rearing?-37:-4,16,'#65564d','#3f3934');
    this.path('M-47 -46 Q-45 -61 -29 -66 Q-17 -82 1 -76 Q18 -89 34 -69 Q42 -55 43 -35 L25 -23 L-7 -25 L-34 -24 L-45 -30Z',skin,'#3b3634',1.4);
    this.path('M-27 -65 L-24 -76 L-12 -74 L-7 -84 L3 -78 L9 -88 L19 -80 L25 -83 L32 -73 L41 -73 L42 -62 L49 -54 L45 -43 L48 -34 L38 -30 L34 -20 L24 -25 L15 -20 L9 -30 L-2 -28 L-9 -37 L-21 -35 L-24 -47 L-34 -50Z','#51463e','#3d3631',1.3);
    for(let i=0;i<9;i++){
      const xx=-25+i*7,yy=-59+Math.sin(i)*7;
      this.path(`M${xx} ${yy-9} L${xx+5} ${yy+6} L${xx+3} ${yy+13}`,null,i%2?'#776052':'#95806a',2.1);
    }
    this.limb(-24,-30,-16+run*7,-16,-23-run*12,-3,17,skin,'#4c413a');
    this.limb(29,-36,38-run*8,rearing?-29:-16,rearing?49:42+run*12,rearing?-33:-3,19,skin,'#4c413a');
    for(const [fx,fy] of [[-23-run*12,-3],[rearing?49:42+run*12,rearing?-33:-3]]){
      this.ellipse(fx+3,fy,11,4.8,skin);
      for(let i=0;i<3;i++)this.path(`M${fx+3+i*3} ${fy} L${fx+7+i*3} ${fy+2} L${fx+4+i*3} ${fy+4}Z`,'#ded0ab');
    }
    this.path('M24 -75 Q38 -83 50 -70 L55 -56 L53 -40 Q47 -30 32 -36 L23 -47 L19 -59Z','#9a8068','#453c35',1.3);
    this.path('M20 -68 Q8 -78 15 -96 Q16 -81 29 -80 L33 -72Z','#bfad83','#554a3c',1.1);
    this.path('M42 -78 Q53 -90 51 -104 Q64 -89 53 -71Z','#c7b78b','#554a3c',1.1);
    this.path('M20 -69 L25 -81 L33 -82 L39 -77 L47 -82 L53 -70 L44 -64 L30 -65Z','#5e6258','#444c45',1.0);
    this.path('M28 -78 L34 -75 L31 -66 L25 -69Z','#9b9d82');
    this.path('M38 -53 Q49 -59 58 -51 L59 -42 Q48 -35 36 -42 L32 -49Z','#c3b18e','#51473b',1.0);
    this.path('M51 -51 L60 -49 L57 -44 L52 -45Z','#3d3a34');
    this.path('M36 -43 L43 -41 Q49 -23 41 -15 Q44 -30 36 -36Z','#e4d5ad','#756a52',.7);
    this.path('M49 -42 L54 -43 Q62 -29 55 -21 Q58 -32 49 -37Z','#dfcfa3','#756a52',.7);
    this.ellipse(43,-62,3.4,1.8,'#edcb80');this.ellipse(44,-62,.8,1.7,'#302f28');
    this.line([[36,-65],[47,-66]],'#444033',3);
    this.line([[36,-74],[42,-53]],'#b8a088',1.1);this.line([[39,-73],[45,-53]],'#6d5142',.7);
    this.line([[24,-16],[26,-6]],'#54483e',2.3);
    if(e.tell>0){
      const alpha=this.reducedMotion?.7:.4+.35*Math.sin(t*18);c.globalAlpha=alpha;this.ellipse(44,-62,5,3,'#ffd286');c.globalAlpha=1;
      this.path('M37 -39 Q47 -30 54 -40 L51 -30 L43 -26 L37 -30Z','#3c2c29');
    }
    c.restore();
  }
  drawParticles(dt) {
    const c=this.ctx;
    for(const q of this.particles){
      q.age+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.gravity*dt;
      if(q.age>=q.life)continue;
      c.globalAlpha=(1-q.age/q.life)*.8;
      this.ellipse(q.x,q.y,q.size,q.size*.65,q.color);
    }
    c.globalAlpha=1;
    this.particles=this.particles.filter(q=>q.age<q.life);
  }
  atmosphere(game) {
    const c=this.ctx,w=this.width,h=this.height,p=this.pal,t=this.time;
    // Modest foreground silhouettes sit below the route, never across a pit.
    c.save();c.globalAlpha=.6;
    const offset=this.camera*this.scale*1.12;
    for(let i=Math.floor(offset/280)-1;i<Math.floor(offset/280)+Math.ceil(w/280)+2;i++){
      const x=i*280-offset+hash(i)*100;
      if(hash(i*3)>.45){c.save();c.translate(x,h+12);c.scale(1,1);this.fern(0,0,45+hash(i)*60,'#0e2028',i);c.restore();}
    }
    c.restore();
    // Fine dust/snow is deterministic and frozen by reduced-motion mode.
    if(!this.reducedMotion){
      const count=p.snow?42:24;
      for(let i=0;i<count;i++){
        const drift=p.snow?8:-3;
        const x=((hash(i*29)*w+t*(3+hash(i)*5)-this.camera*this.scale*.13)%w+w)%w;
        const y=((hash(i*67)*h*.78+t*drift)%h+h)%h;
        c.globalAlpha=(p.snow?.4:.22)*(1-y/h*.4);
        this.ellipse(x,y,p.snow?1.1:hash(i)*1.1+.3,p.snow?1.1:hash(i)*1.1+.3,p.ember?'#ffd096':p.mist);
      }
      c.globalAlpha=1;
    }
    let v=c.createRadialGradient(w*.5,h*.5,Math.min(w,h)*.2,w*.5,h*.5,Math.max(w,h)*.73);
    v.addColorStop(0,'#06131c00');v.addColorStop(.65,'#06131c08');v.addColorStop(1,'#06131c70');c.fillStyle=v;c.fillRect(0,0,w,h);
    // Top/bottom grade keeps the HTML interface readable, without letterboxes.
    v=c.createLinearGradient(0,0,0,h);v.addColorStop(0,'#08182066');v.addColorStop(.18,'#08182000');v.addColorStop(.70,'#08182000');v.addColorStop(1,'#08182055');c.fillStyle=v;c.fillRect(0,0,w,h);
  }
}
