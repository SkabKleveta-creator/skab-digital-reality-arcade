import test from 'node:test';
import assert from 'node:assert/strict';
import {Inputs} from '../js/input.mjs';
test('releasing D does not cancel a separately held Right arrow',()=>{const i=new Inputs();i.enabled=true;i.key('ArrowRight',true);i.key('KeyD',true);i.sample();i.key('KeyD',false);assert.equal(i.sample().right,true);i.key('ArrowRight',false);assert.equal(i.sample().right,false);});
test('short tap survives until the next physics step',()=>{const i=new Inputs();i.enabled=true;i.key('Space',true);i.key('Space',false);assert.equal(i.sample().jump,true);assert.equal(i.sample().jump,false);});
test('touch release does not cancel another finger or keyboard source',()=>{const i=new Inputs();i.enabled=true;i.pointer(1,'jump',true);i.pointer(2,'right',true);i.key('KeyD',true);i.sample();i.pointer(2,'right',false);assert.deepEqual(i.sample(),{left:false,right:true,jump:true,attack:false,dodge:false});i.pointer(1,'jump',false);assert.equal(i.sample().jump,false);});
test('paused input cannot move and clear releases every source',()=>{const i=new Inputs();i.enabled=true;i.key('KeyD',true);i.pointer(1,'jump',true);i.pad.attack=true;i.enabled=false;assert.ok(Object.values(i.sample()).every(v=>v===false));i.clear();i.enabled=true;assert.ok(Object.values(i.sample()).every(v=>v===false));});
