// Real API/Neon checks using an ephemeral unfunded EOA. No wallet payment.
import assert from 'node:assert/strict';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
const base=process.env.CLAIMLENS_URL;
assert.ok(/^https:\/\/claimlens-[a-z0-9-]+\.vercel\.app$/.test(base||'')||/^http:\/\/127\.0\.0\.1:\d+$/.test(base||''));
const account=privateKeyToAccount(generatePrivateKey());const address=account.address.toLowerCase();let cookie='';
const report={checkedAt:new Date().toISOString(),origin:base,fixtureAddress:address,scope:'Real API, EOA signature and Neon; ephemeral unfunded account; no chain transaction.',checks:[]};
async function api(path,data,guest=false){const res=await fetch(base+'/api/'+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:base}:{}),...(!guest&&cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(30000)});const set=res.headers.get('set-cookie');if(set?.startsWith('cl_session='))cookie=set.split(';')[0];return {status:res.status,value:await res.json()};}
const passed=label=>{report.checks.push(label);console.log('Verified: '+label);};
try{
 const nonce=await api('auth/nonce',{address});assert.equal(nonce.status,200);assert.ok(nonce.value.message.includes('URI: '+base));
 const signature=await account.signMessage({message:nonce.value.message});assert.equal((await api('auth/verify',{id:nonce.value.id,signature})).status,200);
 assert.equal((await api('auth/verify',{id:nonce.value.id,signature})).status,401);passed('Origin-bound sign-in and nonce replay protection');
 assert.equal((await api('profile',{username:'reg_'+address.slice(2,14)})).status,200);
 assert.equal((await api('checks',{claim:'is russia more powerful than usa',source:'',visibility:'private',topic:'General'})).status,400);passed('Ambiguous comparisons blocked before a paid check');
 const draft=await api('checks',{claim:'The Moon produces its own visible light.',source:'https://science.nasa.gov/moon/facts/',visibility:'private',topic:'Science'});assert.equal(draft.status,201);report.fixtureId=draft.value.id;
 const path='checks/'+report.fixtureId;const before=(await api(path)).value.check;
 assert.equal((await api(path,undefined,true)).status,404);assert.equal((await api(path+'/sources',{sourceUrls:['https://example.com/']},true)).status,401);
 assert.equal((await api(path+'/sources',{sourceUrls:['https://127.0.0.1/']})).status,400);
 assert.equal((await api(path+'/sources',{sourceUrls:Array(5).fill('https://example.com/')})).status,400);passed('Private checks and evidence edit authorization; unsafe and oversized source lists rejected');
 assert.equal((await api(path+'/sources',{sourceUrls:['https://science.nasa.gov/moon/facts/']})).status,200);
 const after=(await api(path)).value.check;
 assert.deepEqual(JSON.parse(after.payload).source_urls,['https://science.nasa.gov/moon/facts/']);
 assert.equal(createHash('sha256').update(after.payload).digest('hex'),after.input_hash);assert.notEqual(after.input_hash,before.input_hash);passed('Evidence edits recompute exact immutable-request provenance');
 assert.equal((await api(path+'/attempt',{inputHash:before.input_hash})).status,409);assert.equal((await api(path)).value.check.state,'draft');passed('Stale fee quote cannot start a wallet attempt');
 assert.equal((await api(path+'/attempt',{inputHash:after.input_hash})).status,200);
 assert.equal((await api(path+'/sources',{sourceUrls:['https://example.com/']})).status,409);
 assert.equal((await api(path+'/attempt',{inputHash:after.input_hash})).status,409);passed('Wallet attempt fixes evidence and prevents duplicate attempts');
 assert.equal((await api(path+'/rejected',{})).status,200);
 assert.equal((await api(path+'/appeal',{})).status,409);passed('Drafts cannot be appealed and explicit wallet rejection unlocks a draft');
 report.ok=true;
}catch(error){report.ok=false;report.error=error.message;process.exitCode=1;}
finally{
 await api('auth/logout',{}).catch(()=>{});
 // Delete only this script's known, unsigned fixture; never historical test records.
 if(report.fixtureId&&process.env.DATABASE_URL){try{const {neon}=await import('@neondatabase/serverless');const sql=neon(process.env.DATABASE_URL);await sql.query('DELETE FROM checks WHERE id = $1 AND owner = $2 AND evm_hash IS NULL',[report.fixtureId,address]);report.fixtureDraftRemoved=true;}catch{report.fixtureDraftRemoved=false;}}
 report.completedAt=new Date().toISOString();await writeFile('reports/api-adjudication-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:report.ok,error:report.error,checks:report.checks.length,fixtureDraftRemoved:report.fixtureDraftRemoved}));
}
