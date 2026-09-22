export const RUNS=[
      {name:'WARM SIGNAL',danger:'✨ Calm grid — learn the power clues.',goal:{clear:28},moves:18,sector:'mechanical',clue:'Match 4 = ⚡ Surge. T/L = 💥 Burst. 5 = 🌈 Prism.'},
      {name:'FIRE DRILL',danger:'🔥 Thermal surge — collect the flames.',goal:{faces:{'🔥':8}},moves:20,sector:'mechanical',clue:'A ⚡ Surge can cut through a crowded flame lane.'},
      {name:'MACHINE MOOD',danger:'🤖👾 Machine jam — balance both signals.',goal:{faces:{'🤖':6,'👾':6}},moves:22,sector:'mechanical',clue:'💥 Burst clears a tight knot around the machine jam.'},
      {name:'CHAIN LINK',danger:'🔗 Unstable handoff — force a cascade.',goal:{chain:2},moves:23,sector:'warehouse',clue:'Set a match above another. Falling tiles create the chain.'},
      {name:'SIGNAL STORM',danger:'📵 Static storm — purge glitched signals.',goal:{clear:36,glitch:7},glitches:7,moves:26,sector:'warehouse',clue:'Clear a match beside 📵 static to purge it. 🌈 Prism saves a jammed run.'},
      {name:'COOL DOWN',danger:'😎 Heat breaks — keep the cool signals moving.',goal:{faces:{'😎':11}},moves:22,sector:'warehouse',clue:'Build horizontal matches. ⚡ Surge can clear a full traffic lane.'},
      {name:'NIGHT WATCH',danger:'💀 False alarms — filter the skull signals.',goal:{faces:{'💀':12}},moves:23,sector:'rooftop',clue:'Don’t chase every match. Route the 💀 signals toward your power tiles.'},
      {name:'ROOFTOP RELAY',danger:'😀💀 Mixed signal traffic — restore both ends.',goal:{faces:{'😀':8,'💀':8}},moves:25,sector:'rooftop',clue:'A 💥 Burst can rebalance both target types in one clean reaction.'},
      {name:'LIGHTNING LADDER',danger:'⚡ Power spikes — build a deep cascade.',goal:{chain:3},moves:26,sector:'rooftop',clue:'Think two matches ahead. A 3-chain is more valuable than a fast clear.'},
      {name:'LAST LIGHT',danger:'🌈 Core blackout — purge the storm and restore the board.',goal:{clear:46,glitch:10},glitches:10,moves:29,sector:'core',clue:'The final shift needs every tool: ⚡ lanes, 💥 knots, and 🌈 full-color clears.'},
      {name:'SWITCHYARD',danger:'⚡ Rail surge — forge two lane breakers.',goal:{clear:22,power:{surge:2}},moves:27,sector:'neon',clue:'Build two four-in-a-row matches. Keep the ⚡ tiles alive until the grid needs them.'},
      {name:'CRUSH ZONE',danger:'💥 Compactor jam — forge a burst inside the pressure.',goal:{clear:26,power:{burst:1}},moves:27,sector:'neon',clue:'Cross a horizontal and vertical match. The intersection becomes a 💥 Burst.'},
      {name:'PRISM VAULT',danger:'🌈 Color lock — forge a spectrum breaker.',goal:{faces:{'😀':6},power:{prism:1}},moves:29,sector:'neon',clue:'A five-match creates 🌈 Prism. Save it for a color-heavy board.'},
      {name:'SIGNAL CENSUS',danger:'😀🤖🔥 Triple check — prove all three feeds.',goal:{faces:{'😀':5,'🤖':5,'🔥':5}},moves:29,sector:'neon',clue:'Three feeds, one grid. Plan your clears instead of clearing whatever glows.'},
      {name:'THERMAL VAULT',danger:'🔥📵 Heat in the walls — pull flames past the static.',goal:{faces:{'🔥':10},glitch:4},glitches:4,moves:30,sector:'neon',clue:'A clear beside 📵 static purges it. Flame matches must do double duty.'},
      {name:'GHOST TRAIN',danger:'👾💀 False passengers — sort the night traffic.',goal:{faces:{'👾':8,'💀':8},glitch:3},glitches:3,moves:30,sector:'subway',clue:'Keep your targets near each other. A late 💥 Burst can clean an entire platform.'},
      {name:'RUSH HOUR',danger:'🚇 Score pressure — make every shift count.',goal:{score:6500},moves:26,sector:'subway',clue:'Cascades multiply points. Don’t spend a shift unless it sets up the next one.'},
      {name:'PLATFORM DROP',danger:'🔗 Signal drop — build a four-deep chain.',goal:{clear:34,chain:4},moves:32,sector:'subway',clue:'Leave a match waiting below. The falling tile is the real play.'},
      {name:'TERMINAL TWELVE',danger:'🧠 Full system read — sample every signal.',goal:{faces:{'😀':5,'😎':5,'🤖':5,'👾':5,'💀':5,'🔥':5}},moves:34,sector:'subway',clue:'No signal can be ignored. Use broad clears to fill the gaps in your census.'},
      {name:'STATIC QUARRY',danger:'📵 Deep interference — clear the red wall.',goal:{clear:44,glitch:10},glitches:10,moves:34,sector:'subway',clue:'Purge static from the outside inward. A 🌈 Prism can reopen a dead field.'},
      {name:'POWER CIRCUIT',danger:'⚡💥🌈 All tools online — forge the full kit.',goal:{clear:34,power:{surge:1,burst:1,prism:1}},moves:35,sector:'void',clue:'This run is about construction, not speed. Forge every tool before the grid runs out.'},
      {name:'MIRROR SIGNAL',danger:'🤖👾 Reflected feed — keep both sides even.',goal:{faces:{'🤖':10,'👾':10},chain:2},moves:35,sector:'void',clue:'Balance the reflected colors while leaving a second reaction below.'},
      {name:'EMBER TUNNEL',danger:'🔥📵 Fire below — clear the tunnel walls.',goal:{faces:{'🔥':13},glitch:7},glitches:7,moves:36,sector:'void',clue:'🔥 clears count, but only close reactions will erase the 📵 wall.'},
      {name:'COLOR BLACKOUT',danger:'🌑 Six signals fading — restore every color.',goal:{faces:{'😀':7,'😎':7,'🤖':7,'👾':7,'💀':7,'🔥':7}},moves:38,sector:'void',clue:'Every color has a quota. Use ⚡ and 🌈 only when they repair the weakest feed.'},
      {name:'AURORA RESET',danger:'🌈📵 Final surge — restore the entire spectrum.',goal:{clear:58,glitch:12,chain:3,power:{surge:1,burst:1,prism:1}},glitches:12,moves:42,sector:'core',clue:'The final reset needs everything: a chain, all three tools, a clear board, and no static left.'}
];
RUNS.push(
  {name:'BELT START',sector:'foundry',danger:'A moving floor',goal:{clear:40},moves:25,conveyor:{row:3,every:3},clue:'The marked row moves right after every third shift. Tiles wrap around the edge.'},
  {name:'SORTING LINE',sector:'foundry',danger:'Route the cargo',goal:{faces:{'🤖':10,'🔥':10}},moves:29,conveyor:{row:4,every:3},clue:'Time your robot and flame matches around the marked conveyor row.'},
  {name:'CROSS CURRENT',sector:'foundry',danger:'Build a reaction',goal:{clear:55,combos:1},moves:32,conveyor:{row:2,every:3},starterPowers:true,clue:'Two adjacent power tiles can combine without a match. Select them to preview the blast.'},
  {name:'STATIC DELIVERY',sector:'foundry',danger:'Clear the moving interference',goal:{clear:60,glitch:8},glitches:8,moves:34,conveyor:{row:5,every:2},clue:'Static travels with its tile. Match beside it or hit it directly with a reaction.'},
  {name:'FOUNDRY RESTART',sector:'foundry',danger:'Three-stage sector finale',goal:{clear:75,glitch:9,combos:1},glitches:9,moves:40,conveyor:{row:3,every:3},starterPowers:true,finale:true,clue:'Purge the interference, combine a power pair, then complete the system flush. All progress counts from the start.'}
);
export const VERSION='2026.09.22';
export const DAILY_RULES='daily-v1';
export function dayKey(date=new Date()){return date.toISOString().slice(0,10)}
export function hashSeed(text){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function dailyRun(day){
  const n=hashSeed(DAILY_RULES+day),faces=['😀','😎','🤖','👾','💀','🔥'];
  return {name:'DAILY SHIFT CHALLENGE',sector:'daily',danger:day+' · same puzzle worldwide',goal:{clear:65,faces:{[faces[n%6]]:10},glitch:5},glitches:5,moves:30,starterPowers:true,conveyor:n%2?{row:2+n%3,every:4}:null,clue:'One shared puzzle. Unlimited retries. Your best result stays on this device.'};
}
export const FREE_RUN={name:'FREE PLAY',sector:'void',danger:'Room to experiment',goal:{},moves:null,clue:'Unlimited shifts. Build powers and explore their combinations at your own pace.'};
