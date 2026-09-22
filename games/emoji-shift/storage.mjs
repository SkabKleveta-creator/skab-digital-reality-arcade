import {Game} from './engine.mjs';
export const SAVE_KEY='emoji-shift-expansion-v1',LEGACY_KEY='emoji-shift-runs-v02';
const natural=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
export function loadProfile(storage){
  let raw={},old={},warning=false;
  try{raw=JSON.parse(storage.getItem(SAVE_KEY)||'{}')||{};old=JSON.parse(storage.getItem(LEGACY_KEY)||'{}')||{}}catch{warning=true}
  const p={schema:1,unlocked:0,selected:0,best:0,complete:[],records:{},daily:{},sessions:{},lastMode:'campaign',sound:false};
  for(const source of [old,raw]){
    if(natural(source.unlocked,29))p.unlocked=Math.max(p.unlocked,source.unlocked);
    if(natural(source.selected,29))p.selected=source.selected;
    if(natural(source.best))p.best=Math.max(p.best,source.best);
    if(Array.isArray(source.complete))p.complete=[...new Set([...p.complete,...source.complete.filter(n=>natural(n,29))])];
  }
  // Finishing the old 25-run campaign opens the new chapter immediately.
  for(const n of p.complete)p.unlocked=Math.max(p.unlocked,Math.min(29,n+1));
  p.selected=Math.min(p.unlocked,p.selected);
  if(raw.records&&typeof raw.records==='object')for(const [k,v]of Object.entries(raw.records))if(/^\d+$/.test(k)&&natural(+k,29)&&v&&natural(v.best)&&natural(v.medal,3)&&(v.fewest===null||natural(v.fewest)))p.records[k]=v;
  if(raw.daily&&typeof raw.daily==='object')for(const [k,v]of Object.entries(raw.daily))if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&v&&natural(v.best)&&natural(v.medal,3)&&natural(v.attempts)&&(v.fewest===null||natural(v.fewest)))p.daily[k]=v;
  if(raw.sessions&&typeof raw.sessions==='object')for(const mode of ['campaign','daily','free']){const game=Game.restore(raw.sessions[mode]);if(game&&game.mode===mode&&(mode!=='campaign'||game.runIndex<=p.unlocked))p.sessions[mode]=game.snapshot()}
  if(['campaign','daily','free'].includes(raw.lastMode))p.lastMode=raw.lastMode;
  p.sound=raw.sound===true;return {profile:p,warning};
}
export function recordResult(p,g){
  if(g.mode==='free'){p.best=Math.max(p.best,g.score);return}
  const records=g.mode==='daily'?p.daily:p.records,key=g.mode==='daily'?g.day:g.runIndex;
  const r=records[key]||{best:0,medal:0,fewest:null,...(g.mode==='daily'?{attempts:0}:{})};
  r.best=Math.max(r.best,g.score);r.medal=Math.max(r.medal,g.medal);
  if(g.won){r.fewest=r.fewest===null?g.used:Math.min(r.fewest,g.used);if(g.mode==='campaign'){if(!p.complete.includes(g.runIndex))p.complete.push(g.runIndex);p.unlocked=Math.max(p.unlocked,Math.min(29,g.runIndex+1))}}
  records[key]=r;p.best=Math.max(p.best,g.score);
}
