const LEVEL_1 = {
  name: 'THE FIRST LIGHT',
  segments: [
    { type:'flat',      len:9 },
    { type:'flat',      len:6,  enemies:[{type:'raptor', at:3}] },
    { type:'gapflat',   len:2 },
    { type:'flat',      len:8,  enemies:[{type:'raptor', at:2},{type:'raptor', at:6}] },
    { type:'flat',      len:6,  items:[{type:'meat', at:3, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:14, row:6, gapCols:[4,9,13], enemies:[{type:'pterodactyl', at:6}] },
    { type:'flat',      len:8,  items:[{type:'club', at:4, row:4}], enemies:[{type:'raptor', at:6}] },
    { type:'cave',      len:22, enemies:[{type:'bat', at:3},{type:'bat', at:8},{type:'bat', at:13},{type:'raptor', at:18}] },
    { type:'flat',      len:10, items:[{type:'meat', at:5, row:4}], enemies:[{type:'pterodactyl', at:7}] },
    { type:'gapflat',   len:2 },
    { type:'flat',      len:6,  items:[{type:'club', at:3, row:4}] },
    { type:'flat',      len:16, boss:{type:'tiger', at:9} },
    { type:'goal',      len:8 },
  ],
};
const LEVEL_2 = {
  name: 'THE COLD CLIMB',
  segments: [
    { type:'flat',      len:6,  enemies:[{type:'raptor', at:3}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:10, row:6, gapCols:[3,7], enemies:[{type:'pterodactyl', at:5}] },
    { type:'flat',      len:5,  items:[{type:'meat', at:2, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'flat',      len:3 },   // stepping-stone between the two pits (double-pit is unclearable otherwise)
    { type:'gapflat',   len:2 },
    { type:'platforms', len:12, row:6, gapCols:[4,9], enemies:[{type:'pterodactyl', at:5},{type:'pterodactyl', at:9}] },
    { type:'flat',      len:6,  items:[{type:'club', at:3, row:4}], enemies:[{type:'raptor', at:5}] },
    { type:'cave',      len:16, enemies:[{type:'bat', at:3},{type:'bat', at:7},{type:'bat', at:11}] },
    { type:'flat',      len:8,  boss:{type:'tiger', at:5} },
    { type:'goal',      len:6 },
  ],
};

const LEVEL_3 = {
  name: 'DEEP DARK',
  segments: [
    { type:'flat', len:5,  enemies:[{type:'raptor', at:3}] },
    { type:'cave', len:14, enemies:[{type:'bat', at:2},{type:'bat', at:5},{type:'bat', at:8},{type:'bat', at:11}] },
    { type:'flat', len:4,  items:[{type:'meat', at:2, row:4}] },
    { type:'cave', len:20, enemies:[{type:'bat', at:2},{type:'bat', at:6},{type:'bat', at:10},{type:'bat', at:14},{type:'raptor', at:17}], items:[{type:'club', at:8, row:4}] },
    { type:'gapflat', len:2 },
    { type:'flat', len:6,  enemies:[{type:'raptor', at:4}] },
    { type:'cave', len:12, enemies:[{type:'bat', at:2},{type:'bat', at:9}], boss:{type:'tiger', at:6} },
    { type:'goal', len:6 },
  ],
};

const LEVEL_4 = {
  name: 'THE HIGH HUNT',
  segments: [
    { type:'flat',      len:5,  items:[{type:'club', at:2, row:4}] },
    { type:'platforms', len:14, row:6, gapCols:[4,9,13], enemies:[{type:'pterodactyl', at:3},{type:'pterodactyl', at:7},{type:'pterodactyl', at:11}] },
    { type:'flat',      len:4,  items:[{type:'meat', at:2, row:4}] },
    { type:'platforms', len:16, row:6, gapCols:[4,9], enemies:[{type:'pterodactyl', at:10}] },
    { type:'gapflat',   len:2 },
    { type:'flat',      len:7,  enemies:[{type:'raptor', at:3},{type:'raptor', at:5}] },
    { type:'flat',      len:8,  boss:{type:'tiger', at:5} },
    { type:'goal',      len:6 },
  ],
};

const LEVEL_5 = {
  name: 'TWO TEETH',
  segments: [
    { type:'flat', len:6,  items:[{type:'club', at:3, row:4}] },
    { type:'flat', len:6,  enemies:[{type:'raptor', at:2},{type:'raptor', at:4}], items:[{type:'meat', at:5, row:4}] },
    { type:'cave', len:12, enemies:[{type:'bat', at:3},{type:'bat', at:7},{type:'bat', at:10}] },
    { type:'flat', len:5,  items:[{type:'meat', at:2, row:4},{type:'club', at:4, row:4}] },
    { type:'flat', len:16, boss:{type:'tiger', at:5}, enemies:[{type:'tiger', at:11}] },
    { type:'goal', len:6 },
  ],
};

// ---- Second half of the run: same four species, harder structure ----

const LEVEL_6 = {
  name: 'RIVER OF STONE',
  segments: [
    { type:'flat',      len:5,  items:[{type:'club', at:2, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'flat',      len:3,  enemies:[{type:'raptor', at:1}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:12, row:6, gapCols:[4,9], enemies:[{type:'pterodactyl', at:5}] },
    { type:'flat',      len:4,  items:[{type:'meat', at:2, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'flat',      len:3 },
    { type:'gapflat',   len:2 },
    { type:'flat',      len:4,  enemies:[{type:'raptor', at:2}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:14, row:6, gapCols:[4,9,13], enemies:[{type:'pterodactyl', at:4},{type:'pterodactyl', at:10}] },
    { type:'flat',      len:5,  items:[{type:'club', at:2, row:4},{type:'meat', at:4, row:4}] },
    { type:'flat',      len:10, boss:{type:'tiger', at:6} },
    { type:'goal',      len:6 },
  ],
};

const LEVEL_7 = {
  name: 'LONG NIGHT',
  segments: [
    { type:'flat', len:5,  items:[{type:'club', at:2, row:4}] },
    { type:'cave', len:18, enemies:[{type:'bat', at:2},{type:'bat', at:5},{type:'bat', at:9},{type:'bat', at:13},{type:'raptor', at:16}] },
    { type:'flat', len:4,  items:[{type:'meat', at:2, row:4}] },
    { type:'cave', len:22, enemies:[{type:'bat', at:2},{type:'bat', at:6},{type:'bat', at:9},{type:'bat', at:13},{type:'bat', at:17},{type:'raptor', at:20}], items:[{type:'club', at:11, row:4}] },
    { type:'gapflat', len:2 },
    { type:'flat', len:4,  items:[{type:'meat', at:2, row:4}] },
    { type:'cave', len:18, enemies:[{type:'bat', at:3},{type:'bat', at:8},{type:'bat', at:12},{type:'raptor', at:15}] },
    { type:'flat', len:5,  items:[{type:'club', at:2, row:4}] },
    { type:'cave', len:12, enemies:[{type:'bat', at:3}], boss:{type:'tiger', at:7} },
    { type:'goal', len:6 },
  ],
};

const LEVEL_8 = {
  name: 'SKY TEETH',
  segments: [
    { type:'flat',      len:5,  items:[{type:'club', at:2, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:15, row:6, gapCols:[4,9,13], enemies:[{type:'pterodactyl', at:6},{type:'pterodactyl', at:11}] },
    { type:'flat',      len:4,  items:[{type:'meat', at:2, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:16, row:6, gapCols:[4,9,14], enemies:[{type:'pterodactyl', at:6},{type:'pterodactyl', at:11}] },
    { type:'flat',      len:5,  items:[{type:'club', at:2, row:4},{type:'meat', at:4, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:13, row:6, gapCols:[4,9], enemies:[{type:'pterodactyl', at:6}] },
    { type:'flat',      len:6,  enemies:[{type:'raptor', at:2},{type:'raptor', at:4}] },
    { type:'flat',      len:12, boss:{type:'tiger', at:5}, enemies:[{type:'pterodactyl', at:9}] },
    { type:'goal',      len:6 },
  ],
};

const LEVEL_9 = {
  name: 'THE NARROWS',
  segments: [
    { type:'flat',      len:5,  items:[{type:'club', at:2, row:4}] },
    { type:'cave',      len:14, enemies:[{type:'bat', at:3},{type:'bat', at:7},{type:'bat', at:11}] },
    { type:'flat',      len:4,  items:[{type:'meat', at:2, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:12, row:6, gapCols:[4,9], enemies:[{type:'pterodactyl', at:5}] },
    { type:'flat',      len:6,  enemies:[{type:'raptor', at:2},{type:'raptor', at:4}], items:[{type:'club', at:5, row:4}] },
    { type:'cave',      len:16, enemies:[{type:'bat', at:3},{type:'bat', at:8},{type:'bat', at:12},{type:'raptor', at:14}] },
    { type:'flat',      len:5,  items:[{type:'meat', at:2, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:12, row:6, gapCols:[4,9], enemies:[{type:'pterodactyl', at:4},{type:'pterodactyl', at:9}] },
    { type:'flat',      len:5,  items:[{type:'club', at:2, row:4},{type:'meat', at:4, row:4}] },
    { type:'flat',      len:14, boss:{type:'tiger', at:5}, enemies:[{type:'tiger', at:10}] },
    { type:'goal',      len:6 },
  ],
};

const LEVEL_10 = {
  name: 'GREAT BEAST',
  segments: [
    { type:'flat',      len:6,  items:[{type:'club', at:3, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'platforms', len:12, row:6, gapCols:[4,9], enemies:[{type:'pterodactyl', at:5},{type:'pterodactyl', at:9}] },
    { type:'flat',      len:5,  items:[{type:'meat', at:2, row:4}] },
    { type:'cave',      len:16, enemies:[{type:'bat', at:3},{type:'bat', at:7},{type:'bat', at:11},{type:'raptor', at:14}] },
    { type:'flat',      len:5,  items:[{type:'club', at:2, row:4},{type:'meat', at:4, row:4}] },
    { type:'gapflat',   len:2 },
    { type:'flat',      len:6,  enemies:[{type:'raptor', at:2},{type:'raptor', at:4}] },
    { type:'flat',      len:6,  items:[{type:'meat', at:2, row:4},{type:'club', at:4, row:4}] },
    // the last stand: three teeth
    { type:'flat',      len:22, boss:{type:'tiger', at:5}, enemies:[{type:'tiger', at:12},{type:'tiger', at:18}] },
    { type:'goal',      len:8 },
  ],
};

// Level registry — content is data; the engine already runs any of these.
const AUTHORED_ROUTES = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5,
                LEVEL_6, LEVEL_7, LEVEL_8, LEVEL_9, LEVEL_10];


const THEMES = ['dawn', 'frost', 'cavern', 'highlands', 'amber', 'river', 'night', 'storm', 'narrows', 'beast'];
const DESCRIPTIONS = [
  'Follow the first light through hunting grounds and ancient caverns.',
  'Cross the frost-cut ridges. Higher stone shelves offer another path.',
  'Read the shapes in the dark. Listen for wings inside the mountain.',
  'Hunt beneath the open sky, across the old highland crossings.',
  'Two sabertooths hold the amber valley. Choose when to fight.',
  'Find steady footing across the broken river of stone.',
  'Carry the fire through the longest caverns of the journey.',
  'Keep watch above. The sky hunters have claimed these cliffs.',
  'A final passage of stone, shadow and narrowing ground.',
  'Reach the ancient hunting ground and defeat the Great Beast.'
];

/** The original ten authored routes, with repaired footing and one final boss. */
export const LEVELS = AUTHORED_ROUTES.map((route, index) => ({
  ...route, theme: THEMES[index], description: DESCRIPTIONS[index],
  segments: route.segments.map((segment, segmentIndex) => {
    const copy = { ...segment, enemies: [...(segment.enemies || [])], items: [...(segment.items || [])] };
    delete copy.boss;
    if (segment.boss) {
      if (index === 9) {
        copy.enemies = [{ type: 'greatbeast', at: 12 }];
      } else copy.enemies.push({ type: 'tiger', at: segment.boss.at });
    }
    // Shelves are optional one-way ledges above safe ground, not mandatory walls.
    if (index === 1 && segmentIndex === 2) copy.shelves = [{at: 0, len: 3, row: 4}, {at: 4, len: 4, row: 3}];
    if (index === 3 && segmentIndex === 3) copy.shelves = [{at: 0, len: 4, row: 4}, {at: 5, len: 4, row: 3}, {at: 10, len: 4, row: 4}];
    return copy;
  })
}));

export const ENEMY_TYPES = Object.freeze({
  raptor: { w: 14, h: 13, hp: 3, damage: 1, speed: 20, flying: false },
  bat: { w: 10, h: 8, hp: 2, damage: 1, speed: 26, flying: true },
  pterodactyl: { w: 20, h: 12, hp: 3, damage: 1, speed: 25, flying: true },
  tiger: { w: 25, h: 16, hp: 10, damage: 2, speed: 18, flying: false },
  greatbeast: { w: 43, h: 31, hp: 42, damage: 3, speed: 19, flying: false }
});
