// Real local API/database verification with an ephemeral, unfunded signing account.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile,mkdir } from 'node:fs/promises';
import { generatePrivateKey,privateKeyToAccount } from 'viem/accounts';
const origin='http://127.0.0.1:5173';
const account=privateKeyToAccount(generatePrivateKey());let cookie='';const address=account.address.toLowerCase();
async function api(path,data,authenticated=true){
 const response=await fetch(origin+'/api/'+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:origin}:{}),...(authenticated&&cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});
 const value=await response.json();return {response,value};
}
const report={checkedAt:new Date().toISOString(),scope:'Real loopback API and local D1; ephemeral sign-in signature; no blockchain transaction',fixtureAddress:address,checks:[],liveDecisionVerified:false};
try{
 const challenge=await api('auth/nonce',{address});assert.equal(challenge.response.status,200);
 const signature=await account.signMessage({message:challenge.value.message});
 const login=await api('auth/verify',{id:challenge.value.id,signature});assert.equal(login.response.status,200);
 cookie=login.response.headers.get('set-cookie').split(';')[0];assert.equal(login.value.user.address,address);report.checks.push('Nonce sign-in and verified EOA signature');
 const reused=await api('auth/verify',{id:challenge.value.id,signature});assert.equal(reused.response.status,401);report.checks.push('Used challenge cannot be replayed');
 const profile=await api('profile',{username:'fixture_'+address.slice(2,14)});assert.equal(profile.response.status,200);
 const created=await api('checks',{claim:'The Moon produces its own visible light.',source:'https://science.nasa.gov/moon/',visibility:'private',topic:'Science'});assert.equal(created.response.status,201);
 const detail=await api('checks/'+created.value.id);assert.equal(detail.response.status,200);assert.equal(detail.value.check.state,'draft');
 assert.equal(createHash('sha256').update(detail.value.check.payload).digest('hex'),detail.value.check.input_hash);report.checks.push('Private draft stored with exact payload SHA-256');
 const anonymous=await api('checks/'+created.value.id,undefined,false);assert.equal(anonymous.response.status,404);
 const feed=await api('checks',undefined,false);assert.equal(feed.value.checks.some(check=>check.id===created.value.id),false);report.checks.push('Private draft denied to guests and excluded from the public feed');
 const fee=await api('checks/'+created.value.id+'/prepare',{});assert.equal(fee.response.status,503);assert.match(fee.value.error,/awaiting deployment/);report.checks.push('No configured contract cannot be submitted as a live check');
 await api('auth/logout',{});const signedOut=await api('auth/me');assert.equal(signedOut.value.user,null);report.checks.push('Logout invalidates the server session');
 report.ok=true;
}catch(error){report.ok=false;report.error=error instanceof Error?error.message:'Verification failed';process.exitCode=1;}
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});await writeFile(new URL('../reports/api-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
