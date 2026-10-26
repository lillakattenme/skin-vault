import type {Selection} from './types';
export function winnerAction(guest:boolean,selection?:Selection){return guest?'viewer':selection?.owned?'owned':selection?.wished?'wished':'add';}

export function randomIndex(n:number){
 if(!Number.isSafeInteger(n)||n<1||n>2**32)throw new Error('Invalid random range');
 const a=new Uint32Array(1),bound=2**32-(2**32%n);
 do{crypto.getRandomValues(a);}while(a[0]>=bound);
 return a[0]%n;
}
export function shuffleItems<T>(items:T[],random:(n:number)=>number=randomIndex){
 const result=[...items];for(let i=result.length-1;i>0;i--){const j=random(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;
}
export type DrawBag={pool:string[];remaining:string[];last:string|null};
export type DrawHistory=Record<string,DrawBag>;
export function validHistory(x:unknown):x is DrawHistory{
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length>24)return false;
 return Object.values(x).every(b=>b&&typeof b==='object'&&Array.isArray(b.pool)&&b.pool.length<=10000&&b.pool.every((id:unknown)=>typeof id==='string')&&new Set(b.pool).size===b.pool.length&&Array.isArray(b.remaining)&&b.remaining.every((id:unknown)=>typeof id==='string'&&b.pool.includes(id))&&new Set(b.remaining).size===b.remaining.length&&(b.last===null||typeof b.last==='string'&&b.pool.includes(b.last)));
}
// A saved bag identifies the pool by IDs, so catalog reordering cannot reset a cycle.
export function drawWithoutRepeats(ids:string[],previous?:DrawBag,random:(n:number)=>number=randomIndex){
 const pool=[...new Set(ids)].sort();if(!pool.length)throw new Error('Empty roulette pool');
 const same=previous?.pool.length===pool.length&&previous.pool.every((id,i)=>id===pool[i]);
 const last=previous?.last??null;
 let remaining=same?[...previous!.remaining]:[];
 if(!remaining.length){remaining=shuffleItems(pool,random);if(remaining.length>1&&remaining[0]===last){const j=1+random(remaining.length-1);[remaining[0],remaining[j]]=[remaining[j],remaining[0]];}}
 const winner=remaining.shift()!;
 return {winner,bag:{pool,remaining,last:winner} satisfies DrawBag};
}
export function rememberDraw(history:DrawHistory,key:string,bag:DrawBag):DrawHistory{
 return Object.fromEntries([...Object.entries(history).filter(([k])=>k!==key).slice(-23),[key,bag]]);
}
export function makeReel<T>(pool:T[],winner:T,length=36,winningIndex=32){
 if(!pool.length||winningIndex<0||winningIndex>=length)throw new Error('Invalid roulette reel');
 const strip:T[]=[];while(strip.length<length)strip.push(...shuffleItems(pool));
 strip.length=length;strip[winningIndex]=winner;return strip;
}
