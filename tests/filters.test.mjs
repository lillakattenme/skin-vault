import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'skin-vault-'));
const options={compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}};
const metadata=(await fs.readFile('src/lib/metadata.ts','utf8')).replace("import data from './item-metadata.json';",'const data='+await fs.readFile('src/lib/item-metadata.json','utf8')+';');
await fs.writeFile(path.join(temp,'metadata.mjs'),ts.transpileModule(metadata,options).outputText);
const filters=(await fs.readFile('src/lib/filters.ts','utf8')).replace("'./metadata'","'./metadata.mjs'");
await fs.writeFile(path.join(temp,'filters.mjs'),ts.transpileModule(filters,options).outputText);
const {filterSkins,effectivePrice}=await import(path.join(temp,'filters.mjs'));
const catalog=JSON.parse(await fs.readFile('src/lib/catalog-snapshot.json','utf8'));
const defaults={tab:'catalog',weapon:'Все',query:'',rarity:'all',hideBattlepass:false,sort:'featured'};
const base={id:'a',name:'Alpha',weapon:'Vandal',image:'',tier:null,theme:null,price:1775,priceKind:'tier',origin:'store',levels:[]};
test('BP filter uses source, and does not hide an unrelated skin of the same rarity',()=>{
 const result=filterSkins([{...base,origin:'battlepass'},{...base,id:'b'}],{},{...defaults,hideBattlepass:true});assert.deepEqual(result.map(x=>x.id),['b']);
});
test('wishlist and collection are independent and combine with weapon and rarity',()=>{
 const skins=[base,{...base,id:'b',weapon:'Phantom',tier:'premium'}];const saved={a:{owned:true,wished:false},b:{owned:false,wished:true}};
 assert.deepEqual(filterSkins(skins,saved,{...defaults,tab:'owned'}).map(x=>x.id),['a']);
 assert.deepEqual(filterSkins(skins,saved,{...defaults,tab:'wished',weapon:'Phantom',rarity:'premium'}).map(x=>x.id),['b']);
});
test('price sorting uses owner corrections and places unknown values last both ways',()=>{
 const skins=[base,{...base,id:'b',price:900},{...base,id:'c',price:null}];const saved={a:{priceOverride:500}};
 assert.deepEqual(filterSkins(skins,saved,{...defaults,sort:'price-low'}).map(x=>x.id),['a','b','c']);
 assert.deepEqual(filterSkins(skins,saved,{...defaults,sort:'price-high'}).map(x=>x.id),['b','a','c']);
});
test('BP rewards never acquire an individual VP price',()=>assert.equal(effectivePrice({...base,origin:'battlepass'},{priceOverride:1775}),null));
test('bundled catalog has unique IDs and BP items remain recoverable with toggle off',()=>{
 assert.equal(new Set(catalog.skins.map(s=>s.id)).size,catalog.skins.length);
 const hidden=filterSkins(catalog.skins,{},{...defaults,hideBattlepass:true});assert.ok(hidden.length<catalog.skins.length);assert.ok(hidden.every(s=>s.origin!=='battlepass'));assert.equal(filterSkins(catalog.skins,{},defaults).length,catalog.skins.length);
});
test.after(async()=>{await fs.rm(temp,{recursive:true,force:true});});
