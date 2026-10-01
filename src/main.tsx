import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LoaderCircle,LogOut} from 'lucide-react';
import SkinVault from './SkinVault';
import {configured,guestUrl} from './lib/config';
import {supabase} from './lib/supabase';
import './style.css';
const guest=new URLSearchParams(location.search).get('view')==='guest';
function App(){const [state,setState]=useState<'loading'|'login'|'owner'|'denied'>('loading');const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!supabase||guest)return;let active=true;let revision=0;const check=async()=>{const current=++revision;const {data:{session}}=await supabase!.auth.getSession();if(!active||current!==revision)return;if(!session){setState('login');return;}const {data,error}=await supabase!.rpc('is_vault_owner');if(active&&current===revision){setState(!error&&data?'owner':'denied');if(error)setError('Не удалось проверить доступ. Попробуй войти ещё раз.');}};void check();const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{setTimeout(()=>{if(active)void check();},0);});return()=>{active=false;subscription.unsubscribe();};},[]);
 async function login(e:React.FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setError('');const {error}=await supabase.auth.signInWithPassword({email,password});setPassword('');if(error)setError('Не удалось войти. Проверь почту и пароль.');setBusy(false);}
 if(!configured)return <main className="access-denied"><h1>Skin Vault готовится к запуску</h1><p>Облачное сохранение ещё подключается. Коллекция пока доступна на действующем сайте.</p><a className="primary" href={'https://skin-vault.jujulia0088.chatgpt.site'+(guest?'/view':'/')}>Открыть действующий сайт</a></main>;
 if(guest)return <SkinVault guest/>;
 if(state==='loading')return <main className="access-denied"><LoaderCircle className="rotate"/><p>Проверяем доступ…</p></main>;
 if(state==='owner')return <><div className="account-bar"><span>Личный режим</span><button onClick={()=>supabase!.auth.signOut()}><LogOut size={15}/> Выйти</button></div><SkinVault/></>;
 if(state==='denied')return <main className="access-denied"><h1>Доступ владельца</h1><p>{error||'Этот аккаунт не может изменять коллекцию.'}</p><a className="primary" href={guestUrl()}>Посмотреть коллекцию</a><button className="secondary" onClick={()=>supabase!.auth.signOut()}>Войти в другой аккаунт</button></main>;
 return <main className="access-denied"><form className="login-panel" onSubmit={login}><p className="eyebrow">SKIN VAULT</p><h1>Вход владельца</h1><label>Почта<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Пароль<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="dialog-error">{error}</p>}<button className="primary" disabled={busy}>{busy?'Входим…':'Войти'}</button><a href={guestUrl()}>Открыть гостевой режим</a></form></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
