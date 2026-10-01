export const supabaseUrl=import.meta.env.VITE_SUPABASE_URL?.trim()??'';
export const supabaseKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()??'';
export const configured=Boolean(supabaseUrl&&supabaseKey);
export function guestUrl(){const url=new URL(window.location.href);url.search='?view=guest';url.hash='';return url.href;}
