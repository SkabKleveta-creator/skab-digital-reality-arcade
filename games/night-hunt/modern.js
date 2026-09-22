/* High-resolution presentation. Simulation coordinates and collisions stay in the game. */
class NightRenderer {
  constructor(canvas){
    this.canvas=canvas;this.g=canvas.getContext('2d');this.scale=4;this.ready=false;this.failed=false;
    canvas.width=1280;canvas.height=1152;
    this.background=new Image();this.atlas=new Image();
    this.crops=[[24,10,386,493],[443,18,342,482],[827,29,294,469],[1149,16,361,485],[41,523,319,477],[457,517,282,481],[825,518,300,483],[1189,521,320,480]];
    const load=(img,url)=>new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
    Promise.all([load(this.background,'assets/ward.jpg'),load(this.atlas,'assets/characters.png')]).then(()=>{this.ready=true;}).catch(()=>{this.failed=true;});
  }
  text(t,x,y,size=9,color='#eee6d9',align='left',weight='400'){
    const g=this.g;g.fillStyle=color;g.font=`${weight} ${size}px sans-serif`;g.textAlign=align;g.textBaseline='alphabetic';g.fillText(t,x,y);
  }
  panel(x,y,w,h,fill,stroke){const g=this.g;g.beginPath();g.roundRect(x,y,w,h,3);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=.6;g.stroke();}}
  glow(x,y,r,color){const g=this.g,grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(1,'transparent');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);}
  sprite(index,cx,bottom,height,face=1,motion=0,hurt=false){
    const g=this.g,cellW=this.atlas.width/4,cellH=this.atlas.height/2;
    const crop=this.crops[index]||[index%4*cellW,Math.floor(index/4)*cellH,cellW,cellH];
    const width=height*crop[2]/crop[3];
    g.save();g.translate(cx,bottom);g.scale(face,1);g.rotate(motion*.035);
    g.shadowColor=hurt?'#ffffff':'#050a0dcc';g.shadowBlur=hurt?7:2;
    g.drawImage(this.atlas,...crop,-width/2,-height,width,height);g.restore();
  }
  render(s){
    this.s=s;const g=this.g;g.setTransform(this.scale,0,0,this.scale,0,0);g.clearRect(0,0,320,288);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    if(!this.ready){g.fillStyle='#0b151d';g.fillRect(0,0,320,288);this.text('NIGHT HUNT',160,122,23,'#e6d5bd','center','600');this.text(this.failed?'Artwork could not load. Reload to retry.':'Entering the Gallows Ward…',160,151,10,'#a1b7c1','center');return;}
    if(s.state==='select'){this.menu();return;}
    g.save();const shake=Math.min(s.shake,5);g.translate(shake?Math.sin(s.tick*2)*shake*.25:0,shake?Math.cos(s.tick*3)*shake*.25:0);this.world();g.restore();this.hud();
    if(s.state==='dead'||s.state==='win')this.end();
  }
  backdrop(){
    const {g,s}=this;g.drawImage(this.background,0,0,320,288);
    const dark=g.createLinearGradient(0,0,0,288);dark.addColorStop(0,'#05101522');dark.addColorStop(1,'#03090ecc');g.fillStyle=dark;g.fillRect(0,0,320,288);
    for(let i=0;i<18;i++){let x=(i*63.7+s.tick*.055)%330,y=282-(i*39+s.tick*.1)%278;g.globalAlpha=.18+Math.sin(i+s.tick*.02)*.12;g.fillStyle='#c6b084';g.beginPath();g.arc(x,y,.5+(i%3)*.2,0,Math.PI*2);g.fill();}g.globalAlpha=1;
  }
  menu(){
    const {g,s}=this;this.backdrop();g.fillStyle='#07101780';g.fillRect(0,0,320,288);
    this.text('CHOOSE YOUR MONSTER',160,27,16,'#f2e5d0','center','600');
    this.text('Four levels. The humans will hunt you.',160,43,10,'#b5c6c9','center');
    s.roster.forEach((r,i)=>{const x=14+i%2*153,y=58+Math.floor(i/2)*92,active=s.choice===i;
      this.panel(x,y,139,78,active?'#284048ee':'#0b1721e8',active?'#d9b77f':'#49606a');
      this.glow(x+29,y+45,35,active?'#6c354c55':'#345f6440');
      this.sprite(i,x+28,y+74,71,1,Math.sin(s.tick*.045)*.2);
      this.text(r.name,x+54,y+22,9.5,active?'#ffe4bc':'#e6edee','left','700');
      const words=r.special.toLowerCase().split(' ');this.text(words.map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),x+54,y+39,8,'#c0d8dc');
      this.text(['Life-stealing strikes','Heavy claw damage','Enduring vitality','Fast climbing'][i],x+54,y+52,7.5,'#97afb9');
      for(let h=0;h<r.max;h++){g.fillStyle=h<r.max?'#bc535e':'#28383e';g.fillRect(x+54+h*8,y+63,5,2);}
    });
    this.panel(54,244,212,27,'#74313b','#ce7680');this.text('BEGIN THE HUNT',160,261,10,'#fff0e5','center','600');
    this.text('Choose with directions · Begin with Attack',160,281,8,'#a4b6bc','center');
  }
  world(){
    const {g,s}=this,{x:ox,y:oy}=s.camera;
    // Slow backdrop drift creates depth without changing the playable geometry.
    g.save();g.translate(-(ox%320)*.08,-(oy-288)*.035);g.drawImage(this.background,-35,-25,390,340);g.restore();
    const wash=g.createLinearGradient(0,0,0,288);wash.addColorStop(0,'#06121a22');wash.addColorStop(.65,'#09192255');wash.addColorStop(1,'#030a12b0');g.fillStyle=wash;g.fillRect(0,0,320,288);
    this.scenery();
    g.save();g.translate(-ox,-oy);
    s.climbables.forEach(c=>this.climb(c));s.platforms.forEach(p=>this.platform(p));
    this.elevator(s.elevator);s.breakables.filter(b=>!b.dead).forEach(b=>this.breakable(b));
    this.exitSign(1240,520,s.levelIndex===3?'ESCAPE →':'NEXT →');
    if(s.levelIndex>0)this.exitSign(36,520,'← BACK');
    s.pickups.forEach(q=>this.pickup(q));
    s.enemies.filter(e=>!e.dead).forEach(e=>this.enemy(e));
    this.player();s.slashes.forEach(a=>this.slash(a));
    s.particles.forEach(a=>{g.save();g.globalAlpha=Math.min(1,a.life/14);g.fillStyle=a.color;g.translate(a.x,a.y);g.rotate(a.life*.1);g.beginPath();g.ellipse(0,0,a.size*.65,a.gore?a.size:a.size*.4,0,0,Math.PI*2);g.fill();g.restore();});
    g.restore();
    for(let i=0;i<20;i++){g.fillStyle=i%4?'#aec9cc33':'#de9e6955';const x=(i*43.3-s.tick*.045+640)%320,y=(i*29+s.tick*.035)%288;g.beginPath();g.arc(x,y,.5,0,Math.PI*2);g.fill();}
  }
  exitSign(x,y,label){this.panel(x-28,y-18,56,18,'#091b20c9',this.s.level.accent);this.text(label,x,y-6,7,this.s.level.accent,'center','600');}
  scenery(){
    const {g,s}=this,{theme,tint,accent}=s.level,ox=s.camera.x*.32;
    g.fillStyle=tint;g.fillRect(0,0,320,288);g.save();g.translate(-ox%180,0);
    if(theme==='foundry'){
      for(let x=-40;x<520;x+=120){
        this.panel(x,62,38,226,'#172026c9','#756051');g.fillStyle='#5c4b3b';g.fillRect(x+9,40,16,120);
        this.glow(x+19,224,52,'#ee61134a');this.panel(x+5,203,28,52,'#5f280e','#e49949');
        g.strokeStyle='#d18b49';g.lineWidth=3;g.beginPath();g.arc(x+68,132,23,0,Math.PI*2);g.stroke();
        for(let j=0;j<6;j++){const a=j*Math.PI/3+s.tick*.008;g.beginPath();g.moveTo(x+68,132);g.lineTo(x+68+Math.cos(a)*24,132+Math.sin(a)*24);g.stroke();}
      }
      g.fillStyle='#20445180';g.fillRect(-180,274,700,14);
    }else if(theme==='wood'){
      for(let x=-60;x<520;x+=85){g.strokeStyle='#12271fdd';g.lineWidth=12;g.beginPath();g.moveTo(x,288);g.bezierCurveTo(x+20,230,x-14,135,x+14,48);g.stroke();g.lineWidth=5;
        for(let j=0;j<3;j++){g.beginPath();g.moveTo(x+6,110+j*38);g.lineTo(x-38+j*16,75+j*44);g.stroke();}
        for(let j=0;j<4;j++){g.fillStyle=j%2?'#233a29bb':'#182e22bb';g.beginPath();g.ellipse(x+j*15-25,65+j%2*20,49,28,0,0,Math.PI*2);g.fill();}
      }
      this.glow(225,230,100,'#718f4028');
    }else if(theme==='cathedral'){
      for(let x=-20;x<500;x+=94){g.fillStyle='#171225c9';g.fillRect(x,40,12,248);g.fillRect(x+70,40,12,248);
        g.strokeStyle='#6b587a88';g.lineWidth=5;g.beginPath();g.moveTo(x+12,222);g.lineTo(x+12,116);g.quadraticCurveTo(x+40,44,x+70,116);g.lineTo(x+70,222);g.stroke();
        this.glow(x+41,149,45,'#a475b033');g.fillStyle='#94577966';g.beginPath();g.moveTo(x+40,81);g.lineTo(x+63,122);g.lineTo(x+40,166);g.lineTo(x+18,122);g.fill();
      }
    }
    g.restore();this.glow(288,42,65,accent+'16');
  }
  platform(p){const g=this.g;if(p.x>this.s.camera.x+320||p.x+p.w<this.s.camera.x)return;
    g.save();g.shadowColor='#0009';g.shadowBlur=5;g.shadowOffsetY=3;
    const stone=g.createLinearGradient(0,p.y,0,p.y+p.h);stone.addColorStop(0,'#638083');stone.addColorStop(.18,'#374f58');stone.addColorStop(1,'#172631');g.fillStyle=stone;g.fillRect(p.x,p.y,p.w,p.h);g.restore();
    g.save();g.beginPath();g.rect(p.x,p.y,p.w,p.h);g.clip();g.globalAlpha=.24;
    for(let x=p.x;x<p.x+p.w;x+=48)g.drawImage(this.background,1080,715,230,110,x,p.y,48,p.h);g.restore();
    g.strokeStyle='#101e27';g.lineWidth=.5;for(let x=p.x+16;x<p.x+p.w;x+=22){g.beginPath();g.moveTo(x,p.y+3);g.lineTo(x+2,p.y+p.h);g.stroke();}
    g.fillStyle=this.s.level.accent;g.fillRect(p.x,p.y,p.w,1);g.fillStyle='#15222b';g.fillRect(p.x,p.y+p.h-2,p.w,2);
  }
  climb(c){const g=this.g;g.save();g.lineWidth=1.1;g.strokeStyle=c.type==='vine'?'#729567':'#a0acae';
    if(c.type==='ladder'){g.strokeStyle='#a1957d';for(const x of [c.x,c.x+c.w]){g.beginPath();g.moveTo(x,c.y);g.lineTo(x,c.y+c.h);g.stroke();}for(let y=c.y+4;y<c.y+c.h;y+=10){g.beginPath();g.moveTo(c.x,y);g.lineTo(c.x+c.w,y);g.stroke();}}
    else for(let y=c.y;y<c.y+c.h;y+=7){g.beginPath();g.ellipse(c.x+c.w/2+Math.sin(y*.04)*(c.type==='vine'?1.5:0),y+3,1.5,4,0,0,Math.PI*2);g.stroke();}g.restore();
  }
  elevator(e){this.platform(e);const g=this.g;g.strokeStyle='#6b7c81';g.lineWidth=.8;for(const x of [e.x+5,e.x+e.w-5]){g.beginPath();g.moveTo(x,288);g.lineTo(x,e.y);g.stroke();}this.glow(e.x+e.w/2,e.y,18,'#cfaa5955');}
  breakable(b){const g=this.g;this.panel(b.x,b.y,b.w,b.h,'#40505a','#8c9897');g.strokeStyle='#161f27';g.lineWidth=1;g.beginPath();g.moveTo(b.x+4,b.y);g.lineTo(b.x+9,b.y+12);g.lineTo(b.x+5,b.y+20);g.lineTo(b.x+11,b.y+b.h);g.stroke();if(b.secret)this.glow(b.x+8,b.y+b.h/2,9,'#c7886860');}
  pickup(q){const {g}=this,y=q.y+Math.sin(q.t*.09)*2;this.glow(q.x+5,y+5,13,'#d6537355');g.fillStyle='#eea6b4';g.beginPath();g.moveTo(q.x+5,y);g.bezierCurveTo(q.x+14,y+8,q.x+6,y+14,q.x+2,y+8);g.bezierCurveTo(q.x,y+5,q.x+3,y+2,q.x+5,y);g.fill();g.fillStyle='#ffe3d3';g.fillRect(q.x+5,y+5,1,3);}
  player(){const {g,s}=this,p=s.p,r=s.roster[s.choice],moving=Math.abs(p.vx)>.15;const motion=moving?Math.sin(s.tick*.2):0;const crouch=s.keys.down&&p.ground&&!p.climb;
    g.save();if(p.inv)g.globalAlpha=.55+.4*Math.sin(s.tick*.7)**2;
    if(p.spawnSafe>0){g.strokeStyle='#83d9cd88';g.lineWidth=.7;g.beginPath();g.ellipse(p.x+6,p.y+11,14,19,0,0,Math.PI*2);g.stroke();}
    this.glow(p.x+6,p.y+15,25,r.color+'38');
    this.sprite(s.choice,p.x+6+p.face*(p.attack?2:0),p.y+p.h,crouch?24:32+Math.abs(motion),p.face,motion,p.inv>0);g.restore();
  }
  enemy(e){const {g,s}=this;const index=e.type==='boss'?6:e.type==='warder'?7:e.type==='zealot'?5:4;this.sprite(index,e.x+e.w/2,e.y+e.h,e.h+6,e.face,Math.abs(e.vx)>.1?Math.sin(s.tick*.25+e.x):0,e.hurt>0);
    if(e.hurt||e.type==='boss'){this.panel(e.x-2,e.y-12,e.w+4,2.5,'#15212b');g.fillStyle='#d65f69';g.fillRect(e.x-2,e.y-12,(e.w+4)*Math.max(0,e.hp/e.max),2.5);}
    if(e.windup){this.glow(e.x+e.w/2,e.y+8,23,'#ed764959');this.text('!',e.x+e.w/2,e.y-16,13,'#ffc583','center','700');}
    else if(e.alert)this.text('•',e.x+e.w/2,e.y-8,8,'#de9e87','center');
  }
  slash(a){const {g,s}=this;g.save();g.strokeStyle=a.special?s.roster[s.choice].accent:'#f5dfc7';g.shadowColor=a.special?s.roster[s.choice].color:'#e7c5ad';g.shadowBlur=6;g.lineCap='round';g.lineWidth=a.special?2:1.3;g.globalAlpha=Math.min(1,a.life/5);
    if(a.special&&s.choice===2){g.beginPath();g.ellipse(a.x+a.w/2,a.y+a.h/2,a.w/2,a.h/2,0,0,Math.PI*2);g.stroke();}
    else if(a.special&&s.choice===3){g.beginPath();g.moveTo(a.x+11,a.y+a.h);g.quadraticCurveTo(a.x-5,a.y+a.h/2,a.x+11,a.y);g.stroke();}
    else for(let i=0;i<3;i++){g.beginPath();const x=a.face>0?a.x:a.x+a.w;g.moveTo(x,a.y+i*3);g.quadraticCurveTo(x+a.face*a.w*1.15,a.y+a.h*.3,x+a.face*a.w*.5,a.y+a.h+i*2);g.stroke();}g.restore();
  }
  hud(){const {g,s}=this,p=s.p;const grad=g.createLinearGradient(0,0,0,56);grad.addColorStop(0,'#071019f0');grad.addColorStop(1,'#07101900');g.fillStyle=grad;g.fillRect(0,0,320,56);
    this.text(s.roster[s.choice].name,10,14,8,'#e9e4d8','left','600');this.text(`${Math.max(0,p.hp)} / ${p.max}`,104,14,7,'#a5b7bf','right');
    this.panel(10,20,94,4,'#20323d');const blood=g.createLinearGradient(10,0,104,0);blood.addColorStop(0,'#923549');blood.addColorStop(1,'#e58d96');g.fillStyle=blood;g.fillRect(10,20,94*Math.max(0,p.hp/p.max),4);
    this.text(`${s.level.numeral} · ${s.roomNames[s.room]}`,310,14,8,'#e4d4bc','right','600');this.text(`Hunters ${s.kills}/${s.enemies.length}   ·   Secrets ${s.secrets}/2`,310,26,8,'#9bafb9','right');
    if(p.spawnSafe>0)this.text(p.arrival?'Move when ready · Protected':'Arrival protection',10,36,7,'#83cfbf');else if(p.special>0)this.text('Special recovering',10,36,7,'#cbaeb9');else this.text('↑ + Attack · Special ready',10,36,7,'#b7c8ce');
    if(s.msgTimer>0){this.panel(60,253,200,18,'#07121cdf','#354853');this.text(s.message,160,265,8,'#e2c9a4','center');}
    if(s.banner>0){g.save();g.globalAlpha=Math.max(0,Math.min(1,s.banner/25,(150-s.banner)/20));this.panel(30,100,260,63,'#07121ae8','#53605e');this.text(`LEVEL ${s.level.numeral} / IV`,160,119,8,'#aebbc0','center','600');this.text(s.level.name,160,139,14,'#f1d9b9','center','600');this.text('Humans hunt. Fight or keep moving.',160,153,9,'#a9c3c6','center');g.restore();}
  }
  end(){const {g,s}=this;g.fillStyle='#041019e8';g.fillRect(0,0,320,288);this.text(s.state==='win'?'YOU SURVIVED THE HUNT':'THE HUNTERS FOUND YOU',160,112,17,s.state==='win'?'#ead3b0':'#e2959f','center','600');this.text(`${s.totals.kills} hunters defeated · ${s.totals.secrets} secrets found`,160,142,10,'#acbdc5','center');this.panel(48,173,224,30,'#293f49','#6f858b');this.text(s.state==='win'?'Attack to start a new campaign':`Attack to retry Level ${s.level.numeral} as ${s.roster[s.choice].name.toLowerCase()}`,160,192,9,'#e5ecec','center');}
}
