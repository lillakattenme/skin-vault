import snapshot from './catalog-snapshot.json';
import { enrich,parseOrigins } from './metadata';
import type { Catalog,Skin } from './types';
let cache:Catalog=snapshot as Catalog;
let pending:Promise<Catalog>|null=null;
let checkedAt=0;
export function getCatalog(force=false):Promise<Catalog>{if(pending)return pending;if(!force&&Date.now()-checkedAt<6*3600000)return Promise.resolve(cache);pending=refreshCatalog().finally(()=>{pending=null;});return pending;}
async function refreshCatalog():Promise<Catalog>{try{
 const results=await Promise.allSettled([fetch('https://valorant-api.com/v1/weapons?language=ru-RU',{signal:AbortSignal.timeout(15000)}),fetch('https://valorant-api.com/v1/contracts',{signal:AbortSignal.timeout(15000)})]);
 if(results[0].status!=='fulfilled'||!results[0].value.ok)throw new Error('Catalog source unavailable');
 const raw=await results[0].value.json() as {status:number;data:any[]};if(raw.status!==200||!Array.isArray(raw.data))throw new Error('Invalid catalog');
 let origins;
 if(results[1].status==='fulfilled'&&results[1].value.ok){const c=await results[1].value.json() as {data:any[]};if(Array.isArray(c.data))origins=parseOrigins(c.data);}
 const skins:Skin[]=[];
 for(const w of raw.data)for(const s of w.skins??[]){if(/\/(Standard|Random)\//.test(s.assetPath??''))continue;const image=s.displayIcon??s.levels?.find((l:any)=>l.displayIcon)?.displayIcon??s.chromas?.find((c:any)=>c.fullRender)?.fullRender;if(image&&s.uuid&&s.displayName)skins.push(enrich({id:s.uuid,name:s.displayName,weapon:w.displayName==='Холодное оружие'?'Ножи':w.displayName,image,tier:s.contentTierUuid??null,theme:s.themeUuid??null,levels:(s.levels??[]).map((l:any)=>l.uuid)},origins));}
 if(skins.length<100)throw new Error('Incomplete catalog');
 cache={skins,updatedAt:new Date().toISOString(),schemaVersion:2};checkedAt=Date.now();return cache;
 }catch{return {...cache,stale:true,notice:'Источник сейчас недоступен. Показываем сохранённый каталог.'};}}
