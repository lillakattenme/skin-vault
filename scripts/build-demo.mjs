import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
execFileSync('npm',['run','build'],{stdio:'inherit',env:{...process.env,VITE_DEMO:'true',VITE_SUPABASE_URL:'',VITE_SUPABASE_PUBLISHABLE_KEY:''}});
let html=readFileSync('dist/index.html','utf8');
html=html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g,(_,src)=>'<script type="module">'+readFileSync(path.join('dist',src),'utf8').replaceAll('</script','<\\/script')+'</script>');
html=html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g,(_,href)=>'<style>'+readFileSync(path.join('dist',href),'utf8')+'</style>');
html=html.replace('./favicon.svg','data:image/svg+xml;base64,'+readFileSync('public/favicon.svg').toString('base64'));
const output=process.argv[2]||'dist/skin-vault-preview.html';mkdirSync(path.dirname(output),{recursive:true});writeFileSync(output,html);console.log('Demo created: '+output);
