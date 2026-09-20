/** Original finds along the ten-sun hunt; entries appear only after discovery. */
export const RELICS = Object.freeze([
  { stageIndex: 0, name: 'Sunstone', detail: 'A stone darkened by a fire older than this trail.', hint: 'Search the safe ground near the middle of the first hunt.' },
  { stageIndex: 1, name: 'Frost Fang', detail: 'A worn tooth caught high above the frozen crossing.', hint: 'Two patient jumps lead from the lower shelf to the upper ridge.' },
  { stageIndex: 2, name: 'Cave Eye', detail: 'A jade-colored stone polished like an eye in the dark.', hint: 'The deep passage keeps its find near the middle of the route.' },
  { stageIndex: 3, name: 'Copper Feather', detail: 'A copper-colored feather shape left where the high winds turn.', hint: 'Climb the highland shelves; the upper path holds the find.' },
  { stageIndex: 4, name: 'Paired Fangs', detail: 'Two worn ivory fangs carried together through the amber valley.', hint: 'Look for steady footing between the valley’s hunting grounds.' },
  { stageIndex: 5, name: 'River Spiral', detail: 'A smooth loop of stone shaped by a river now gone.', hint: 'Search the solid banks among the broken crossings.' },
  { stageIndex: 6, name: 'Moon Crescent', detail: 'A silver crescent that catches even the smallest firelight.', hint: 'The long night shelters a find near the center of its trail.' },
  { stageIndex: 7, name: 'Storm Shard', detail: 'A sharp stone marked by a branching seam of white.', hint: 'Watch the ground as carefully as the sky near the route’s middle.' },
  { stageIndex: 8, name: 'Knotted Seal', detail: 'A flat stone scored by a traveler who came before.', hint: 'Seek a broad foothold in the narrowing passage.' },
  { stageIndex: 9, name: 'Beast Horn', detail: 'An ember-colored horn fragment carried home from the final hunt.', hint: 'Search the final trail before entering the Great Beast’s hunting ground.' }
].map(Object.freeze));

/** One craft may be carried at a time. Unlocks count only secured finds. */
export const CRAFTS = Object.freeze([
  { id: 'none', name: 'Unadorned', unlock: 0, detail: 'Travel with the original hunting skills.' },
  { id: 'forager', name: 'Forager', unlock: 1, detail: 'Meat restores up to 6 health instead of 4.' },
  { id: 'wind', name: 'Long Breath', unlock: 3, detail: 'Recover 32 stamina each second instead of 23.' },
  { id: 'edge', name: 'Stone Edge', unlock: 6, detail: 'A club has greater striking reach. Damage and wear stay the same.' }
].map(Object.freeze));
