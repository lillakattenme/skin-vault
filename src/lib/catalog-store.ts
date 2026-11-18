import type {Catalog} from './types';
export function createCatalogStore(initial:Catalog,load:()=>Promise<Catalog>,clock=Date.now,checkedAt=0){
 let value=initial,nextCheck=checkedAt?checkedAt+6*3600000:0,pending:Promise<Catalog>|null=null;
 const listeners=new Set<(catalog:Catalog)=>void>();
 const refresh=(force=false):Promise<Catalog>=>{
  if(pending)return pending;
  if(!force&&clock()<nextCheck)return Promise.resolve(value);
  pending=Promise.resolve().then(load).catch(()=>({...value,stale:true,notice:'Источник сейчас недоступен. Показываем сохранённый каталог.'})).then(next=>{
   value=next;nextCheck=clock()+(next.stale?60000:6*3600000);
   for(const listener of listeners)listener(value);
   return value;
  }).finally(()=>{pending=null;});
  return pending;
 };
 return {peek:()=>value,read:()=>{void refresh();return value;},refresh,subscribe:(listener:(catalog:Catalog)=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};}};
}
