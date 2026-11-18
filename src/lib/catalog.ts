import snapshot from './catalog-snapshot.json';
import {enrich,parseOrigins} from './metadata';
import {createCatalogStore} from './catalog-store';
import type {Catalog,Skin} from './types';
const storageKey='dreamskin-catalog-cache-v1';
function savedCatalog():{catalog:Catalog;checkedAt:number}|null{
 try{
  const raw=localStorage.getItem(storageKey);if(!raw||raw.length>2000000)return null;
  const x=JSON.parse(raw),skins=x.catalog?.skins;
  if(!Array.isArray(skins)||skins.length<100||skins.length>10000||!Number.isFinite(Date.parse(x.catalog.updatedAt))||!Number.isFinite(x.checkedAt))return null;
  if(!skins.every((s:Skin)=>s&&typeof s.id==='string'&&typeof s.name==='string'&&typeof s.weapon==='string'&&typeof s.image==='string'&&(s.tier===null||typeof s.tier==='string')&&(s.price===null||typeof s.price==='number')&&['battlepass','agent','event','store','unknown'].includes(s.origin)&&Array.isArray(s.levels)))return null;
  if(new Set(skins.map((s:Skin)=>s.id)).size!==skins.length)return null;
  return {catalog:x.catalog,checkedAt:Math.min(x.checkedAt,Date.now())};
 }catch{return null;}
}
const saved=savedCatalog();
const store=createCatalogStore(saved?.catalog??snapshot as Catalog,refreshCatalog,Date.now,saved?.checkedAt);
store.subscribe(catalog=>{
 if(catalog.stale)return;
 try{localStorage.setItem(storageKey,JSON.stringify({catalog,checkedAt:Date.now()}));}catch{/* Storage quotas must never prevent catalog use. */}
});
export const currentCatalog=store.peek;
export const subscribeCatalog=store.subscribe;
// Normal reads never wait for external services. Only an explicit refresh awaits them.
export function getCatalog(force=false):Promise<Catalog>{return force?store.refresh(true):Promise.resolve(store.read());}
async function source(url:string){const response=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Catalog source unavailable');return response.json();}
async function refreshCatalog():Promise<Catalog>{
 const results=await Promise.allSettled([source('https://valorant-api.com/v1/weapons?language=ru-RU'),source('https://valorant-api.com/v1/contracts')]);
 if(results[0].status!=='fulfilled')throw new Error('Catalog source unavailable');
 const raw=results[0].value as {status:number;data:any[]};if(raw.status!==200||!Array.isArray(raw.data))throw new Error('Invalid catalog');
 let origins;
 if(results[1].status==='fulfilled'&&Array.isArray(results[1].value?.data))origins=parseOrigins(results[1].value.data);
 const skins:Skin[]=[];
 for(const w of raw.data)for(const s of w.skins??[]){if(/\/(Standard|Random)\//.test(s.assetPath??''))continue;const image=s.displayIcon??s.levels?.find((l:any)=>l.displayIcon)?.displayIcon??s.chromas?.find((c:any)=>c.fullRender)?.fullRender;if(image&&s.uuid&&s.displayName)skins.push(enrich({id:s.uuid,name:s.displayName,weapon:w.displayName==='Холодное оружие'?'Ножи':w.displayName,image,tier:s.contentTierUuid??null,theme:s.themeUuid??null,levels:(s.levels??[]).map((l:any)=>l.uuid)},origins));}
 if(skins.length<100)throw new Error('Incomplete catalog');
 return {skins,updatedAt:new Date().toISOString(),schemaVersion:2};
}
