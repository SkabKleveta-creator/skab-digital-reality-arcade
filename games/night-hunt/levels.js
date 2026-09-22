// Four authored maps. Coordinates use the same 1280 × 576 simulation space.
// Exits never depend on enemies, bosses, secrets, or inventory.
const NIGHT_LEVELS = [
  {
    name:'THE GALLOWS WARD', numeral:'I', theme:'ward', tint:'#17293235', accent:'#9eb9ab',
    rooms:['THE HANGING GARDEN','THE BELLWORKS','THE BURIED CHOIR',"THE WARDEN'S KEEP"],
    platforms:[[40,488,112],[192,424,112],[248,360,72],[336,488,96],[448,424,96],[560,344,80],[592,504,48],[656,488,112],[784,424,112],[880,360,80],[832,280,64],[976,488,112],[1104,424,96],[1216,360,64]],
    climbs:[[263,360,192,'vine'],[482,344,208,'ladder'],[848,280,272,'chain'],[1174,360,192,'chain']],
    elevator:[928,304,500,.65], caches:[[608,520,true],[896,328,true],[1056,456,false]],
    health:[[348,536],[964,536]],
    enemies:[[180,552,'hunter'],[224,424,'hunter'],[380,488,'hunter'],[506,424,'zealot'],[586,344,'warder'],[700,488,'zealot'],[828,424,'hunter'],[900,360,'warder'],[1018,488,'zealot'],[1130,424,'warder'],[1204,552,'boss']]
  },
  {
    name:'THE DROWNED FOUNDRY', numeral:'II', theme:'foundry', tint:'#76320c42', accent:'#df9c56',
    rooms:['THE INTAKE','CHAINWORKS','THE SMELTING FLOOR','THE FOREMAN'],
    platforms:[[112,496,128],[208,432,112],[272,368,112],[368,480,96],[448,416,112],[512,352,112],[584,288,96],[656,488,144],[736,424,128],[832,360,96],[912,296,96],[960,488,112],[1064,424,112],[1152,360,128]],
    climbs:[[220,432,120,'ladder'],[290,368,184,'chain'],[540,352,200,'chain'],[610,288,264,'ladder'],[848,360,192,'chain'],[1180,360,192,'ladder']],
    elevator:[916,296,520,.85], caches:[[288,336,true],[604,256,true],[1100,520,false]],
    health:[[450,536],[808,536],[1180,536]],
    enemies:[[192,552,'hunter'],[240,432,'warder'],[310,552,'zealot'],[395,480,'hunter'],[475,416,'warder'],[554,352,'hunter'],[610,288,'zealot'],[690,552,'hunter'],[764,424,'warder'],[864,360,'hunter'],[936,296,'zealot'],[1020,552,'warder'],[1120,424,'zealot'],[1204,552,'boss']]
  },
  {
    name:'THORNWOOD ASCENT', numeral:'III', theme:'wood', tint:'#19482e50', accent:'#a8c47b',
    rooms:['THE ROOT HOLLOW','THE HUNTER CANOPY','THE HANGING GROVE','THE OLD WATCH'],
    platforms:[[96,488,128],[176,424,96],[224,360,128],[304,296,80],[352,488,128],[432,416,112],[496,344,96],[576,272,112],[656,488,112],[720,416,112],[784,344,128],[864,272,96],[944,488,128],[1040,416,112],[1120,344,144]],
    climbs:[[192,424,128,'vine'],[240,360,192,'vine'],[328,296,256,'vine'],[464,416,136,'vine'],[524,344,208,'chain'],[612,272,280,'vine'],[816,344,208,'vine'],[884,272,280,'vine'],[1152,344,208,'chain']],
    elevator:[912,272,520,1], caches:[[330,264,true],[890,240,true],[1008,456,false]],
    health:[[392,536],[740,400],[1088,536]],
    enemies:[[196,552,'hunter'],[214,424,'zealot'],[270,360,'warder'],[330,296,'hunter'],[388,552,'warder'],[468,416,'hunter'],[548,344,'zealot'],[602,272,'warder'],[672,552,'hunter'],[748,416,'warder'],[820,344,'zealot'],[898,272,'hunter'],[970,552,'warder'],[1018,488,'hunter'],[1080,416,'zealot'],[1158,344,'warder'],[1204,552,'boss']]
  },
  {
    name:'THE ASHEN CATHEDRAL', numeral:'IV', theme:'cathedral', tint:'#472a6250', accent:'#d2adce',
    rooms:['THE PROCESSIONAL','THE BONE GALLERY','THE BROKEN BELFRY','THE HIGH INQUISITOR'],
    platforms:[[104,488,112],[184,424,112],[264,360,112],[320,296,112],[376,488,96],[456,424,112],[536,360,112],[608,296,96],[680,488,112],[752,424,112],[832,360,112],[904,296,112],[968,488,112],[1056,424,112],[1136,360,144]],
    climbs:[[200,424,128,'chain'],[280,360,192,'ladder'],[346,296,256,'chain'],[480,424,128,'ladder'],[564,360,192,'chain'],[628,296,256,'chain'],[780,424,128,'chain'],[866,360,192,'ladder'],[930,296,256,'chain'],[1160,360,192,'chain']],
    elevator:[1020,296,520,1.15], caches:[[356,264,true],[946,264,true],[1160,520,false]],
    health:[[410,536],[690,536],[1076,408]],
    enemies:[[194,552,'warder'],[220,424,'hunter'],[294,360,'zealot'],[360,296,'warder'],[400,552,'hunter'],[492,424,'zealot'],[550,552,'warder'],[586,360,'hunter'],[652,296,'zealot'],[714,488,'warder'],[770,552,'hunter'],[798,424,'zealot'],[856,360,'warder'],[944,296,'zealot'],[980,552,'hunter'],[1006,488,'warder'],[1084,424,'zealot'],[1166,360,'warder'],[1126,552,'hunter'],[1210,552,'boss']]
  }
];
