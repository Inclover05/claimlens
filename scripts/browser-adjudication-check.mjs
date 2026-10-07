// Isolated UI fixtures. No real signature, broadcast or database write.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.CLAIMLENS_URL||'http://127.0.0.1:5174';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const id='11111111-1111-4111-8111-111111111111',address='0x'+'a'.repeat(40);
const nasa='https://science.nasa.gov/moon/facts/',wiki='https://en.wikipedia.org/wiki/Moon';
let sources=[nasa,wiki],state='draft',inputHash='before',edits=[];
const report={checkedAt:new Date().toISOString(),origin:base,scope:'Browser fixtures only; no real wallet, chain transaction or database write.',checks:[]};
const quote=()=>({from:address,to:'0x'+'b'.repeat(40),data:'0x00',value:'0x0',gas:'0x10000',gasPrice:'0x1',chainId:'0x107d',feeGen:.001,expiresAt:Date.now()/1000+60,inputHash,bondGen:0,genHash:'0x'+'c'.repeat(64)});
await page.addInitScript(({address})=>{
 sessionStorage.setItem('claimlens-wallet','Rabby');window.fixtureSends=[];window.fixtureMode='reject';
 const provider={request:async request=>{if(request.method==='eth_accounts')return [address];if(request.method==='eth_chainId')return '0x107d';if(request.method==='eth_sendTransaction'){window.fixtureSends.push(request.params[0]);throw window.fixtureMode==='reject'?{code:4001}:{code:-32603};}return null;},on(){},removeListener(){}};
 window.addEventListener('eip6963:requestProvider',()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{uuid:'Rabby',name:'Rabby',rdns:'Rabby',icon:''},provider}})));
},{address});
await page.route('**/api/**',async route=>{
 const path=new URL(route.request().url()).pathname;let data={},status=200;
 if(path==='/api/auth/me')data={user:{address,username:'fixture'}};
 else if(path===`/api/checks/${id}`)data={check:{id,owner:address,claim:"The Moon is Earth's only natural satellite.",source:nasa,visibility:'private',topic:'Science',created_at:1791300000,state,input_hash:inputHash,contract:'0x'+'d'.repeat(40),payload:JSON.stringify({source_urls:sources}),...(state==='accepted'?{result:JSON.stringify({verdict:'Supported',explanation:'Fixture evidence result.',caveats:'',evidence:[],as_of:'2026-10-07'})}:{})}};
 else if(path.endsWith('/sources')){sources=JSON.parse(route.request().postData()).sourceUrls;edits.push([...sources]);inputHash='updated';data={ok:true};}
 else if(path.endsWith('/prepare'))data={transaction:quote()};
 else if(path.endsWith('/attempt')){status=409;data={error:'The sources changed. Request a fresh fee estimate.'};}
 else if(path.endsWith('/appeal')){const {inputHash,...appeal}=quote();void inputHash;data={transaction:appeal};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
});
try{
 await page.goto(base+'/checks/'+id);await page.getByLabel('Use evidence '+nasa).waitFor();
 await page.getByLabel('Use evidence '+nasa).uncheck();
 await page.getByLabel('I understand that my claim').check();
 await page.getByRole('button',{name:'Estimate GEN fee',exact:true}).click();
 await page.getByRole('button',{name:'Pay GEN & check claim',exact:true}).waitFor();assert.deepEqual(edits.at(-1),[wiki]);
 await page.getByLabel('Add an evidence link').fill('https://www.uefa.com/news/');
 await page.getByRole('button',{name:'Add source',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Pay GEN & check claim',exact:true}).count(),0);
 await page.getByRole('button',{name:'Estimate GEN fee',exact:true}).click();
 await page.getByRole('button',{name:'Pay GEN & check claim',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'sources changed'}).waitFor();assert.equal(await page.evaluate(()=>window.fixtureSends.length),0);
 report.checks.push('Evidence selection saves exact source order; adding evidence invalidates the fee quote; stale attempt rejection never calls the wallet');
 state='accepted';await page.reload();await page.getByRole('button',{name:'Review appeal cost',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Submit appeal',exact:true}).isEnabled(),false);
 await page.getByLabel('I understand the appeal bond is at risk.').check();await page.getByRole('button',{name:'Submit appeal',exact:true}).click();
 await page.getByRole('status').filter({hasText:'declined the appeal'}).waitFor();
 assert.equal(await page.evaluate(id=>localStorage.getItem('claimlens-appeal:'+id),id),null);
 const sent=await page.evaluate(()=>window.fixtureSends[0]);assert.deepEqual(Object.keys(sent).sort(),['chainId','data','from','gas','gasPrice','to','value'].sort());
 report.checks.push('Appeal requires explicit bond consent, strips display metadata from wallet input and unlocks only after explicit wallet rejection');
 await page.evaluate(()=>{window.fixtureMode='timeout';});await page.getByRole('button',{name:'Submit appeal',exact:true}).click();
 await page.getByRole('status').filter({hasText:'appeal outcome is uncertain'}).waitFor();assert.equal(await page.getByRole('button',{name:'Submit appeal',exact:true}).count(),0);
 await page.reload();await page.getByRole('button',{name:'Review appeal cost',exact:true}).click();await page.getByText('Check wallet activity and refresh the record.').waitFor();
 assert.equal(await page.getByRole('button',{name:'Submit appeal',exact:true}).count(),0);
 report.checks.push('Uncertain appeal is persisted before wallet invocation and remains locked after reload');
 report.ok=true;
}catch(error){report.ok=false;report.error=error.message;process.exitCode=1;}
finally{report.completedAt=new Date().toISOString();await writeFile('reports/browser-adjudication-verification.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(JSON.stringify(report));}
