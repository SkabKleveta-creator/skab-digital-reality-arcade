"use strict";
// All saves are local, versioned and validated. Storage failure never blocks play.
window.NSStore=(()=>{
  const KEY='neonshinobi_v2';
  const clamp=(v,min,max,fallback=min)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
  const integer=(v,min,max,fallback=min)=>Math.floor(clamp(v,min,max,fallback));
  const difficulties=['story','arcade','ronin'];
  const achievementIds=['first','relay','ghost','collector','city','ronin'];
  const fresh=()=>({version:2,settings:{sound:true,volume:.65,reducedMotion:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,haptics:true},checkpoint:null,runs:[],achievements:[],best:0});
  function checkpoint(raw){
    if(!raw||raw.version!==2||!difficulties.includes(raw.difficulty)||!Number.isInteger(raw.district)||raw.district<0||raw.district>5)return null;
    const upgrades={};for(const key of ['blade','mobility','vitality','flow'])upgrades[key]=integer(raw.upgrades?.[key],0,3);
    return {version:2,runId:typeof raw.runId==='string'?raw.runId.slice(0,64):'recovered',district:raw.district,difficulty:raw.difficulty,cycle:integer(raw.cycle,0,9),score:integer(raw.score,0,1e9),hp:integer(raw.hp,1,10,5),rage:clamp(raw.rage,0,100),upgrades,stats:{kills:integer(raw.stats?.kills,0,100000),shards:integer(raw.stats?.shards,0,10000),time:clamp(raw.stats?.time,0,1e7),hits:integer(raw.stats?.hits,0,100000),maxCombo:integer(raw.stats?.maxCombo,0,100000)}};
  }
  let data=fresh(),available=true;
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');
    if(raw?.version===2){
      const defaults=data.settings;
      for(const name of ['sound','reducedMotion','haptics'])if(typeof raw.settings?.[name]==='boolean')defaults[name]=raw.settings[name];
      defaults.volume=clamp(raw.settings?.volume,0,1,.65);
      data.checkpoint=checkpoint(raw.checkpoint);
      data.best=integer(raw.best,0,1e9);
      data.achievements=Array.isArray(raw.achievements)?achievementIds.filter(id=>raw.achievements.includes(id)):[];
      data.runs=Array.isArray(raw.runs)?raw.runs.filter(r=>r&&typeof r.id==='string'&&difficulties.includes(r.difficulty)&&Number.isFinite(r.score)).slice(0,10).map(r=>({id:r.id.slice(0,64),difficulty:r.difficulty,score:integer(r.score,0,1e9),district:integer(r.district,1,6),won:r.won===true,time:integer(r.time,0,1e7),cycle:integer(r.cycle,0,9)})):[];
    }
    data.best=Math.max(data.best,integer(Number(localStorage.getItem('neonshinobi_best')),0,1e9));
  }catch(_){}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(data));available=true;}catch(_){available=false;}return available;}
  save();
  return {
    get settings(){return data.settings;},get available(){return available;},get data(){return data;},validateCheckpoint:checkpoint,
    setSetting(key,value){if(['sound','reducedMotion','haptics'].includes(key)&&typeof value==='boolean')data.settings[key]=value;if(key==='volume')data.settings.volume=clamp(value,0,1,.65);save();},
    saveCheckpoint(value){data.checkpoint=checkpoint(value);save();},clearCheckpoint(){data.checkpoint=null;save();},
    unlock(id){if(!achievementIds.includes(id)||data.achievements.includes(id))return;data.achievements.push(id);save();window.NSUI?.achievement(id);},
    record(run){data.best=Math.max(data.best,integer(run.score,0,1e9));const previous=data.runs.find(r=>r.id===run.id);if(!previous||run.score>=previous.score){data.runs=data.runs.filter(r=>r.id!==run.id);data.runs.push(run);}data.runs.sort((a,b)=>b.score-a.score);data.runs=data.runs.slice(0,10);save();}
  };
})();
