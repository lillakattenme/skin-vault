import snapshot from './catalog-snapshot.json';
const demoRows:Selection[]=snapshot.skins.filter(s=>s.origin==='store'&&['Vandal','Phantom','Ножи','Sheriff','Ghost','Operator'].includes(s.weapon)).filter((_,i)=>i%9===0).slice(0,28).map((s,i)=>({skinId:s.id,owned:i%3!==0,wished:i%3===0}));
import { database } from './supabase';
import { getCatalog } from './catalog';
import type {Selection} from './types';
async function selections(guest:boolean){let query=database().from('skin_selections').select('skin_id,owned,wished,price_override');if(guest)query=query.or('owned.eq.true,wished.eq.true');const {data,error}=await query;if(error)throw error;return (data??[]).map(r=>({skinId:r.skin_id,owned:r.owned,wished:r.wished,priceOverride:r.price_override})) as Selection[];}
export async function apiRequest(path:string,init?:RequestInit):Promise<Response>{try{
 let payload:unknown;
 if(import.meta.env.VITE_DEMO==='true'){
  if(init?.method==='PUT'){const x=JSON.parse(String(init.body));const row:Selection=demoRows.find(r=>r.skinId===x.skinId)??{skinId:x.skinId,owned:false,wished:false};if(!demoRows.includes(row))demoRows.push(row);if(path==='/api/prices')row.priceOverride=x.price;else Object.assign(row,{owned:x.owned,wished:x.wished});return Response.json({ok:true});}
  return Response.json(path.startsWith('/api/catalog')?snapshot:{selections:demoRows,catalog:snapshot});
 }

 if(path.startsWith('/api/catalog'))payload=await getCatalog(path.includes('refresh=1'));
 else if(path==='/api/public'){const [rows,catalog]=await Promise.all([selections(true),getCatalog()]);payload={selections:rows,catalog};}
 else if(path==='/api/collection'&&(!init?.method||init.method==='GET'))payload={selections:await selections(false)};
 else if(path==='/api/collection'&&init?.method==='PUT'){const x=JSON.parse(String(init.body));const {error}=await database().rpc('set_skin_selection',{p_skin_id:x.skinId,p_owned:x.owned,p_wished:x.wished});if(error)throw error;payload={ok:true};}
 else if(path==='/api/prices'&&init?.method==='PUT'){const x=JSON.parse(String(init.body));const {error}=await database().rpc('set_skin_price',{p_skin_id:x.skinId,p_price:x.price});if(error)throw error;payload={ok:true};}
 else throw new Error('Неизвестная операция');
 return Response.json(payload);
 }catch(e){console.error('Skin Vault request failed',e);return Response.json({error:'Не удалось загрузить или сохранить данные. Проверь подключение и повтори попытку.'},{status:503});}}
