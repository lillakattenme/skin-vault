import type {Skin} from './types';
import {loadImage,fitText} from './tier-export';
import {priceLabel} from './metadata';
export async function exportWishlist(skins:Skin[],title:string){
 if(!skins.length)throw Error('Сначала добавь скины в свой вишлист');
 const width=1200,columns=4,cardW=276,cardH=190,gap=16,pad=24,height=160+Math.ceil(skins.length/columns)*(cardH+gap)+48;
 if(height>24000)throw Error('Вишлист слишком большой для одной картинки. Уменьши список перед скачиванием.');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Экспорт картинки недоступен в этом браузере');
 ctx.fillStyle='#100e18';ctx.fillRect(0,0,width,height);ctx.fillStyle='#eee3ff';ctx.font='bold 34px sans-serif';ctx.fillText(fitText(ctx,title.trim()||'Мой вишлист',width-48),pad,60);ctx.font='16px sans-serif';ctx.fillStyle='#c99aff';ctx.fillText(`SKIN VAULT · ${skins.length} скинов · Каждый скин под свой вайбик`,pad,98);
 let missing=0;
 for(let start=0;start<skins.length;start+=12){await Promise.all(skins.slice(start,start+12).map(async(s,j)=>{
 const i=start+j,x=pad+i%columns*(cardW+gap),y=140+Math.floor(i/columns)*(cardH+gap);const img=await loadImage(s.image);
 ctx.fillStyle='#251b32';ctx.fillRect(x,y,cardW,cardH);if(img){const scale=Math.min((cardW-24)/img.width,105/img.height);ctx.drawImage(img,x+(cardW-img.width*scale)/2,y+12+(105-img.height*scale)/2,img.width*scale,img.height*scale);}else missing++;
 ctx.fillStyle='#f2eaff';ctx.font='bold 15px sans-serif';ctx.fillText(fitText(ctx,s.name,cardW-24),x+12,y+140);ctx.font='13px sans-serif';ctx.fillStyle='#c7a8e6';ctx.fillText(priceLabel(s),x+12,y+170);
 }));}
 ctx.fillStyle='#a397b1';ctx.font='13px sans-serif';ctx.fillText(missing?`Изображения не загрузились: ${missing}. Названия сохранены. Цены справочные.`:'Цены справочные, без скидок, улучшений и комплектов.',pad,height-22);
 const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Не удалось создать PNG');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='skin-vault-wishlist.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);return missing;
}
