export function recoveryIntent(href:string){
 const url=new URL(href),hash=new URLSearchParams(url.hash.slice(1));
 return {recovery:hash.get('type')==='recovery',error:hash.has('error')||hash.has('error_code')||url.searchParams.has('error')};
}
// Capture before the Supabase client consumes the callback fragment.
export const initialRecovery=typeof window==='undefined'?{recovery:false,error:false}:recoveryIntent(window.location.href);
export function recoveryRedirect(href:string){const url=new URL(href);url.search='';url.hash='';return url.href;}
export function recoveryToken(link:string,projectUrl:string){
 let url:URL;
 try{url=new URL(link.trim());}catch{throw new Error('Вставь полную ссылку восстановления из письма.');}
 const project=new URL(projectUrl);
 if(url.origin!==project.origin||url.protocol!=='https:'||url.username||url.password||url.pathname!=='/auth/v1/verify'||url.searchParams.get('type')!=='recovery')throw new Error('Нужна ссылка восстановления DreamSkin из письма.');
 const token=url.searchParams.get('token')??url.searchParams.get('token_hash');
 if(!token||token.length<16||token.length>2048||!/^[\w.~-]+$/.test(token))throw new Error('В ссылке не найден код восстановления. Скопируй её целиком.');
 return token;
}
export function passwordProblem(password:string,confirmation:string){
 if(password.length<8)return 'Придумай пароль не короче 8 символов.';
 if(password!==confirmation)return 'Пароли не совпадают.';
 return '';
}
const marker='dreamskin-password-recovery';
export function pendingRecovery(){try{return sessionStorage.getItem(marker)==='1';}catch{return false;}}
export function markRecovery(pending:boolean){try{if(pending)sessionStorage.setItem(marker,'1');else sessionStorage.removeItem(marker);}catch{/* The recovery screen still works without storage. */}}
