"use strict";
window.NSControls=(()=>{
  const sources=new Map(),pointers=new Map();
  const gameplay=new Set(['KeyA','KeyD','ArrowLeft','ArrowRight','KeyW','ArrowUp','Space','KeyJ','KeyK','ShiftLeft','ShiftRight','KeyL','KeyS','ArrowDown','KeyR']);
  const ownedButtons=[...document.querySelectorAll('[data-key]')];
  let previous=[],padIndex=null,waitForNeutral=true;
  function setInput(code,down,source){
    let owners=sources.get(code);
    if(!owners){owners=new Set();sources.set(code,owners);}
    const wasDown=owners.size>0;
    if(down)owners.add(source);else owners.delete(source);
    keys[code]=owners.size>0;
    if(keys[code]&&!wasDown)jp.add(code);
  }
  function releaseAll(){sources.clear();pointers.clear();for(const code in keys)keys[code]=false;jp.clear();for(const b of ownedButtons)b.classList.remove('pressed');waitForNeutral=true;}
  function editable(target){return !!target?.closest?.('input,select,textarea,[contenteditable="true"]');}
  addEventListener('keydown',event=>{
    if(editable(event.target))return;
    if(event.code==='Escape'||event.code==='KeyP'){
      if($('modal').open)return;
      event.preventDefault();if(!event.repeat)window.NSUI?.togglePause();return;
    }
    if(event.code==='KeyM'&&!event.repeat){window.NSUI?.toggleSound();return;}
    if(mode!=='playing'||$('modal').open)return;
    if(gameplay.has(event.code)){event.preventDefault();setInput(event.code,true,'keyboard');}
  });
  addEventListener('keyup',event=>{if(gameplay.has(event.code)){setInput(event.code,false,'keyboard');if(mode==='playing')event.preventDefault();}});
  for(const button of ownedButtons){
    button.addEventListener('pointerdown',event=>{
      if(mode!=='playing'||event.button!==0)return;
      event.preventDefault();button.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId,{button,code:button.dataset.key});
      setInput(button.dataset.key,true,'pointer:'+event.pointerId);button.classList.add('pressed');
    });
    const release=event=>{const pointer=pointers.get(event.pointerId);if(!pointer)return;setInput(pointer.code,false,'pointer:'+event.pointerId);pointers.delete(event.pointerId);if(![...pointers.values()].some(p=>p.button===pointer.button))pointer.button.classList.remove('pressed');};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
    button.addEventListener('contextmenu',event=>event.preventDefault());
  }
  addEventListener('blur',()=>{releaseAll();window.NSUI?.pause('Window lost focus');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseAll();window.NSUI?.pause('Game moved to the background');}});
  function poll(){
    let pads=[];try{pads=Array.from(navigator.getGamepads?.()||[]);}catch(_){}
    const pad=pads.find(p=>p?.connected&&p.mapping==='standard');
    if(!pad){if(padIndex!==null){releaseAll();window.NSUI?.pause('Controller disconnected');$('inputStatus').textContent='KEYBOARD / TOUCH';}padIndex=null;previous=[];return;}
    if(padIndex!==pad.index){padIndex=pad.index;previous=[];waitForNeutral=true;$('inputStatus').textContent='GAMEPAD CONNECTED';}
    const pressed=i=>!!pad.buttons[i]?.pressed;
    const edge=i=>pressed(i)&&!previous[i];
    const left=pressed(14)||(pad.axes[0]||0)<-.35,right=pressed(15)||(pad.axes[0]||0)>.35;
    const states={TL:left,TR:right,TJ:pressed(0)||pressed(12),TA:pressed(1),TD:pressed(2)||pressed(13),TG:pressed(3)};
    if(!Object.values(states).some(Boolean))waitForNeutral=false;
    if(edge(9))window.NSUI?.togglePause();
    else if(edge(8))window.NSUI?.openHelp();
    else if(mode!=='playing'||$('modal').open){
      if(edge(12)||edge(14))window.NSUI?.menuMove(-1);
      if(edge(13)||edge(15))window.NSUI?.menuMove(1);
      if(edge(0))window.NSUI?.menuActivate();
      if(edge(1)&&$('modal').open)$('modal').close();
    }
    if(mode==='playing'&&!waitForNeutral)for(const [code,value] of Object.entries(states))setInput(code,value,'gamepad');
    previous=pad.buttons.map(button=>button.pressed);
  }
  return {setInput,releaseAll,poll};
})();
