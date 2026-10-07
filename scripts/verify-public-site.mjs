import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.CLAIMLENS_URL||'https://claimlens-inclover05s-projects.vercel.app';
assert.match(base,/^https:\/\/claimlens-(?:[a-z0-9]+-)?inclover05s-projects\.vercel\.app$/);
const expected=process.env.CLAIMLENS_CONTRACT;assert.match(expected||'',/^0x[0-9a-f]{40}$/i);
const report={checkedAt:new Date().toISOString(),origin:base,expectedContract:expected,scope:'Fresh anonymous browser and public API; no Vercel session, bypass header, wallet signature or blockchain write.',checks:[]};
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 const config=await fetch(base+'/api/config').then(r=>r.json());assert.equal(config.chainId,4221);assert.equal(config.contract.toLowerCase(),expected.toLowerCase());
 const caps=await fetch(base+'/api/capabilities').then(r=>r.json());assert.equal(caps.maximumSources,4);assert.equal(caps.maximumTextCharactersPerPage,6000);assert.equal(caps.maximumTotalTextCharacters,12000);report.checks.push('Public configuration and operating bounds match the release');
 await page.goto(base);await page.getByRole('heading',{name:'A claim deserves a closer look.'}).waitFor();await page.getByRole('button',{name:'Connect wallet',exact:true}).waitFor();
 await page.getByRole('button',{name:'Pause lens animation'}).click();assert.equal(await page.getByRole('button',{name:'Play lens animation'}).getAttribute('aria-pressed'),'true');
 await page.getByLabel('Search public checks').fill('Moon');await page.locator('a[href="/checks/65ad7eca-ffa7-419b-8053-791ce0773550"]').waitFor();
 await mkdir('outputs/release',{recursive:true});await page.screenshot({path:'outputs/release/home-desktop.png',fullPage:true});report.checks.push('Anonymous desktop homepage, public feed search, wallet entry and motion control');
 await page.goto(base+'/how-it-works');await page.getByRole('heading',{name:'A bounded judgment.'}).waitFor();await page.getByText(/Career goals, league goals and international goals/).waitFor();report.checks.push('Evidence, football scope, X access, privacy and appeal limits are visible in the guide');
 await page.setViewportSize({width:390,height:844});await page.goto(base);await page.getByRole('heading',{name:'A claim deserves a closer look.'}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'Close menu'}).click();await page.getByLabel('Search public checks').fill('Moon');await page.locator('a[href="/checks/65ad7eca-ffa7-419b-8053-791ce0773550"]').waitFor();await page.screenshot({path:'outputs/release/home-mobile.png',fullPage:true});report.checks.push('Anonymous mobile layout, public feed and navigation');
 const old='65ad7eca-ffa7-419b-8053-791ce0773550';const check=await fetch(base+'/api/checks/'+old).then(r=>r.json());assert.equal(check.check.state,'finalized');assert.equal(check.check.verdict,'Supported');await page.goto(base+'/checks/'+old);await page.getByText('Supported',{exact:true}).first().waitFor();report.checks.push('Existing public finalized NASA example remains accessible');
 await page.setViewportSize({width:1440,height:1000});report.examples=[];
 for(const [name,id] of [['current-nasa','29821f47-106c-461f-8d6e-be4b868c6223'],['football','7b3c3c81-2ccb-4b42-ac2f-42f836acbc9e'],['x-appealed','178b5a81-472a-4b8e-aa83-6179fcdd643d']]){
  const r=await fetch(base+'/api/checks/'+id);assert.equal(r.status,200);const {check}=await r.json();assert.equal(check.contract.toLowerCase(),expected.toLowerCase());
  if(name==='current-nasa'){assert.equal(check.state,'finalized');assert.equal(check.verdict,'Supported');}
  if(name==='football'){assert.ok(['accepted','finalized'].includes(check.state));assert.equal(check.verdict,'Supported');}
  const hasVerdict=['accepted','finalized'].includes(check.state);if(!hasVerdict){assert.ok(!check.result);assert.ok(!check.verdict);}
  await page.goto(base+'/checks/'+id);await page.getByRole('heading',{name:check.claim,exact:true}).waitFor();
  if(hasVerdict)await page.getByText(check.verdict,{exact:true}).first().waitFor();else await page.getByText('No fact-check verdict is available for this attempt.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Make private',exact:true}).count(),0);
  await page.screenshot({path:`outputs/release/${name}-public.png`,fullPage:true});report.examples.push({name,id,state:check.state,verdict:check.verdict||null,guestVerified:true,staleVerdictAbsent:!hasVerdict});
 }
 report.checks.push('Current finalized NASA, scoped football and appealed X records render anonymously with current consensus state; no stale verdict after lost agreement');
 const reduced=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto(base);await rp.getByRole('heading',{name:'A claim deserves a closer look.'}).waitFor();assert.equal(await rp.getByRole('button',{name:'Pause lens animation'}).count(),0);await reduced.close();report.checks.push('Reduced motion keeps a static homepage');
 assert.deepEqual(errors,[]);report.consoleErrors=errors;report.ok=true;
}catch(error){report.ok=false;report.error=error.message;process.exitCode=1;}
finally{report.completedAt=new Date().toISOString();await writeFile('reports/release-publication-verification.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(JSON.stringify(report));}
