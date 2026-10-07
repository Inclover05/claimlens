// Publish only successful records owned by the dedicated local test wallet.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {loadBradburyTestAccount} from './bradbury-wallet.mjs';
assert.equal(process.env.CLAIMLENS_PUBLISH_EXAMPLES,'1','Explicit publication of test examples is required.');
const base='https://claimlens-inclover05s-projects.vercel.app',contract=process.env.CLAIMLENS_CONTRACT;
assert.match(contract||'',/^0x[0-9a-f]{40}$/i);
const account=await loadBradburyTestAccount(),owner=account.address.toLowerCase();let cookie='';
const ledger=JSON.parse(await readFile(`.claimlens-wallet/live-checks-${contract.toLowerCase()}.json`,'utf8'));
async function api(path,data,guest=false){const r=await fetch(base+'/api/'+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json',Origin:base}:{}),...(!guest&&cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(30000)});const set=r.headers.get('set-cookie');if(set?.startsWith('cl_session='))cookie=set.split(';')[0];return {status:r.status,value:await r.json()};}
const report={checkedAt:new Date().toISOString(),origin:base,contract,scope:'Only provenance-checked successful, nonconfidential test-wallet examples are published. Accepted examples remain explicitly provisional.',examples:[],skipped:[]};
try{
 const nonce=await api('auth/nonce',{address:owner});assert.equal(nonce.status,200);assert.equal((await api('auth/verify',{id:nonce.value.id,signature:await account.signMessage({message:nonce.value.message})})).status,200);
 for(const name of ['supported','contradicted','opinion','football-international','x-independent']){
  const saved=ledger[name];if(!saved?.genHash){report.skipped.push({name,reason:'No saved test transaction'});continue;}
  const response=await api('checks/'+saved.id);assert.equal(response.status,200);const check=response.value.check;assert.equal(check.owner,owner);assert.equal(check.contract.toLowerCase(),contract.toLowerCase());assert.equal(check.input_hash,saved.inputHash);
  if(!['accepted','finalized'].includes(check.state)||!check.result){report.skipped.push({name,id:saved.id,state:check.state});continue;}
  const result=JSON.parse(check.result);assert.equal(result.owner,owner);assert.equal(result.input_hash,saved.inputHash);assert.equal(result.policy,'claimlens-evidence-v1');
  assert.equal((await api('checks/'+saved.id+'/visibility',{visibility:'public'})).status,200);
  const guest=await api('checks/'+saved.id,undefined,true);assert.equal(guest.status,200);assert.equal(guest.value.check.result,check.result);
  report.examples.push({name,id:saved.id,url:base+'/checks/'+saved.id,state:check.state,verdict:result.verdict,genHash:saved.genHash,guestVerified:true});
 }
 report.ok=true;
}finally{await api('auth/logout',{}).catch(()=>{});report.completedAt=new Date().toISOString();await writeFile('reports/public-release-examples.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
