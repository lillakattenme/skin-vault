import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'vault-creator-'));
for(const name of ['tier-model','roulette-model','arsenal','drag-scroll'])await fs.writeFile(path.join(temp,name+'.mjs'),ts.transpileModule(await fs.readFile('src/lib/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {moveSkin,newRows,validBoards}=await import(path.join(temp,'tier-model.mjs'));
const {winnerAction}=await import(path.join(temp,'roulette-model.mjs'));
const {arsenalGroups}=await import(path.join(temp,'arsenal.mjs'));
test('moving and reordering keeps one copy and returning restores the pool',()=>{
 const rows=newRows();rows[0].skins=['one','two'];rows[1].skins=['three'];
 const moved=moveSkin(rows,'one',rows[1].id,'three');assert.deepEqual(moved[0].skins,['two']);assert.deepEqual(moved[1].skins,['one','three']);assert.deepEqual(rows[0].skins,['one','two']);
 const reordered=moveSkin(moved,'three',rows[1].id,'one');assert.deepEqual(reordered[1].skins,['three','one']);
 assert.ok(moveSkin(reordered,'one',null).every(r=>!r.skins.includes('one')));
});
test('stored tier boards reject invalid data and each template starts separately',()=>{
 assert.ok(validBoards({Vandal:newRows(),Phantom:newRows()}));assert.equal(validBoards({Vandal:[{id:'bad',color:'url(x)',skins:[]}]}),false);assert.equal(validBoards({Vandal:[]}),false);
 const a=newRows(),b=newRows();a[0].skins.push('owned');assert.deepEqual(b[0].skins,[]);
});
test('roulette never suggests wishlist for owned skins, including dual flags',()=>{
 assert.equal(winnerAction(false,{owned:true,wished:false}),'owned');assert.equal(winnerAction(false,{owned:true,wished:true}),'owned');assert.equal(winnerAction(false,{owned:false,wished:true}),'wished');assert.equal(winnerAction(false),'add');assert.equal(winnerAction(true,{owned:true,wished:true}),'viewer');
});
test('arsenal covers all catalog weapons once and includes future categories',async()=>{
 const catalog=JSON.parse(await fs.readFile('src/lib/catalog-snapshot.json','utf8'));const weapons=arsenalGroups([...catalog.skins,{weapon:'Future'}]).flatMap(g=>g.weapons);
 assert.equal(weapons.length,new Set(weapons).size);assert.ok(catalog.skins.every(s=>weapons.includes(s.weapon)));assert.ok(weapons.includes('Future'));
});
test.after(()=>fs.rm(temp,{recursive:true,force:true}));

const {edgeSpeed,startDragScroll}=await import(path.join(temp,'drag-scroll.mjs'));
test('drag edge scrolling has two directions and stops in the center',()=>{
 assert.ok(edgeSpeed(10,900)<0);assert.ok(edgeSpeed(890,900)>0);assert.equal(edgeSpeed(450,900),0);assert.equal(edgeSpeed(-1,900),0);assert.ok(Math.abs(edgeSpeed(5,900))>Math.abs(edgeSpeed(90,900)));
});
test('drag scroll continues without pointer movement and cleans up on drop',()=>{
 const listeners=new Map(),moves=[];let callback,scheduled=0,cancelled=0;
 const host={innerHeight:900,addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n),requestAnimationFrame:f=>{callback=f;return ++scheduled;},cancelAnimationFrame:()=>cancelled++,scrollBy:o=>moves.push(o.top)};
 startDragScroll(host);listeners.get('dragover')({clientY:10,preventDefault(){}});callback(16);callback(32);assert.equal(moves.length,2);assert.ok(moves.every(n=>n<0));
 listeners.get('dragover')({clientY:450,preventDefault(){}});callback(48);assert.equal(moves.length,2);
 listeners.get('drop')();assert.equal(listeners.size,0);assert.equal(cancelled,1);callback(64);assert.equal(moves.length,2);
});
