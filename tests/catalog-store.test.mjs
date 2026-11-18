import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'dreamskin-catalog-'));
for(const name of ['catalog-store','roulette-model'])await fs.writeFile(path.join(temp,name+'.mjs'),ts.transpileModule(await fs.readFile('src/lib/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {createCatalogStore}=await import(path.join(temp,'catalog-store.mjs'));
const {sampleItems}=await import(path.join(temp,'roulette-model.mjs'));
const initial={skins:[{id:'saved'}],updatedAt:'2026-01-01'},fresh={skins:[{id:'fresh'}],updatedAt:'2026-01-02'};
test('a stalled external catalog never blocks cached reads; one shared refresh updates subscribers',async()=>{
 let resolve,requests=0,events=0;
 const store=createCatalogStore(initial,()=>{requests++;return new Promise(r=>resolve=r);});
 assert.equal(store.read(),initial);assert.equal(store.read(),initial);
 const stop=store.subscribe(()=>events++);const waiting=store.refresh(true);await Promise.resolve();assert.equal(requests,1);
 resolve(fresh);assert.equal(await waiting,fresh);assert.equal(store.peek(),fresh);assert.equal(events,1);stop();const again=store.refresh(true);await Promise.resolve();resolve(fresh);await again;assert.equal(events,1);
});
test('failed refresh retains skins and backs off rather than retrying on every screen render',async()=>{
 let now=100000,requests=0;
 const store=createCatalogStore(initial,async()=>{requests++;throw Error('offline');},()=>now);
 const failure=await store.refresh();assert.equal(failure.stale,true);assert.equal(failure.skins,initial.skins);
 for(let i=0;i<10;i++)store.read();await Promise.resolve();assert.equal(requests,1);
 now+=60001;await store.refresh();assert.equal(requests,2);
});
test('fresh persisted catalogs avoid a startup network request and explicit refresh still works',async()=>{
 let requests=0;const store=createCatalogStore(initial,async()=>{requests++;return fresh;},()=>2000,1000);
 store.read();await Promise.resolve();assert.equal(requests,0);assert.equal(await store.refresh(true),fresh);assert.equal(requests,1);
});
test('five preview tiles need five random choices even with 2000 skins',()=>{
 let calls=0;const pool=Array.from({length:2000},(_,i)=>i);const sample=sampleItems(pool,5,n=>{calls++;return n-1;});assert.equal(calls,5);assert.equal(new Set(sample).size,5);assert.equal(pool.length,2000);assert.deepEqual(sampleItems([],5),[]);
});
// The public collection route must not depend on the external catalog at all.
let publicFilter='';
const query={select(){return this;},or(value){publicFilter=value;return this;},abortSignal(){return this;},then(resolve){return Promise.resolve({data:[{skin_id:'owned',owned:true,wished:false,price_override:null}],error:null}).then(resolve);}};
globalThis.__catalogTestDatabase=()=>({from:()=>query});
let api=await fs.readFile('src/lib/api.ts','utf8');
api=api.replace("import snapshot from './catalog-snapshot.json';",'const snapshot={skins:[]};').replace("import { database } from './supabase';",'const database=globalThis.__catalogTestDatabase;').replace("import { getCatalog } from './catalog';",'function getCatalog(){throw Error("Public collection must not request the catalog");}').replaceAll("import.meta.env.VITE_DEMO==='true'",'false');
await fs.writeFile(path.join(temp,'api.mjs'),ts.transpileModule(api,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {apiRequest}=await import(path.join(temp,'api.mjs'));
test('viewer collection loads independently while catalog sources are unavailable',async()=>{
 const response=await apiRequest('/api/public');assert.equal(response.status,200);const data=await response.json();assert.equal(data.selections[0].skinId,'owned');assert.equal(publicFilter,'owned.eq.true,wished.eq.true');
});
test.after(async()=>{delete globalThis.__catalogTestDatabase;await fs.rm(temp,{recursive:true,force:true});});
