'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function target(){const events=new Map();return {addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},dispatchEvent(event){event.preventDefault||=function(){this.defaultPrevented=true;};event.target||=this;for(const fn of events.get(event.type)||[])fn.call(this,event);this['on'+event.type]?.(event);return !event.defaultPrevented;}};}
function createGame({ui=false,storage={},denied=false,seed=42}={}){
  const persisted=new Map(Object.entries(storage)),elements=new Map(),buttons=[];
  const context2d=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*8})},{get:(t,k)=>k in t?t[k]:()=>{}});
  let document,width=1000,height=500,now=0,raf=0,pads=[],timerId=0;
  const timers=new Map();
  function element(tag='div'){
    const classes=new Set();let html='';
    const e=Object.assign(target(),{tagName:tag.toUpperCase(),style:{},dataset:{},children:[],hidden:false,disabled:false,open:false,textContent:'',value:'',type:'',
      classList:{add:(...a)=>a.forEach(x=>classes.add(x)),remove:(...a)=>a.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle(x,force){const yes=force??!classes.has(x);yes?classes.add(x):classes.delete(x);return yes;}},
      focus(){document.activeElement=this;},click(){this.dispatchEvent({type:'click',detail:0});},setAttribute(k,v){this[k]=String(v);},getAttribute(k){return this[k]??null;},removeAttribute(k){delete this[k];},
      getContext:()=>context2d,getBoundingClientRect:()=>({x:0,y:0,width,height,left:0,top:0,right:width,bottom:height}),setPointerCapture(){},
      showModal(){this.open=true;},close(){this.open=false;this.dispatchEvent({type:'close'});},
      closest(selector){return selector.includes(this.tagName.toLowerCase())?this:null;},
      querySelectorAll(selector){return this.children.filter(c=>selector.includes('[data-upgrade]')?c.dataset.upgrade:selector.includes('button')?['BUTTON','SELECT','INPUT'].includes(c.tagName)&&!c.disabled:false);}
    });
    Object.defineProperty(e,'innerHTML',{get:()=>html,set(value){html=value;for(const c of e.children)if(c.id)elements.delete(c.id);e.children=parse(value);}});
    return e;
  }
  function parse(html){const list=[];for(const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)){const e=element(match[1]),attrs=match[2];for(const a of attrs.matchAll(/([\w-]+)="([^"]*)"/g)){const [_,key,value]=a;if(key==='id'){e.id=value;elements.set(value,e);}else if(key.startsWith('data-'))e.dataset[key.slice(5)]=value;else e[key]=value;}e.checked=/\bchecked\b/.test(attrs);e.disabled=/\bdisabled\b/.test(attrs);e.hidden=/\bhidden\b/.test(attrs);if(e.id==='difficulty')e.value='arcade';if(e.dataset.key)buttons.push(e);list.push(e);}return list;}
  document=Object.assign(target(),{hidden:false,body:element('body'),activeElement:null,getElementById:id=>elements.get(id)||null,createElement:element,querySelectorAll:selector=>selector==='[data-key]'?buttons:[]});
  parse(fs.readFileSync(path.join(root,'index.html'),'utf8'));
  const random=Object.create(Math);let randomState=seed;random.random=()=>((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/4294967296);
  const sandbox=Object.assign(target(),{document,console,Math:random,URL,URLSearchParams,performance:{now:()=>now},localStorage:{getItem(key){if(denied)throw Error('denied');return persisted.get(key)??null;},setItem(key,value){if(denied)throw Error('denied');persisted.set(key,String(value));}},navigator:{getGamepads:()=>pads,vibrate:()=>true},location:{protocol:'http:',pathname:'/games/neon-shinobi/'},matchMedia:()=>({matches:false}),requestAnimationFrame:()=>++raf,setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),Event:class{constructor(type){this.type=type;}}});
  sandbox.window=sandbox;sandbox.self=sandbox;
  const context=vm.createContext(sandbox);
  const run=source=>vm.runInContext(source,context);
  const read=source=>JSON.parse(run('JSON.stringify('+source+')'));
  const load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  for(const file of ['store','game','campaign','controls'])load('js/'+file+'.js');
  if(ui)load('js/ui.js');else run("window.NSUI={hidePanel(){},refresh(){},announce(){},achievement(){},result(){},districtClear(){},pause(){if(mode==='playing'){mode='paused';running=false;clearInput();}},togglePause(){if(mode==='playing')this.pause();else if(mode==='paused'){mode='playing';running=true;clearInput();}},menuMove(){},menuActivate(){}};");
  return {run,read,context,document,elements,persisted,buttons,load,dispatch:(type,extra={})=>sandbox.dispatchEvent({type,...extra}),frame(ms){now=ms;return run(`loop(${ms})`);},step(seconds){for(let i=0;i<Math.ceil(seconds*120);i++)run('update(STEP)');},resize(w,h){width=w;height=h;run('resize()');},setPads(value){pads=value;},flushTimers(){const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());},get raf(){return raf;}};
}
module.exports={createGame};
