import data from './item-metadata.json';
import type { Skin, Origin } from './types';
export const tiers=[{id:'12683d76-48d7-84a3-4e09-6985794f0445',name:'Select',label:'Select · Селект',color:'#6db9ff',price:875,rank:0},{id:'0cebb8be-46d7-c12a-d306-e9907bfc5a25',name:'Deluxe',label:'Deluxe · Делюкс',color:'#62d5bb',price:1275,rank:1},{id:'60bca009-4182-7998-dee7-b8a2558dc369',name:'Premium',label:'Premium · Премиум',color:'#ec86c6',price:1775,rank:2},{id:'e046854e-406c-37f4-6607-19a9ba8426fc',name:'Exclusive',label:'Exclusive · Эксклюзив',color:'#f5af68',price:null,rank:3},{id:'411e4a55-4e59-7757-41f0-86a53f101bb5',name:'Ultra',label:'Ultra · Ультра',color:'#e8d286',price:null,rank:4}];
export function enrich(s:Omit<Skin,'price'|'priceKind'|'origin'>, liveOrigins?:Record<string,Origin>):Skin{
 const origins={...(data.origins as Record<string,Origin>),...liveOrigins};
 const origin=s.levels.map(id=>origins[id]).find(Boolean)??(s.tier?'store':'unknown');
 const offer=(data.prices as Record<string,number>)[s.levels[0]];
 const tier=tiers.find(t=>t.id===s.tier);
 const nonStore=['battlepass','agent','event'].includes(origin);
 const price=nonStore?null:offer??(s.weapon!=='Ножи'?tier?.price:null)??null;
 return {...s,origin,price,priceKind:price===null?'unknown':offer?'offer':'tier'};
}
export function parseOrigins(contracts:any[]):Record<string,Origin>{
 const result:Record<string,Origin>={};
 for(const c of contracts){const co=c.content;if(!co)continue;const t=co.relationType;const kind:Origin|undefined=t==='Season'&&co.premiumVPCost>0?'battlepass':t==='Agent'?'agent':t==='Event'?'event':undefined;if(!kind)continue;
 for(const ch of co.chapters??[]){for(const r of [...(ch.levels??[]).map((l:any)=>l.reward),...(ch.freeRewards??[])])if(r?.type==='EquippableSkinLevel')result[r.uuid]=kind;}}
 return result;
}
export function priceLabel(s:Skin,override?:number|null){if(s.origin==='battlepass')return 'Из БП';if(s.origin==='agent')return 'Контракт агента';if(s.origin==='event')return 'Награда события';const p=override??s.price;return p===null?'Цена не указана':p.toLocaleString('ru-RU')+' VP';}
