import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { abi, createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { createPublicClient, decodeFunctionData, formatEther, fromHex, http, keccak256 } from 'viem';
import { loadBradburyTestAccount } from './bradbury-wallet.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base = process.env.CLAIMLENS_URL;
assert.ok(/^https:\/\/claimlens-(?:[a-z0-9]+-)?inclover05s-projects\.vercel\.app$/.test(base || ''));
const origin = new URL(base).origin;
assert.equal(process.env.CLAIMLENS_LIVE_WRITE, '1', 'Explicit test-wallet writes must be enabled.');
const contract = process.env.CLAIMLENS_CONTRACT;
assert.ok(/^0x[0-9a-f]{40}$/i.test(contract||''));
const account = await loadBradburyTestAccount();
const address = account.address.toLowerCase();
const chain = { ...testnetBradbury, rpcUrls: { default: { http: ['https://rpc.testnet-chain.genlayer.com'] } } };
const chainClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0], { retryCount: 0, timeout: 15000 }) });
const lifecycleReader = createClient({ chain: { ...testnetBradbury, rpcUrls: { default: { http: ['https://rpc-bradbury.genlayer.com'] } } } });
assert.equal(await chainClient.getChainId(), 4221);
const ledgerFile = new URL(`../.claimlens-wallet/live-checks-${contract.toLowerCase()}.json`, import.meta.url);
let ledger = {};
try { ledger = JSON.parse(await readFile(ledgerFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
let saveQueue = Promise.resolve();
const save = () => { const snapshot = JSON.stringify(ledger, null, 2) + '\n'; saveQueue = saveQueue.then(() => writeFile(ledgerFile, snapshot)); return saveQueue; };
const report = { checkedAt: new Date().toISOString(), origin, contract, address, scope: 'Real public Vercel browser, wallet signature, API, Neon and Bradbury writes; no Vercel session or bypass headers', cases: [], checks: [], liveDecisionVerified: false };
const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const errors = [];
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
async function api(path, data, guest = false) {
  const headers = {};
  if (!guest) headers.Cookie = (await context.cookies(origin)).filter(cookie => cookie.name === 'cl_session').map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  if (data) { headers['Content-Type'] = 'application/json'; headers.Origin = origin; }
  const response = await fetch(base + '/api/' + path, { method: data ? 'POST' : 'GET', headers, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(30000) });
  return { status: response.status, value: await response.json() };
}
let currentCase;
await context.exposeBinding('claimlensTestWalletRequest', async ({ frame }, request) => {
  assert.equal(new URL(frame.url()).origin, origin);
  if (['eth_accounts', 'eth_requestAccounts'].includes(request.method)) return [account.address];
  if (request.method === 'eth_chainId') return '0x107d';
  if (request.method === 'wallet_switchEthereumChain') { assert.equal(request.params[0].chainId, '0x107d'); return null; }
  if (request.method === 'personal_sign') {
    assert.equal(request.params[1].toLowerCase(), address);
    const message = fromHex(request.params[0], 'string');
    assert.ok(message.startsWith(new URL(origin).host + ' wants'));
    assert.ok(message.includes('URI: ' + origin));
    return account.signMessage({ message });
  }
  assert.equal(request.method, 'eth_sendTransaction', 'Unexpected wallet method');
  assert.ok(currentCase);
  const id = new URL(frame.url()).pathname.match(/^\/checks\/([a-f0-9-]{36})$/)?.[1];
  assert.ok(id);
  const existing = ledger[currentCase.name];
  if (existing?.evmHash) { assert.equal(existing.id, id); return existing.evmHash; }
  const checkResponse = await api('checks/' + id);
  assert.equal(checkResponse.status, 200);
  const check = checkResponse.value.check;
  assert.equal(check.owner, address);
  assert.equal(check.contract.toLowerCase(), contract.toLowerCase());
  assert.equal(check.visibility, 'private');
  assert.equal(check.claim, currentCase.claim);
  assert.equal(createHash('sha256').update(check.payload).digest('hex'), check.input_hash);
  const tx = request.params[0];
  assert.equal(tx.from.toLowerCase(), address);
  assert.equal(tx.to.toLowerCase(), chain.consensusMainContract.address.toLowerCase());
  assert.equal(BigInt(tx.chainId), 4221n);
  assert.equal(BigInt(tx.value || '0x0'), 0n);
  const call = decodeFunctionData({ abi: chain.consensusMainContract.abi, data: tx.data });
  assert.equal(call.functionName, 'addTransaction');
  assert.equal(call.args[0].toLowerCase(), address);
  assert.equal(call.args[1].toLowerCase(), contract.toLowerCase());
  assert.equal(call.args[2], 5n);
  assert.equal(call.args[3], 3n);
  assert.equal(call.args[4], abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject('check_claim', [check.payload], undefined)), false]));
  assert.ok(call.args[5] > BigInt(Math.floor(Date.now() / 1000)));
  assert.ok(call.args[5] < BigInt(Math.floor(Date.now() / 1000) + 3700));
  const gas = BigInt(tx.gas), gasPrice = BigInt(tx.gasPrice);
  const requiredGas = await chainClient.estimateGas({ account: account.address, to: tx.to, data: tx.data, value: 0n });
  assert.ok(gas >= requiredGas);
  assert.ok(gas * gasPrice <= 50000000000000000n, 'Live test fee exceeds 0.05 test GEN');
  assert.ok(await chainClient.getBalance({ address: account.address }) >= gas * gasPrice);
  const nonce = await chainClient.getTransactionCount({ address: account.address, blockTag: 'pending' });
  const signed = await account.signTransaction({ to: tx.to, data: tx.data, value: 0n, gas, gasPrice, nonce, chainId: 4221, type: 'legacy' });
  const hash = keccak256(signed);
  ledger[currentCase.name] = { id, claim: check.claim, origin, contract, inputHash: check.input_hash, sourceUrls: JSON.parse(check.payload).source_urls, evmHash: hash, nonce, maximumNetworkFeeGEN: formatEther(gas * gasPrice), state: 'broadcast_outcome_uncertain' };
  await save();
  try {
    assert.equal((await chainClient.sendRawTransaction({ serializedTransaction: signed })).toLowerCase(), hash.toLowerCase());
    ledger[currentCase.name].state = 'broadcast';
    await save();
    console.log(JSON.stringify({ event: 'live_check_broadcast', scenario: currentCase.name, id, evmHash: hash, maximumNetworkFeeGEN: formatEther(gas * gasPrice) }));
    return hash;
  } catch {
    throw new Error('Test wallet outcome uncertain; the EVM hash is saved locally. Do not resend.');
  }
});
await context.addInitScript(() => {
  const provider = { request: request => window.claimlensTestWalletRequest(request), on: () => {}, removeListener: () => {} };
  const info = { uuid: 'claimlens-local-test-wallet', name: 'ClaimLens test wallet', rdns: 'claimlens.test-wallet', icon: '' };
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: { info, provider } }));
  window.addEventListener('eip6963:requestProvider', announce);
  window.ethereum = provider;
});
const scenarios = [
  { name: 'supported', claim: "The Moon is Earth's only natural satellite.", source: 'https://science.nasa.gov/moon/facts/', expected: 'Supported' },
  { name: 'x-post', claim: 'Argentina won the 2022 FIFA World Cup.', source: 'https://x.com/FIFAWorldCup/status/1604535989480955908', expected: 'Supported', linkMode: true, manualOnly: true },
  { name: 'contradicted', claim: 'The Moon produces its own visible light.', source: 'https://science.nasa.gov/moon/facts/', expected: 'Contradicted' },
  { name: 'opinion', claim: 'Chocolate tastes better than vanilla.', source: 'https://science.nasa.gov/moon/facts/', expected: 'Not a factual claim' },
  { name: 'irrelevant-evidence', claim: 'At 09:00 UTC on 1 October 2026, the temperature at North Sentinel Island was exactly 20 degrees Celsius.', source: 'https://science.nasa.gov/moon/facts/', expected: 'Insufficient evidence' },
  { name: 'football-international', claim: 'As of 7 October 2026, Cristiano Ronaldo has scored more senior international goals than Neymar.', source: 'https://en.wikipedia.org/wiki/List_of_international_goals_scored_by_Cristiano_Ronaldo', sources: ['https://en.wikipedia.org/wiki/List_of_international_goals_scored_by_Cristiano_Ronaldo','https://en.wikipedia.org/wiki/List_of_international_goals_scored_by_Neymar'], expected: 'Supported' },
  { name: 'x-independent', claim: 'Argentina won the 2022 FIFA World Cup.', source: 'https://x.com/FIFAWorldCup/status/1604535989480955908', sources: ['https://en.wikipedia.org/wiki/2022_FIFA_World_Cup'], expected: 'Supported', linkMode: true },
].filter(item => process.env.CLAIMLENS_CASES ? process.env.CLAIMLENS_CASES.split(',').includes(item.name) : !item.manualOnly);
assert.ok(scenarios.length);
report.requestedCases = scenarios.map(item => item.name);
try {
  await page.goto(base);
  await page.getByRole('heading', { name: 'A claim deserves a closer look.' }).waitFor();
  const config = await api('config');
  assert.equal(config.value.contract.toLowerCase(), contract.toLowerCase());
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
  await page.getByRole('button', { name: 'ClaimLens test wallet' }).click();
  await page.getByRole('button', { name: /Wallet profile for/ }).waitFor();
  const username = page.getByLabel('Username', { exact: true });
  if (await username.isVisible()) {
    await username.fill('tester_' + address.slice(2, 10));
    await page.getByRole('button', { name: 'Save username', exact: true }).click();
  }
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  report.checks.push('Real browser wallet sign-in and saved profile');
  await mkdir('outputs/live', { recursive: true });
  for (const scenario of scenarios) {
    currentCase = scenario;
    let id = ledger[scenario.name]?.id;
    if (!id) {
      await page.goto(base);
      if (scenario.linkMode) {
        await page.getByRole('tab', { name: 'Paste a link' }).click();
        await page.getByLabel('Post or article link').fill(scenario.source);
        assert.equal(await page.getByRole('button', { name: 'Review claim', exact: true }).isEnabled(), false);
        await page.getByLabel('The claim in the post').fill(scenario.claim);
      } else {
        await page.getByLabel('What would you like to fact-check?').fill(scenario.claim);
        await page.getByLabel('Source link', { exact: true }).fill(scenario.source);
      }
      const privacy = page.getByRole('switch', { name: 'Keep this check private' });
      if (await privacy.getAttribute('aria-checked') !== 'true') await privacy.click();
      await page.getByRole('button', { name: 'Review claim', exact: true }).click();
      await page.waitForURL(/\/checks\/[a-f0-9-]{36}$/, { timeout: 90000 });
      id = new URL(page.url()).pathname.split('/').pop();
      ledger[scenario.name] = { id, claim: scenario.claim, origin, state: 'draft' };
      await save();
      console.log(JSON.stringify({ event: 'live_draft_created', scenario: scenario.name, id }));
    } else await page.goto(base + '/checks/' + id);
    let detail = (await api('checks/' + id)).value.check;
    if (scenario.name === 'supported' && detail.visibility === 'public') {
      assert.equal((await api('checks/' + id + '/visibility', { visibility: 'private' })).status, 200);
      detail = (await api('checks/' + id)).value.check;
    }
    if (scenario.name === 'x-post' && process.env.CLAIMLENS_X_DRAFT_ONLY === '1') {
      assert.equal(detail.state, 'draft');
      assert.equal(detail.source, scenario.source);
      assert.equal(detail.claim, scenario.claim);
      assert.ok(JSON.parse(detail.payload).source_urls.includes(scenario.source));
      assert.ok(JSON.parse(detail.payload).source_urls.some(url => url !== scenario.source), 'Find independent evidence beyond the X link');
      assert.equal((await api('checks/' + id, undefined, true)).status, 404);
      await page.getByLabel('I understand that my claim').check();
      await page.getByRole('button', { name: 'Estimate GEN fee', exact: true }).click();
      await page.getByRole('button', { name: 'Pay GEN & check claim', exact: true }).waitFor({ timeout: 60000 });
      assert.ok(!ledger[scenario.name].evmHash, 'This draft test must not spend GEN');
      await page.screenshot({ path: 'outputs/live/x-post-draft.png', fullPage: true });
      report.cases.push({ name: scenario.name, id, claim: scenario.claim, state: 'draft', source: detail.source, sourceUrls: JSON.parse(detail.payload).source_urls, guestDenied: true, feeEstimateVerified: true, transactionSent: false });
      report.checks.push('X post paste-link mode requires a quoted claim, preserves original URL, finds independent candidates, saves privately and estimates actual GEN fee');
      continue;
    }
    if (detail.state === 'draft') {
      const sources = scenario.sources || (scenario.name === 'x-post' ? [scenario.source,'https://en.wikipedia.org/wiki/2022_FIFA_World_Cup'] : [scenario.source]);
      const response=await api('checks/'+id+'/sources',{sourceUrls:sources});assert.equal(response.status,200);
      await page.reload();await page.getByLabel('I understand that my claim').waitFor();

      await page.getByLabel('I understand that my claim').check();
      await page.getByRole('button', { name: 'Estimate GEN fee', exact: true }).click();
      await page.getByRole('button', { name: 'Pay GEN & check claim', exact: true }).waitFor({ timeout: 60000 });
      await page.getByRole('button', { name: 'Pay GEN & check claim', exact: true }).click();
    } else if (detail.state === 'awaiting_wallet' && ledger[scenario.name].evmHash) {
      await page.getByLabel('Wallet transaction hash').fill(ledger[scenario.name].evmHash);
      await page.getByRole('button', { name: 'Link transaction', exact: true }).click();
    }
    const deadline = Date.now() + 15 * 60 * 1000;
    let previousState = '';
    while (Date.now() < deadline) {
      const response = await api('checks/' + id);
      assert.equal(response.status, 200);
      detail = response.value.check;
      Object.assign(ledger[scenario.name], { state: detail.state, genHash: detail.gen_hash, verdict: detail.verdict });
      await save();
      if (detail.state !== previousState) { console.log(JSON.stringify({ event: 'live_check_state', scenario: scenario.name, state: detail.state, verdict: detail.verdict, genHash: detail.gen_hash })); previousState = detail.state; }
      if (['accepted', 'finalized'].includes(detail.state) && detail.result) break;
      if (['execution_failed', 'undetermined', 'finalized_no_consensus'].includes(detail.state)) { report.failedCase = { name: scenario.name, id, state: detail.state, error: detail.error, evmHash: detail.evm_hash, genHash: detail.gen_hash }; throw new Error('Live consensus did not produce a verdict for ' + scenario.name); }
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
    assert.ok(['accepted', 'finalized'].includes(detail.state), 'Consensus decision timed out; resume the saved transaction');
    assert.equal(detail.verdict, scenario.expected);
    const result = JSON.parse(detail.result);
    assert.equal(result.input_hash, detail.input_hash);
    assert.equal(result.owner, address);
    assert.equal(result.policy, 'claimlens-evidence-v1');
    const consensus = await lifecycleReader.getTransaction({ hash: detail.gen_hash });
    assert.equal(consensus.txExecutionResultName, 'FINISHED_WITH_RETURN');
    assert.ok(['AGREE', 'MAJORITY_AGREE'].includes(consensus.resultName));
    assert.ok(['ACCEPTED', 'FINALIZED'].includes(consensus.statusName));
    const readBack = await lifecycleReader.readContract({ address: contract, functionName: 'get_check', args: [address, id], transactionHashVariant: detail.state === 'finalized' ? 'latest-final' : 'latest-nonfinal' });
    assert.deepEqual(JSON.parse(readBack), result);
    const receipt = await chainClient.getTransactionReceipt({ hash: detail.evm_hash });
    assert.equal(receipt.status, 'success');
    if (scenario.name === 'supported') assert.ok(result.evidence.some(entry => entry.url === scenario.source && /natural satellite/i.test(entry.quote)), 'The supported result must cite the substantive NASA passage, not just a page title.');
    const guest = await api('checks/' + id, undefined, true);
    assert.equal(guest.status, 404);
    const feed = await api('checks', undefined, true);
    assert.equal(feed.value.checks.some(check => check.id === id), false);
    await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
    await page.getByText(scenario.expected, { exact: true }).first().waitFor();
    assert.equal(await page.getByRole('link', { name: /^GenLayer transaction/ }).getAttribute('href'), 'https://explorer-bradbury.genlayer.com/tx/' + detail.gen_hash);
    await page.screenshot({ path: `outputs/live/${scenario.name}.png`, fullPage: true });
    report.cases.push({ name: scenario.name, id, claim: scenario.claim, originalSource: detail.source, selectedSourceUrls: JSON.parse(detail.payload).source_urls, state: detail.state, verdict: detail.verdict, evmHash: detail.evm_hash, genHash: detail.gen_hash, inputHash: detail.input_hash, executionResult: consensus.txExecutionResultName, networkFeeGEN: formatEther(receipt.gasUsed * receipt.effectiveGasPrice), independentReadBackMatched: true, result, guestDenied: true, publicFeedExcluded: true });
    console.log(JSON.stringify({ event: 'live_scenario_verified', scenario: scenario.name, verdict: detail.verdict }));
  }
  const supported = report.cases.find(item => item.name === 'supported');
  if (supported) {
  const visibility = await api('checks/' + supported.id + '/visibility', { visibility: 'public' });
  assert.equal(visibility.status, 200);
  try {
    assert.equal((await api('checks/' + supported.id, undefined, true)).status, 200);
    const guestContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const guestPage = await guestContext.newPage();
      await guestPage.goto(base);
      await guestPage.getByLabel('Search public checks').fill(scenarios[0].claim);
      const card = guestPage.locator('a[href="/checks/' + supported.id + '"]');
      await card.waitFor();
      await card.click();
      await guestPage.getByText('Supported', { exact: true }).first().waitFor();
      assert.equal(await guestPage.getByRole('button', { name: 'Make private', exact: true }).count(), 0);
      await guestPage.screenshot({ path: 'outputs/live/public-guest.png', fullPage: true });
      report.checks.push('Guest search, public result rendering and absence of owner visibility controls');
    } finally { await guestContext.close(); }
  } finally { assert.equal((await api('checks/' + supported.id + '/visibility', { visibility: 'private' })).status, 200); }
  assert.equal((await api('checks/' + supported.id, undefined, true)).status, 404);
  report.checks.push('Owner visibility toggle and restored private guest denial');
  }
  assert.deepEqual(errors, []);
  report.checks.push('Actual claim submission, signed EVM transactions, provenance-checked consensus results, private access and rendered verdicts');
  report.liveDecisionVerified = true;
  report.ok = true;
} catch (error) {
  report.ok = false;
  report.error = error instanceof Error ? error.message : 'Live verification failed';
  await page.screenshot({ path: 'outputs/live/current-state.png', fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  report.completedAt = new Date().toISOString();
  report.consoleErrors = errors;
  await writeFile(`reports/live-${contract.toLowerCase()}.json`, JSON.stringify(report, null, 2) + '\n');
  await api('auth/logout', {}).catch(() => {});
  await browser.close();
  console.log(JSON.stringify({ event: 'live_browser_complete', ok: report.ok, error: report.error, cases: report.cases.map(item => ({ name: item.name, state: item.state, verdict: item.verdict })) }));
}
