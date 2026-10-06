import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreWallet, switchToBradbury, submissionMessage, type WalletChoice, type Provider } from '../lib/wallet.ts';
import { lifecycle, safeSource, validateClaim } from '../lib/domain.ts';
const account='0x00000000000000000000000000000000000000ab';
function wallet(name:string,address=account):WalletChoice{return {info:{uuid:name,name,rdns:name,icon:''},provider:{request:async({method})=>method==='eth_accounts'?[address]:null}};}
test('refresh restores the selected provider among three wallets without requesting a signature',async()=>{
 const choices=[wallet('MetaMask'),wallet('Rabby'),wallet('OKX')];
 assert.equal(await restoreWallet(choices,'Rabby',account),choices[1]);
 assert.equal(await restoreWallet(choices,'missing',account),null);
 assert.equal(await restoreWallet(choices,'Rabby','0xother'),null);
});
test('restoration does not silently select a different authorized account',async()=>{
 assert.equal(await restoreWallet([wallet('Rabby','0xother')],'Rabby',account),null);
 const broken=wallet('Rabby');broken.provider.request=async()=>{throw new Error('locked');};
 assert.equal(await restoreWallet([broken],'Rabby',account),null);
});
test('chain setup uses the EVM broadcast RPC and verifies the completed switch',async()=>{
 const calls:{method:string;params?:unknown[]}[]=[];let chain='0x1',added=false;
 const provider:Provider={request:async call=>{calls.push(call);if(call.method==='eth_accounts')return [account];if(call.method==='eth_chainId')return chain;if(call.method==='wallet_addEthereumChain'){added=true;return null;}if(call.method==='wallet_switchEthereumChain'){if(!added)throw {code:4902};chain='0x107d';}return null;}};
 await switchToBradbury(provider,account);
 const network=calls.find(x=>x.method==='wallet_addEthereumChain')!.params![0] as {rpcUrls:string[]};
 assert.deepEqual(network.rpcUrls,['https://rpc.testnet-chain.genlayer.com']);
 assert.equal(calls.at(-1)!.method,'eth_chainId');
});
test('a wallet that ignores switching or changes accounts cannot submit',async()=>{
 const stuck:Provider={request:async({method})=>method==='eth_accounts'?[account]:method==='eth_chainId'?'0x1':null};
 await assert.rejects(switchToBradbury(stuck,account),/Switch your selected wallet/);
 await assert.rejects(switchToBradbury(wallet('Rabby','0xother').provider,account),/account changed/);
});
test('lost wallet responses stay uncertain; rejection and returned hashes are distinct',()=>{
 assert.match(submissionMessage({code:-32603,message:'sequencer.private.internal'},true),/uncertain/);
 assert.doesNotMatch(submissionMessage({code:-32603,message:'sequencer.private.internal'},true),/sequencer/);
 assert.match(submissionMessage({cause:{code:4001}},true),/declined/);
 assert.match(submissionMessage({code:4001},true,'0xhash'),/do not submit again/);
});
test('accepted is only a verdict with successful execution and remains provisional',()=>{
 assert.equal(lifecycle('ACCEPTED','UNKNOWN','AGREE'),'processing');
 assert.equal(lifecycle('ACCEPTED','ERROR','AGREE'),'execution_failed');
 assert.equal(lifecycle('ACCEPTED','SUCCESS','AGREE'),'accepted');
 assert.equal(lifecycle('FINALIZED','ERROR','AGREE'),'execution_failed');
 assert.equal(lifecycle('FINALIZED','SUCCESS','AGREE'),'finalized');
 assert.equal(lifecycle('UNDETERMINED','SUCCESS','DISAGREE'),'undetermined');
});
test('finalized rejected consensus never becomes a fact-check verdict',()=>{
 for(const result of ['DISAGREE','MAJORITY_DISAGREE','NO_MAJORITY','TIMEOUT','DETERMINISTIC_VIOLATION'])assert.equal(lifecycle('FINALIZED','SUCCESS',result),'finalized_no_consensus');
 assert.equal(lifecycle('FINALIZED','SUCCESS','MAJORITY_AGREE'),'finalized');
 assert.equal(lifecycle('FINALIZED','SUCCESS'),'processing');
 assert.equal(lifecycle('ACCEPTED','SUCCESS'),'processing');
});
test('source validation blocks local, credentialed and non-HTTPS fetch targets',()=>{
 for(const source of ['http://www.nasa.gov','https://127.0.0.1','https://x.localhost','https://metadata.google.internal','https://user:pass@www.nasa.gov','https://www.nasa.gov:8080'])assert.throws(()=>safeSource(source));
 assert.equal(safeSource('https://www.nasa.gov/path#fragment'),'https://www.nasa.gov/path');
 assert.throws(()=>validateClaim('a'.repeat(601),''));
 assert.doesNotThrow(()=>validateClaim('a'.repeat(601),'https://www.nasa.gov/'));
});
