// One authorized Bradbury test-wallet appeal through the production browser.
// A saved signed hash prevents a second payment after any uncertain response.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createClient} from 'genlayer-js';
import {testnetBradbury} from 'genlayer-js/chains';
import {createPublicClient,decodeFunctionData,formatEther,fromHex,http,keccak256} from 'viem';
import {loadBradburyTestAccount} from './bradbury-wallet.mjs';
assert.equal(process.env.CLAIMLENS_LIVE_APPEAL,'1');
const base='https://claimlens-inclover05s-projects.vercel.app';
const contract='0x3E2C5298063d25e1111CFbe54526e46efe35eD3E';
const saved=JSON.parse(await readFile(`.claimlens-wallet/live-checks-${contract.toLowerCase()}.json`,'utf8'))['x-independent'];
assert.ok(saved?.genHash);
const account=await loadBradburyTestAccount(),owner=account.address.toLowerCase();
const chain={...testnetBradbury,rpcUrls:{default:{http:['https://rpc.testnet-chain.genlayer.com']}}};
const evm=createPublicClient({chain,transport:http(chain.rpcUrls.default.http[0],{timeout:15000,retryCount:0})});
const reader=createClient({chain:{...testnetBradbury,rpcUrls:{default:{http:['https://rpc-bradbury.genlayer.com']}}}});
assert.equal(await evm.getChainId(),4221);
const journalFile=`.claimlens-wallet/${saved.genHash}.appeal.json`;
let journal={};try{journal=JSON.parse(await readFile(journalFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const report={checkedAt:new Date().toISOString(),origin:base,contract,id:saved.id,genHash:saved.genHash,scope:'Real production browser consent and one dedicated-wallet appeal on the pinned stable Bradbury ABI. No repeat payment. A zero quoted bond does not test nonzero bond settlement.',checks:[]};
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function api(path,data){const cookies=await context.cookies(base);const r=await fetch(base+'/api/'+path,{method:data?'POST':'GET',headers:{Cookie:cookies.filter(c=>c.name==='cl_session').map(c=>c.name+'='+c.value).join('; '),...(data?{'Content-Type':'application/json',Origin:base}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(30000)});return {status:r.status,value:await r.json()};}
await context.exposeBinding('appealWalletRequest',async({frame},request)=>{
 assert.equal(new URL(frame.url()).origin,base);
 if(['eth_accounts','eth_requestAccounts'].includes(request.method))return [account.address];
 if(request.method==='eth_chainId')return '0x107d';
 if(request.method==='wallet_switchEthereumChain'){assert.equal(request.params[0].chainId,'0x107d');return null;}
 if(request.method==='personal_sign'){assert.equal(request.params[1].toLowerCase(),owner);const message=fromHex(request.params[0],'string');assert.ok(message.startsWith(new URL(base).host+' wants'));assert.ok(message.includes('URI: '+base));return account.signMessage({message});}
 assert.equal(request.method,'eth_sendTransaction');assert.equal(new URL(frame.url()).pathname,'/checks/'+saved.id);
 assert.ok(!journal.evmHash,'A recorded appeal must be tracked, never paid again.');
 const tx=request.params[0];assert.deepEqual(Object.keys(tx).sort(),['chainId','data','from','gas','gasPrice','to','value']);
 assert.equal(tx.from.toLowerCase(),owner);assert.equal(tx.to.toLowerCase(),chain.consensusMainContract.address.toLowerCase());assert.equal(BigInt(tx.chainId),4221n);
 const call=decodeFunctionData({abi:chain.consensusMainContract.abi,data:tx.data});assert.equal(call.functionName,'submitAppeal');assert.equal(call.args[0],saved.genHash);
 const current=await reader.getTransaction({hash:saved.genHash});assert.equal(current.statusName,'ACCEPTED');
 const bond=await reader.getMinAppealBond({txId:saved.genHash});assert.equal(BigInt(tx.value),bond);assert.equal(bond,0n,'This test is limited to the observed zero-bond stable-network path.');
 const gas=BigInt(tx.gas),gasPrice=BigInt(tx.gasPrice);assert.ok(gas>=await evm.estimateGas({account:account.address,to:tx.to,data:tx.data,value:bond}));assert.ok(gas*gasPrice<50000000000000000n);
 assert.ok(await evm.getBalance({address:account.address})>=bond+gas*gasPrice);
 const nonce=await evm.getTransactionCount({address:account.address,blockTag:'pending'});
 const signed=await account.signTransaction({to:tx.to,data:tx.data,value:bond,gas,gasPrice,nonce,chainId:4221,type:'legacy'}),hash=keccak256(signed);
 journal={createdAt:new Date().toISOString(),id:saved.id,genHash:saved.genHash,evmHash:hash,nonce,bondGEN:formatEther(bond),maximumNetworkFeeGEN:formatEther(gas*gasPrice),state:'broadcast_outcome_uncertain'};
 await writeFile(journalFile,JSON.stringify(journal,null,2)+'\n');
 assert.equal((await evm.sendRawTransaction({serializedTransaction:signed})).toLowerCase(),hash.toLowerCase());journal.state='broadcast';await writeFile(journalFile,JSON.stringify(journal,null,2)+'\n');
 console.log(JSON.stringify({event:'appeal_broadcast',evmHash:hash,genHash:saved.genHash}));return hash;
});
await context.addInitScript(()=>{const provider={request:r=>window.appealWalletRequest(r),on:()=>{},removeListener:()=>{}};const info={uuid:'claimlens-appeal-test-wallet',name:'ClaimLens appeal test wallet',rdns:'claimlens.test-wallet',icon:''};window.addEventListener('eip6963:requestProvider',()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{provider,info}})));window.ethereum=provider;});
try{
 await page.goto(base);await page.getByRole('button',{name:'Connect wallet',exact:true}).click();await page.getByRole('button',{name:'ClaimLens appeal test wallet'}).click();await page.getByRole('button',{name:/Wallet profile for/}).waitFor();
 const response=await api('checks/'+saved.id);assert.equal(response.status,200);assert.equal(response.value.check.owner,owner);assert.equal(response.value.check.input_hash,saved.inputHash);assert.equal(response.value.check.contract.toLowerCase(),contract.toLowerCase());
 await page.goto(base+'/checks/'+saved.id);
 if(!journal.evmHash){
  await page.getByRole('button',{name:'Review appeal cost',exact:true}).click();await page.getByLabel('I understand the appeal bond is at risk.').waitFor();assert.equal(await page.getByRole('button',{name:'Submit appeal',exact:true}).isEnabled(),false);
  await page.getByLabel('I understand the appeal bond is at risk.').check();await page.getByRole('button',{name:'Submit appeal',exact:true}).click();await page.getByRole('link',{name:/View appeal transaction/}).waitFor();
  assert.equal(await page.getByRole('link',{name:/View appeal transaction/}).getAttribute('href'),'https://explorer.testnet-chain.genlayer.com/tx/'+journal.evmHash);
  assert.equal(await page.evaluate(id=>localStorage.getItem('claimlens-appeal:'+id),saved.id),journal.evmHash);
  report.checks.push('Real owner browser quote, explicit bond-risk consent, metadata stripping, wallet signing and persisted hash');
 }
 assert.ok(journal.evmHash);
 const receipt=await evm.waitForTransactionReceipt({hash:journal.evmHash,timeout:60000});assert.equal(receipt.status,'success');
 const tx=await evm.getTransaction({hash:journal.evmHash});assert.equal(tx.from.toLowerCase(),owner);assert.equal(tx.value,0n);
 report.evmHash=journal.evmHash;report.evmStatus=receipt.status;report.bondGEN=journal.bondGEN;report.networkFeeGEN=formatEther(receipt.gasUsed*receipt.effectiveGasPrice);report.transactionSent=true;
 const seen=[];const deadline=Date.now()+5*60*1000;
 while(Date.now()<deadline){const state=await reader.getTransaction({hash:saved.genHash});const name=state.statusName;if(seen.at(-1)!==name){seen.push(name);console.log(JSON.stringify({event:'appeal_state',status:name}));}if(['ACCEPTED','FINALIZED'].includes(name)&&seen.some(s=>s.startsWith('APPEAL_')))break;await new Promise(r=>setTimeout(r,15000));}
 report.observedStates=seen;report.appealCommitteeObserved=seen.some(s=>s.startsWith('APPEAL_'));
 assert.ok(report.appealCommitteeObserved,'No appeal committee observed within the bounded observation window. Receipt success is retained separately.');
 await page.getByRole('button',{name:'Refresh status',exact:true}).click();const after=await api('checks/'+saved.id);assert.equal(after.status,200);report.websiteState=after.value.check.state;report.verdict=after.value.check.verdict;report.adjudicationAgreedAfterAppeal=['accepted','finalized'].includes(after.value.check.state);report.nonzeroBondSettlementTested=false;
 if(!report.adjudicationAgreedAfterAppeal){assert.ok(!after.value.check.result);assert.ok(!after.value.check.verdict);report.staleVerdictAbsent=true;}
 if(after.value.check.result){const result=JSON.parse(after.value.check.result);assert.equal(result.input_hash,saved.inputHash);assert.equal(result.owner,owner);assert.equal(result.policy,'claimlens-evidence-v1');report.resultProvenanceMatched=true;}
 await mkdir('outputs/release',{recursive:true});await page.screenshot({path:'outputs/release/live-appeal.png',fullPage:true});assert.deepEqual(errors,[]);report.checks.push('Successful appeal EVM receipt, observed protocol appeal committee, refreshed website state and provenance when available');report.ok=true;
}catch(e){report.ok=false;report.error=e.message;report.evmHash=journal.evmHash;report.transactionSent=!!journal.evmHash;process.exitCode=1;}
finally{report.completedAt=new Date().toISOString();report.consoleErrors=errors;await api('auth/logout',{}).catch(()=>{});await writeFile('reports/live-appeal-verification.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(JSON.stringify(report));}
