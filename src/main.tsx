import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LoaderCircle,LogOut} from 'lucide-react';
import SkinVault from './SkinVault';
import {configured,guestUrl,supabaseUrl} from './lib/config';
import {initialRecovery,markRecovery,passwordProblem,pendingRecovery,recoveryRedirect,recoveryToken} from './lib/recovery';
import {supabase} from './lib/supabase';
import './style.css';
const guest=new URLSearchParams(location.search).get('view')==='guest'&&!initialRecovery.recovery;
type Flow='login'|'forgot'|'update'|'done';
function App(){
 const recovery=useRef(initialRecovery.recovery||pendingRecovery());
 const [state,setState]=useState<'loading'|'login'|'owner'|'denied'>('loading');
 const [flow,setFlow]=useState<Flow>(initialRecovery.error?'forgot':recovery.current?'update':'login');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const [error,setError]=useState(initialRecovery.error?'Ссылка устарела или уже использована. Запроси новое письмо.':'');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[cooldown,setCooldown]=useState(0),[link,setLink]=useState('');
 useEffect(()=>{
  if(!supabase||guest)return;
  let active=true,revision=0;
  const check=async()=>{
   const current=++revision;
   try{
    const {data:{session},error:sessionError}=await supabase!.auth.getSession();
    if(!active||current!==revision)return;
    if(sessionError||!session){
     setState('login');
     if(recovery.current){recovery.current=false;markRecovery(false);setFlow('forgot');setError('Ссылка восстановления недействительна. Запроси новое письмо.');}
     return;
    }
    const {data,error}=await supabase!.rpc('is_vault_owner');
    if(active&&current===revision){setState(!error&&data?'owner':'denied');if(error)setError('Не удалось проверить доступ. Попробуй войти ещё раз.');}
   }catch{if(active&&current===revision){setState('login');setError('Не удалось проверить подключение. Обнови страницу.');}}
  };
  const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
   if(event==='PASSWORD_RECOVERY'){recovery.current=true;markRecovery(true);setFlow('update');setError('');}
   if(event==='SIGNED_OUT'){recovery.current=false;markRecovery(false);}
   // Supabase calls must run outside this callback's authentication lock.
   setTimeout(()=>{if(active)void check();},0);
  });
  if(recovery.current)markRecovery(true);
  void check();
  return()=>{active=false;revision++;subscription.unsubscribe();};
 },[]);
 useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(n=>Math.max(0,n-1)),1000);return()=>clearTimeout(timer);},[cooldown]);
 function changeFlow(next:Flow){setFlow(next);setError('');setMessage('');setPassword('');setConfirmation('');setLink('');}
 async function login(e:React.FormEvent){
  e.preventDefault();if(!supabase||busy)return;setBusy(true);setError('');setMessage('');
  try{const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)setError('Не удалось войти. Проверь почту и пароль.');}
  catch{setError('Не удалось подключиться. Попробуй ещё раз.');}
  finally{setPassword('');setBusy(false);}
 }
 async function sendRecovery(e:React.FormEvent){
  e.preventDefault();if(!supabase||busy||cooldown)return;setBusy(true);setError('');setMessage('');
  try{
   const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:recoveryRedirect(location.href)});
   if(error){setError(error.status===429?'Слишком много попыток. Подожди несколько минут и попробуй снова.':'Не удалось отправить письмо. Проверь почту и попробуй ещё раз.');if(error.status===429)setCooldown(60);return;}
   setMessage('Если эта почта привязана к аккаунту, на неё отправлена ссылка. Проверь входящие и папку «Спам».');setCooldown(60);
  }catch{setError('Не удалось подключиться. Попробуй ещё раз.');}
  finally{setBusy(false);}
 }
 async function useRecoveryLink(e:React.FormEvent){
  e.preventDefault();if(!supabase||busy)return;setBusy(true);setError('');setMessage('');
  try{
   const token=recoveryToken(link,supabaseUrl);
   const {data,error}=await supabase.auth.verifyOtp({token_hash:token,type:'recovery'});
   if(error||!data.session){setError('Ссылка устарела или уже использована. Запроси новое письмо.');return;}
   recovery.current=true;markRecovery(true);setFlow('update');setState('loading');
   const owner=await supabase.rpc('is_vault_owner');setState(!owner.error&&owner.data?'owner':'denied');
  }catch(e){setError(e instanceof Error?e.message:'Не удалось проверить ссылку.');}
  finally{setLink('');setBusy(false);}
 }
 async function updatePassword(e:React.FormEvent){
  e.preventDefault();if(!supabase||busy||state!=='owner'||!recovery.current)return;
  const problem=passwordProblem(password,confirmation);if(problem){setError(problem);return;}
  setBusy(true);setError('');
  try{
   const {error}=await supabase.auth.updateUser({password});
   if(error){setError(error.code==='same_password'?'Выбери пароль, который отличается от старого.':error.code==='weak_password'?'Этот пароль слишком простой. Добавь буквы, цифры и символы.':'Не удалось сохранить пароль. Возможно, ссылка устарела: запроси новое письмо.');return;}
   recovery.current=false;markRecovery(false);setPassword('');setConfirmation('');setFlow('done');
  }catch{setError('Не удалось подключиться. Попробуй ещё раз.');}
  finally{setBusy(false);}
 }
 if(!configured)return <main className="access-denied"><h1>DreamSkin готовится к запуску</h1><p>Облачное сохранение ещё подключается. Коллекция пока доступна на действующем сайте.</p><a className="primary" href={'https://skin-vault.jujulia0088.chatgpt.site'+(guest?'/view':'/')}>Открыть действующий сайт</a></main>;
 if(guest)return <SkinVault guest/>;
 if(state==='loading')return <main className="access-denied"><LoaderCircle className="rotate"/><p>Проверяем доступ…</p></main>;
 if(state==='denied')return <main className="access-denied"><h1>Доступ владельца</h1><p>{error||'Этот аккаунт не может изменять коллекцию.'}</p><a className="primary" href={guestUrl()}>Посмотреть коллекцию</a><button className="secondary" onClick={()=>supabase!.auth.signOut()}>Войти в другой аккаунт</button></main>;
 if(flow==='done')return <main className="access-denied"><section className="login-panel"><p className="eyebrow">DreamSkin</p><h1>Пароль изменён</h1><p>Новый пароль сохранён. Используй его при следующих входах.</p><button className="primary" onClick={()=>changeFlow('login')}>Открыть мою коллекцию</button></section></main>;
 if(flow==='update'&&state==='owner')return <main className="access-denied"><form className="login-panel" onSubmit={updatePassword}><p className="eyebrow">DreamSkin</p><h1>Новый пароль</h1><p className="muted">Придумай пароль не короче 8 символов.</p><label>Новый пароль<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Повтори пароль<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>{error&&<p role="alert" className="dialog-error">{error}</p>}<button className="primary" disabled={busy}>{busy?'Сохраняем…':'Сохранить новый пароль'}</button></form></main>;
 if(flow==='forgot')return <main className="access-denied"><section className="login-panel"><p className="eyebrow">DreamSkin</p><h1>Восстановить пароль</h1><p className="muted">Введи почту, с которой входила как владелец.</p><form onSubmit={sendRecovery}><label>Почта<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><button className="primary" disabled={busy||cooldown>0}>{busy?'Отправляем…':cooldown?`Повторить через ${cooldown} сек.`:'Отправить ссылку на почту'}</button></form>{message&&<p role="status" className="auth-success">{message}</p>}{error&&<p role="alert" className="dialog-error">{error}</p>}<details className="recovery-fallback"><summary>Ссылка из письма не открывает сайт?</summary><p className="muted">Скопируй ссылку с кнопки в письме и вставь её сюда. Мы проверим её и откроем смену пароля прямо здесь.</p><form onSubmit={useRecoveryLink}><label>Ссылка из письма<input type="url" autoComplete="off" spellCheck={false} required value={link} onChange={e=>setLink(e.target.value)}/></label><button className="secondary" disabled={busy}>Продолжить восстановление</button></form></details><button type="button" className="text-button" disabled={busy} onClick={()=>changeFlow('login')}>← Вернуться ко входу</button></section></main>;
 if(state==='owner')return <><div className="account-bar"><span>Личный режим</span><button onClick={()=>supabase!.auth.signOut()}><LogOut size={15}/> Выйти</button></div><SkinVault/></>;
 return <main className="access-denied"><form className="login-panel" onSubmit={login}><p className="eyebrow">DreamSkin</p><h1>Вход владельца</h1><label>Почта<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Пароль<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="dialog-error">{error}</p>}<button className="primary" disabled={busy}>{busy?'Входим…':'Войти'}</button><button type="button" className="text-button" disabled={busy} onClick={()=>changeFlow('forgot')}>Забыли пароль?</button><a href={guestUrl()}>Открыть гостевой режим</a></form></main>;
}
function Demo(){const [viewer,setViewer]=useState(guest);return <><div className="demo-banner"><span><strong>ТЕСТОВАЯ ВЕРСИЯ</strong> · Демонстрационные данные. Основная коллекция не меняется.</span><button className="secondary" onClick={()=>setViewer(v=>!v)}>{viewer?'Перейти к владельцу':'Посмотреть глазами зрителя'}</button></div><SkinVault key={String(viewer)} guest={viewer}/></>;}
createRoot(document.getElementById('root')!).render(<React.StrictMode>{import.meta.env.VITE_DEMO==='true'?<Demo/>:<App/>}</React.StrictMode>);
