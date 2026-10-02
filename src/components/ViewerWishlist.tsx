import {useMemo,useState} from 'react';
import type {Skin} from '../lib/types';
import {useLocalState,validIds} from '../lib/local-state';
import {filterSkins} from '../lib/filters';
import {tiers,priceLabel} from '../lib/metadata';
import {exportWishlist} from '../lib/wishlist-export';
import Art from './Art';
export default function ViewerWishlist({skins}:{skins:Skin[]}){
 const [ids,setIds,storageError]=useLocalState<string[]>('skin-vault-viewer-wishlist-v1',[],validIds);
 const [title,setTitle,titleError]=useLocalState<string>('skin-vault-viewer-wishlist-title-v1','Мой вишлист',(x):x is string=>typeof x==='string'&&x.length<=60);
 const [mode,setMode]=useState<'saved'|'catalog'>('saved'),[query,setQuery]=useState(''),[weapon,setWeapon]=useState('Все'),[rarity,setRarity]=useState('all'),[hideBP,setHideBP]=useState(true),[limit,setLimit]=useState(36),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const saved=useMemo(()=>{const map=new Map(skins.map(s=>[s.id,s]));return [...new Set(ids)].flatMap(id=>map.has(id)?[map.get(id)!]:[]);},[skins,ids]);
 const missing=ids.filter(id=>!skins.some(s=>s.id===id)).length;
 const shown=mode==='saved'?saved:filterSkins(skins,{}, {tab:'catalog',weapon,query,rarity,hideBattlepass:hideBP,sort:'name'});
 function toggle(id:string){setIds(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);}
 async function download(){setBusy(true);setNotice('Готовим картинку…');try{const missing=await exportWishlist(saved,title);setNotice(missing?`PNG скачан. Для ${missing} скинов сохранены названия без изображений.`:'Вишлист скачан в PNG');}catch(e){setNotice(e instanceof Error?e.message:'Не удалось скачать картинку');}finally{setBusy(false);}}
 return <section className="viewer-wishlist"><div className="tool-intro"><div><h2>Твои будущие любимчики</h2><p className="local-note">Список сохраняется только в этом браузере. На других устройствах он не появится. Вишлист стримера не меняется.</p></div><button className="primary" disabled={busy||!saved.length} onClick={download}>{busy?'Готовим PNG…':'↓ Скачать вишлист PNG'}</button></div>
 <label className="wishlist-title">Заголовок картинки<input maxLength={60} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Мой вишлист"/></label>
 {(storageError||titleError)&&<p role="alert" className="error-banner">Браузер запрещает сохранение. Скачай картинку перед закрытием страницы.</p>}
 <div className="weapon-tabs"><button className={mode==='saved'?'active':''} onClick={()=>{setMode('saved');setLimit(36);}}>Мой список · {saved.length}</button><button className={mode==='catalog'?'active':''} onClick={()=>{setMode('catalog');setLimit(36);}}>＋ Добавить из каталога</button></div>
 {mode==='catalog'&&<div className="tool-toolbar"><input className="tool-search" aria-label="Поиск скина для своего вишлиста" placeholder="Найти скин" value={query} onChange={e=>{setQuery(e.target.value);setLimit(36);}}/><label>Оружие<select value={weapon} onChange={e=>{setWeapon(e.target.value);setLimit(36);}}><option>Все</option>{[...new Set(skins.map(s=>s.weapon))].sort().map(w=><option key={w}>{w}</option>)}</select></label><label>Редкость<select value={rarity} onChange={e=>{setRarity(e.target.value);setLimit(36);}}><option value="all">Все редкости</option>{tiers.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}<option value="none">Без класса</option></select></label><label><input type="checkbox" checked={hideBP} onChange={e=>{setHideBP(e.target.checked);setLimit(36);}}/> Скрыть БП</label></div>}
 {mode==='saved'&&missing>0&&<p className="local-note">Скинов временно нет в каталоге: {missing}. Их отметки сохранены, в PNG они не включены.</p>}
 {notice&&<p className="tool-notice" role="status">{notice}</p>}
 <div className="skin-grid">{shown.slice(0,limit).map(s=><article className="skin-card" key={s.id}><div className="card-art"><Art skin={s}/></div><div className="card-info"><span className="weapon-label">{s.weapon}</span><h3>{s.name}</h3><p className="skin-price">{priceLabel(s)}</p><button className={'own-button '+(ids.includes(s.id)?'owned':'')} aria-pressed={ids.includes(s.id)} onClick={()=>toggle(s.id)}>{ids.includes(s.id)?'♥ Убрать из моего списка':'♡ В мой вишлист'}</button></div></article>)}</div>
 {!shown.length&&<div className="empty"><h3>{mode==='saved'?'Здесь будут скины, которые хочется':'Скины не найдены'}</h3>{mode==='saved'?<button className="secondary" onClick={()=>{setMode('catalog');setLimit(36);}}>Выбрать скины</button>:<p>Попробуй изменить фильтры.</p>}</div>}
 {limit<shown.length&&<button className="secondary more" onClick={()=>setLimit(n=>n+36)}>Показать ещё</button>}
 {saved.length>0&&<p className="local-note">В картинку попадёт весь твой список: {saved.length} скинов. Фильтры каталога на неё не влияют.</p>}
 </section>;
}
