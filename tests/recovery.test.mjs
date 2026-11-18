import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'dreamskin-recovery-'));
await fs.writeFile(path.join(temp,'recovery.mjs'),ts.transpileModule(await fs.readFile('src/lib/recovery.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {recoveryIntent,recoveryRedirect,recoveryToken,passwordProblem,markRecovery,pendingRecovery}=await import(path.join(temp,'recovery.mjs'));
const project='https://example-project.supabase.co',token='test-only-token-not-a-real-recovery-token';
const link=project+'/auth/v1/verify?token='+token+'&type=recovery&redirect_to=https%3A%2F%2Fexample.org';
test('recognizes recovery callbacks and expired links without confusing ordinary owner/guest visits',()=>{
 assert.equal(recoveryIntent('https://example.org/skin-vault/#access_token=test&type=recovery').recovery,true);
 assert.equal(recoveryIntent('https://example.org/skin-vault/?view=guest').recovery,false);
 assert.equal(recoveryIntent('https://example.org/#error=access_denied&error_code=otp_expired').error,true);
 assert.equal(recoveryIntent('https://example.org/?error=access_denied').error,true);
});
test('recovery redirects keep the GitHub Pages project path and strip guest/callback parameters',()=>assert.equal(recoveryRedirect('https://example.org/skin-vault/?view=guest#anything'),'https://example.org/skin-vault/'));
test('fallback consumes only recovery proof for the configured Supabase project',()=>{
 assert.equal(recoveryToken(' '+link+' ',project),token);
 assert.equal(recoveryToken(link.replace('token=','token_hash='),project),token);
 for(const bad of [link.replace('https:','http:'),link.replace('example-project.supabase.co','attacker.example'),link.replace('type=recovery','type=signup'),link.replace('/verify?','/unrelated?'),link.replace('token='+token,'token=short'),'https://attacker.example/?redirect='+encodeURIComponent(link)])assert.throws(()=>recoveryToken(bad,project));
});
test('new passwords must meet local length and confirmation checks; recovery marker has no secrets',()=>{
 assert.ok(passwordProblem('short','short'));assert.ok(passwordProblem('long-enough','different'));assert.equal(passwordProblem('long-enough','long-enough'),'');
 const memory=new Map();globalThis.sessionStorage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 markRecovery(true);assert.equal(pendingRecovery(),true);assert.deepEqual([...memory.values()],['1']);markRecovery(false);assert.equal(pendingRecovery(),false);delete globalThis.sessionStorage;
});
test.after(()=>fs.rm(temp,{recursive:true,force:true}));
