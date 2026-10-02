export type TierRow={id:string;label:string;color:string;skins:string[]};
export const colors=['#f19aa8','#efb58b','#ead58b','#a6d8b0','#9ab9ea'];
export function newRows():TierRow[]{return ['S','A','B','C','D'].map((label,i)=>({id:crypto.randomUUID(),label,color:colors[i],skins:[]}));}
export function moveSkin(rows:TierRow[],skinId:string,target:string|null,before?:string){if(before===skinId)return rows;const cleaned=rows.map(r=>({...r,skins:r.skins.filter(id=>id!==skinId)}));return cleaned.map(r=>{if(r.id!==target)return r;const skins=[...r.skins];const at=before?skins.indexOf(before):-1;skins.splice(at<0?skins.length:at,0,skinId);return {...r,skins};});}
export type TierBoards=Record<string,TierRow[]>;
export function validBoards(x:unknown):x is TierBoards{return !!x&&typeof x==='object'&&!Array.isArray(x)&&Object.values(x).every(rows=>Array.isArray(rows)&&rows.length>0&&rows.length<=30&&rows.every(r=>r&&typeof r.id==='string'&&typeof r.label==='string'&&typeof r.color==='string'&&/^#[\da-f]{6}$/i.test(r.color)&&Array.isArray(r.skins)&&r.skins.every((s:unknown)=>typeof s==='string')));}
