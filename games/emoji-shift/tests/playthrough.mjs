import {Game} from '../engine.mjs';
import fs from 'node:fs';
export function bestMove(g){
  const before=g.objectives(),candidates=g.availableMoves().map(pair=>{
    const trial=Game.restore(g.snapshot());trial.play(...pair);
    let value=trial.won?1e7:0;
    const after=trial.objectives();
    for(let i=0;i<before.length;i++){
      const a=before[i],b=after[i],gain=Math.min(b.value,b.target)-Math.min(a.value,a.target);
      const weight=/Forge/.test(a.label)?3500:/Cascade/.test(a.label)?1800:/static/.test(a.label)?600:/combination/.test(a.label)?2500:/signals/.test(a.label)?250:/Score/.test(a.label)?.15:40;
      value+=gain*weight;
    }
    value+=(trial.score-g.score)*.015+trial.board.filter(t=>t.power).length*25;
    return {pair,trial,value};
  }).sort((a,b)=>b.value-a.value);
  return candidates[0];
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const report={campaign:[],daily:[],date:new Date().toISOString()};
 for(let runIndex=0;runIndex<30;runIndex++){
   let completed=null;
   for(let seed=1;seed<=15&&!completed;seed++){
     let g=new Game({runIndex,seed});const moves=[];
     while(!g.over){const b=bestMove(g);if(!b)throw Error('Stall in run '+runIndex);moves.push(b.pair);g=b.trial}
     if(g.won)completed={run:runIndex+1,seed,moves,score:g.score,shifts:g.used};
   }
   if(!completed)throw Error('No winning playthrough found for run '+(runIndex+1));
   report.campaign.push(completed);console.log('PASS campaign',completed.run,'seed',completed.seed,'shifts',completed.shifts);
 }
 for(let n=0;n<31;n++){
   const date=new Date('2026-09-22T00:00:00Z');date.setUTCDate(date.getUTCDate()+n);const day=date.toISOString().slice(0,10);let g=new Game({mode:'daily',day});
   while(!g.over){const b=bestMove(g);if(!b)throw Error('Stalled Daily '+day);g=b.trial}
   report.daily.push({day,won:g.won,score:g.score,shifts:g.used});
 }
 console.log('Daily wins',report.daily.filter(x=>x.won).length,'/',report.daily.length);
 fs.writeFileSync(new URL('./playthrough-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
}
