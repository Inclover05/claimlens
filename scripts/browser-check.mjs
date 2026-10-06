// UI regression fixtures only. No chain writes and no fabricated public feed records.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.CLAIMLENS_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(base);await page.getByRole('heading',{name:'A claim deserves a closer look.'}).waitFor();
 await page.getByRole('button',{name:'Pause lens animation'}).waitFor();
 await page.getByRole('button',{name:'Pause lens animation'}).click();
 assert.equal(await page.getByRole('button',{name:'Play lens animation'}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'Football',exact:true}).first().click();
 assert.match(await page.getByLabel('What would you like to fact-check?').inputValue(),/Argentina/);
 await page.getByRole('button',{name:'Review claim'}).click();
 await page.getByRole('dialog').waitFor();
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('tab',{name:'Paste a link'}).click();
 await page.getByLabel('Post or article link').fill('http://localhost/source');
 await page.getByText('Use a public HTTPS link, such as https://x.com/…',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Review claim'}).isEnabled(),false);
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Open menu'}).click();
 await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'How it works'}).click();
 await page.getByRole('heading',{name:'Clarity has a process.'}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.goto(base+'/dashboard');
 await page.getByRole('button',{name:'Sign in with wallet'}).waitFor();
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:1000});await page.goto(base);
 await page.getByRole('heading',{level:1}).waitFor();
 assert.equal(await page.locator('canvas').count(),0);
 assert.equal(await page.locator('.brand-logo').evaluate(element=>getComputedStyle(element).animationName),'none');
 // Three explicitly announced providers; only the chosen provider may be restored.
 const address='0x00000000000000000000000000000000000000ab';
 const checkId='11111111-1111-1111-1111-111111111111';let state='draft',mode='timeout',hashSaved=null;
 await page.addInitScript(({address})=>{
  sessionStorage.setItem('claimlens-wallet','Rabby');
  window.fixtureCalls=[];window.fixtureMode='timeout';
  const wallets=['MetaMask','Rabby','OKX'].map(name=>({info:{uuid:name,name,rdns:name,icon:''},provider:{request:async({method})=>{
   window.fixtureCalls.push({name,method});if(method==='eth_accounts')return [address];if(method==='eth_chainId')return '0x107d';
   if(method==='eth_sendTransaction'){if(window.fixtureMode==='timeout')throw {code:-32603,message:'provider timeout'};return '0x'+'a'.repeat(64);}return null;
  }}}));
  const announce=()=>wallets.forEach(detail=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail})));
  window.addEventListener('eip6963:requestProvider',announce);
 },{address});
 let sessionGate=null,sessionRequested=null;
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let data={};let status=200;
  if(path==='/api/auth/me'){if(sessionGate){sessionRequested();await sessionGate;}data={user:{address,username:'fixture'}};}
  else if(path===`/api/checks/${checkId}`)data={check:{id:checkId,owner:address,claim:'The Moon produces its own visible light.',source:'https://www.nasa.gov/',visibility:'private',topic:'Science',created_at:1791300000,state,input_hash:'fixture-only',contract:'0x'+'b'.repeat(40),payload:JSON.stringify({source_urls:['https://www.nasa.gov/']})}};
  else if(path.endsWith('/prepare'))data={transaction:{from:address,to:'0x'+'c'.repeat(40),data:'0x00',value:'0x0',gas:'0x10000',chainId:'0x107d',gasPrice:'0x1',feeGen:.01,expiresAt:Date.now()/1000+300}};
  else if(path.endsWith('/attempt')){if(state!=='draft'){status=409;data={error:'A wallet attempt is already in progress.'};}else{state='awaiting_wallet';data={ok:true};}}
  else if(path.endsWith('/broadcast')){if(mode==='hash'){status=503;data={error:'Fixture API outage'};}else{hashSaved=JSON.parse(route.request().postData()).evmHash;state='broadcast';data={ok:true};}}
  else if(path.endsWith('/checks'))data={checks:[]};
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 // A fast composer interaction must wait for a delayed restored session.
 let releaseSession;
 sessionGate=new Promise(resolve=>{releaseSession=resolve;});
 const sessionStarted=new Promise(resolve=>{sessionRequested=resolve;});
 await page.goto(base);await sessionStarted;
 await page.getByLabel('What would you like to fact-check?').fill('The Moon is a natural satellite of Earth.');
 assert.equal(await page.getByRole('button',{name:'Review claim'}).isEnabled(),false);
 releaseSession();sessionGate=null;
 await page.getByRole('button',{name:'Wallet profile for fixture',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Review claim'}).isEnabled(),true);
 assert.equal(await page.getByRole('dialog').count(),0);
 const begin=async()=>{await page.goto(base+'/checks/'+checkId);await page.getByLabel('I understand that my claim').check();await page.getByRole('button',{name:'Estimate GEN fee'}).click();await page.getByRole('button',{name:'Pay GEN & check claim'}).click();};
 await begin();await page.getByRole('alert').filter({hasText:'wallet outcome is uncertain'}).waitFor();
 await page.getByRole('button',{name:'Refresh status'}).click();
 assert.equal(await page.getByRole('button',{name:'Pay GEN & check claim'}).count(),0);
 await page.reload();await page.getByRole('heading',{name:'Check your wallet activity'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Estimate GEN fee'}).count(),0);
 state='draft';mode='hash';await page.reload();await page.evaluate(()=>{window.fixtureMode='hash';});
 await page.getByLabel('I understand that my claim').check();await page.getByRole('button',{name:'Estimate GEN fee'}).click();await page.getByRole('button',{name:'Pay GEN & check claim'}).click();
 await page.getByRole('alert').filter({hasText:'transaction hash'}).waitFor();
 await page.reload();assert.equal(await page.getByLabel('Wallet transaction hash').inputValue(),'0x'+'a'.repeat(64));
 mode='recover';await page.getByRole('button',{name:'Link transaction'}).click();
 await page.getByRole('heading',{name:'Following the evidence'}).waitFor();
 assert.equal(hashSaved,'0x'+'a'.repeat(64));
 const calls=await page.evaluate(()=>window.fixtureCalls);assert.equal(calls.some(call=>call.name!=='Rabby'),false);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,checks:['composer validation','wallet dialog','mobile navigation','help and dashboard','reduced motion','delayed session restoration','three-provider restoration','uncertain outcome lock','hash persistence and recovery'],scope:'Browser fixtures; no real wallet or GenLayer transaction'},null,2));
}finally{await browser.close();}


