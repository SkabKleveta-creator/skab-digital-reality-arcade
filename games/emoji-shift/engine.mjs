import {RUNS,dailyRun,FREE_RUN,hashSeed,DAILY_RULES} from './levels.mjs';
export const SIZE=7,TYPES=['😀','😎','🤖','👾','💀','🔥'];
const copy=x=>JSON.parse(JSON.stringify(x));
const index=(r,c)=>r*SIZE+c;
export const adjacent=(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<49&&b<49&&Math.abs(Math.floor(a/7)-Math.floor(b/7))+Math.abs(a%7-b%7)===1;
export function matches(board,to=-1){
  const hits=new Set(),lines=[],powers=new Map(),rank={surge:1,burst:2,prism:3};
  for(const axis of ['row','col'])for(let outer=0;outer<SIZE;outer++)for(let inner=0;inner<SIZE;){
    const cells=[],at=k=>axis==='row'?index(outer,k):index(k,outer),face=board[at(inner)]?.face;
    do{cells.push(at(inner++))}while(inner<SIZE&&board[at(inner)]?.face===face);
    if(face&&cells.length>=3){cells.forEach(i=>hits.add(i));lines.push({axis,cells})}
  }
  const award=(i,p)=>{if(!powers.has(i)||rank[p]>rank[powers.get(i)])powers.set(i,p)};
  for(const {cells}of lines){const pivot=cells.includes(to)?to:cells[Math.floor(cells.length/2)];if(cells.length>=5)award(pivot,'prism');else if(cells.length===4)award(pivot,'surge')}
  for(const h of lines.filter(l=>l.axis==='row'))for(const v of lines.filter(l=>l.axis==='col'))for(const i of h.cells)if(v.cells.includes(i))award(i,'burst');
  return {hits:[...hits],powers};
}
export function comboInfo(a,b){
  if(!a?.power||!b?.power)return null;
  const pair=[a.power,b.power].sort().join('+');
  return ({
    'surge+surge':{name:'CROSSCURRENT',detail:'Both power tiles fire their full row and column.'},
    'burst+surge':{name:'WIDE SURGE',detail:'Clear three rows and three columns around the destination.'},
    'burst+burst':{name:'MEGA BURST',detail:'Clear a 5 × 5 area around the destination.'},
    'prism+surge':{name:'SPECTRUM SURGE',detail:'Every tile matching the Surge’s emoji fires a row and column.'},
    'burst+prism':{name:'SPECTRUM BURST',detail:'Every tile matching the Burst’s emoji becomes a 3 × 3 blast.'},
    'prism+prism':{name:'TOTAL RESET',detail:'Clear the entire board in one reaction.'}
  })[pair];
}
export function expandHits(board,initial,protectedCells=new Set()){
  const hits=new Set(initial),queue=[...hits],activated=[];
  const add=i=>{if(i>=0&&i<49&&!hits.has(i)){hits.add(i);queue.push(i)}};
  for(let q=0;q<queue.length;q++){
    const i=queue[q],t=board[i];if(!t?.power||protectedCells.has(i))continue;activated.push(i);
    const r=Math.floor(i/7),c=i%7;
    if(t.power==='surge')for(let k=0;k<7;k++){add(index(r,k));add(index(k,c))}
    if(t.power==='burst')for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(r+dr>=0&&r+dr<7&&c+dc>=0&&c+dc<7)add(index(r+dr,c+dc));
    if(t.power==='prism')board.forEach((other,j)=>{if(other?.face===t.face)add(j)});
  }
  return {hits:[...hits],activated};
}
export class Game{
  constructor({mode='campaign',runIndex=0,day='',seed=Date.now()>>>0}={}){
    this.mode=mode;this.runIndex=Math.max(0,Math.min(29,runIndex));this.day=day;
    this.rng=mode==='daily'?hashSeed(DAILY_RULES+day):seed>>>0;
    this.score=0;this.used=0;this.cleared=0;this.counts={};this.earned={surge:0,burst:0,prism:0};this.maxChain=0;this.combos=0;this.over=false;this.won=false;this.hints=0;
    this.moves=this.config.moves;this.board=[];this.makeBoard();
  }
  get config(){return this.mode==='daily'?dailyRun(this.day):this.mode==='free'?FREE_RUN:RUNS[this.runIndex]}
  random(){this.rng=(this.rng+0x6D2B79F5)>>>0;let t=this.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}
  tile(){return {face:TYPES[Math.floor(this.random()*6)],power:null,glitch:false}}
  makeBoard(){
    for(let attempt=0;attempt<100;attempt++){
      this.board=[];
      for(let i=0;i<49;i++){const r=Math.floor(i/7),c=i%7;let t;do{t=this.tile()}while(c>=2&&this.board[i-1].face===t.face&&this.board[i-2].face===t.face||r>=2&&this.board[i-7].face===t.face&&this.board[i-14].face===t.face);this.board.push(t)}
      if(this.availableMoves().length)break;
    }
    const pool=Array.from({length:49},(_,i)=>i);
    for(let n=0;n<(this.config.glitches||0);n++){const p=Math.floor(this.random()*pool.length);this.board[pool.splice(p,1)[0]].glitch=true}
    if(this.config.starterPowers){this.board[22].power='surge';this.board[23].power='burst'}
  }
  swap(a,b){[this.board[a],this.board[b]]=[this.board[b],this.board[a]]}
  availableMoves(){
    const found=[];
    for(let a=0;a<49;a++)for(const b of [a%7<6?a+1:-1,a<42?a+7:-1]){
      if(b<0)continue;if(comboInfo(this.board[a],this.board[b])){found.push([a,b]);continue}
      this.swap(a,b);const ok=matches(this.board).hits.length>0;this.swap(a,b);if(ok)found.push([a,b]);
    }return found;
  }
  objectives(){
    const g=this.config.goal,remaining=this.board.filter(t=>t.glitch).length,items=[];
    if(g.clear)items.push({label:'Clear tiles',value:this.cleared,target:g.clear});
    for(const [face,target]of Object.entries(g.faces||{}))items.push({label:face+' signals',value:this.counts[face]||0,target});
    if(g.glitch)items.push({label:'Purge static',value:(this.config.glitches||0)-remaining,target:g.glitch});
    if(g.chain)items.push({label:'Cascade depth',value:this.maxChain,target:g.chain});
    for(const [p,target]of Object.entries(g.power||{}))items.push({label:'Forge '+p,value:this.earned[p],target});
    if(g.combos)items.push({label:'Power combinations',value:this.combos,target:g.combos});
    if(g.score)items.push({label:'Score',value:this.score,target:g.score});
    return items;
  }
  get medal(){return !this.won?0:1+(this.moves>=Math.ceil(this.config.moves*.2)?1:0)+(this.hints===0?1:0)}
  get beltIn(){return this.config.conveyor?this.config.conveyor.every-this.used%this.config.conveyor.every:null}
  reshuffle(){
    const original=this.board.slice();
    for(let n=0;n<2000;n++){
      this.board=original.slice();for(let i=48;i>0;i--){const j=Math.floor(this.random()*(i+1));this.swap(i,j)}
      if(!matches(this.board).hits.length&&this.availableMoves().length)return;
    }
    this.board=original;throw Error('Unable to reroute this grid without losing tiles. Restart this shift.');
  }
  comboHits(a,b){
    const ta=this.board[a],tb=this.board[b],pair=[ta.power,tb.power].sort().join('+'),hits=new Set([a,b]),r=Math.floor(b/7),c=b%7;
    const add=(rr,cc)=>{if(rr>=0&&rr<7&&cc>=0&&cc<7)hits.add(index(rr,cc))};
    if(pair==='prism+prism')for(let i=0;i<49;i++)hits.add(i);
    else if(pair==='burst+surge')for(let d=-1;d<=1;d++)for(let k=0;k<7;k++){add(r+d,k);add(k,c+d)}
    else if(pair==='burst+burst')for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++)add(r+dr,c+dc);
    else if(pair.includes('prism')){
      const prism=ta.power==='prism'?ta:tb,other=ta.power==='prism'?tb:ta;prism.power=null;this.board.forEach((t,i)=>{if(t.face===other.face){t.power=other.power;hits.add(i)}});
    }
    return [...hits];
  }
  play(a,b){
    if(this.over||!adjacent(a,b))return {valid:false,frames:[]};
    // Work synchronously: the UI animates snapshots of an already saved, settled turn.
    this.swap(a,b);const combo=comboInfo(this.board[a],this.board[b]);let data=matches(this.board,b);
    if(!combo&&!data.hits.length){this.swap(a,b);return {valid:false,frames:[]}}
    this.used++;if(this.moves!==null)this.moves--;
    const frames=[{kind:'swap',board:copy(this.board),a,b}],comboLabel=combo?.name;let chain=0;
    if(combo){this.combos++;data={hits:this.comboHits(a,b),powers:new Map()}}
    const settle=(initial)=>{
      let next=initial,first=true;
      while(next.hits.length){
        chain++;if(chain>200)throw Error('Reaction limit reached. Restart this shift.');
        const keep=first&&!combo?new Map([...next.powers].filter(([i])=>!this.board[i]?.power)):new Map();
        const {hits,activated}=expandHits(this.board,next.hits,new Set(keep.keys()));
        frames.push({kind:'clear',board:copy(this.board),hits:hits.filter(i=>!keep.has(i)),chain,powered:activated.length>0||!!comboLabel});
        let purged=0,removed=0;
        for(let i=0;i<49;i++)if(this.board[i]?.glitch&&(hits.includes(i)||hits.some(j=>adjacent(i,j)))){this.board[i].glitch=false;purged++}
        for(const i of hits){if(keep.has(i))continue;const t=this.board[i];if(!t)continue;this.counts[t.face]=(this.counts[t.face]||0)+1;this.cleared++;removed++;this.board[i]=null}
        for(const [i,p]of keep){this.board[i].power=p;this.earned[p]++}
        this.score+=removed*100*chain+purged*250;this.maxChain=Math.max(this.maxChain,chain);
        const falls={};
        for(let c=0;c<7;c++){
          const stack=[];for(let r=6;r>=0;r--)if(this.board[index(r,c)])stack.push({tile:this.board[index(r,c)],r});
          for(let r=6;r>=0;r--){const old=stack.shift(),i=index(r,c);this.board[i]=old?.tile||this.tile();falls[i]=old?r-old.r:r+1}
        }
        frames.push({kind:'fall',board:copy(this.board),falls});next=matches(this.board);first=false;
      }
    };
    settle(data);
    const belt=this.config.conveyor;
    if(belt&&this.used%belt.every===0){
      const row=this.board.slice(belt.row*7,belt.row*7+7);row.unshift(row.pop());this.board.splice(belt.row*7,7,...row);
      frames.push({kind:'belt',row:belt.row,board:copy(this.board)});settle({...matches(this.board),powers:new Map()});
    }
    this.won=this.mode!=='free'&&this.objectives().every(o=>o.value>=o.target);this.over=this.won||this.moves===0;
    if(!this.over&&!this.availableMoves().length){this.reshuffle();frames.push({kind:'shuffle',board:copy(this.board)})}
    return {valid:true,frames,combo:comboLabel};
  }
  snapshot(){return copy({schema:1,mode:this.mode,runIndex:this.runIndex,day:this.day,rng:this.rng,board:this.board,score:this.score,used:this.used,moves:this.moves,cleared:this.cleared,counts:this.counts,earned:this.earned,maxChain:this.maxChain,combos:this.combos,over:this.over,won:this.won,hints:this.hints})}
  static restore(s){
    const num=(x,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
    if(!s||s.schema!==1||!['campaign','daily','free'].includes(s.mode)||!num(s.runIndex,29)||!num(s.rng,0xffffffff)||!Array.isArray(s.board)||s.board.length!==49||s.board.some(t=>!t||!TYPES.includes(t.face)||![null,'surge','burst','prism'].includes(t.power)||typeof t.glitch!=='boolean'))return null;
    if(s.mode==='daily'&&(!/^\d{4}-\d{2}-\d{2}$/.test(s.day)||!Number.isFinite(Date.parse(s.day+'T00:00:00Z'))))return null;
    for(const key of ['score','used','cleared','maxChain','combos','hints'])if(!num(s[key]))return null;
    if(!s.counts||!s.earned||TYPES.some(f=>s.counts[f]!==undefined&&!num(s.counts[f]))||['surge','burst','prism'].some(p=>!num(s.earned[p]))||typeof s.over!=='boolean'||typeof s.won!=='boolean')return null;
    const g=Object.assign(Object.create(Game.prototype),copy(s));
    if((g.mode==='free'?s.moves!==null:!num(s.moves,g.config.moves))||matches(s.board).hits.length)return null;
    return g;
  }
}
