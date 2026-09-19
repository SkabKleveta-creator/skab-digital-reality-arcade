export const KEY_ACTIONS = {ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyJ:'attack',KeyX:'attack',KeyK:'dodge',ShiftLeft:'dodge',ShiftRight:'dodge'};
const ACTIONS=['left','right','jump','attack','dodge'];
export class Inputs {
  constructor(){this.keys=new Set();this.pointers=new Map();this.taps=new Set();this.pad={};this.enabled=false;}
  key(code,down){const action=KEY_ACTIONS[code];if(!action)return false;if(down){if(!this.keys.has(code)&&this.enabled)this.taps.add(action);this.keys.add(code);}else this.keys.delete(code);return true;}
  pointer(id,action,down){if(down&&this.enabled){this.pointers.set(id,action);this.taps.add(action);}else this.pointers.delete(id);}
  sample(){const out={};for(const a of ACTIONS)out[a]=this.enabled&&(this.taps.has(a)||[...this.keys].some(k=>KEY_ACTIONS[k]===a)||[...this.pointers.values()].includes(a)||!!this.pad[a]);this.taps.clear();return out;}
  clear(){this.keys.clear();this.pointers.clear();this.taps.clear();this.pad={};}
}
