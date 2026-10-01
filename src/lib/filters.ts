import type {Skin,Selection} from './types';
import {tiers} from './metadata';
export function effectivePrice(s:Skin,selection?:Selection){return ['battlepass','agent','event'].includes(s.origin)?null:selection?.priceOverride??s.price;}
export function filterSkins(all:Skin[],selections:Record<string,Selection>,o:{tab:string;weapon:string;query:string;rarity:string;hideBattlepass:boolean;sort:string}){
 const result=all.filter(s=>(o.tab!=='owned'||selections[s.id]?.owned)&&(o.tab!=='wished'||selections[s.id]?.wished)&&(o.weapon==='Все'||s.weapon===o.weapon)&&(!o.hideBattlepass||s.origin!=='battlepass')&&(o.rarity==='all'||(o.rarity==='none'?!s.tier:s.tier===o.rarity))&&s.name.toLowerCase().includes(o.query.trim().toLowerCase()));
 if(o.sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 if(o.sort==='rarity')result.sort((a,b)=>(tiers.find(t=>t.id===b.tier)?.rank??-1)-(tiers.find(t=>t.id===a.tier)?.rank??-1)||a.name.localeCompare(b.name,'ru'));
 if(o.sort==='price-low'||o.sort==='price-high')result.sort((a,b)=>{const pa=effectivePrice(a,selections[a.id]),pb=effectivePrice(b,selections[b.id]);if(pa===null)return pb===null?0:1;if(pb===null)return -1;return o.sort==='price-low'?pa-pb:pb-pa;});
 return result;
}
