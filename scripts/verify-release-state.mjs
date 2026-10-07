// Read-only chain audit. The SDK labels are retained with their version and raw votes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createClient} from 'genlayer-js';
import {testnetBradbury} from 'genlayer-js/chains';
const contract=process.env.CLAIMLENS_CONTRACT;
assert.match(contract||'',/^0x[0-9a-f]{40}$/i);
const client=createClient({chain:{...testnetBradbury,rpcUrls:{default:{http:['https://rpc-bradbury.genlayer.com']}}}});
const ledger=JSON.parse(await readFile(`.claimlens-wallet/live-checks-${contract.toLowerCase()}.json`,'utf8'));
const sourceSha256=createHash('sha256').update(await readFile('contracts/claimlens.py')).digest('hex');
const deployedSha256=createHash('sha256').update(await client.getContractCode(contract)).digest('hex');
assert.equal(deployedSha256,sourceSha256);assert.equal(await client.readContract({address:contract,functionName:'get_policy',args:[]}), 'claimlens-evidence-v1');
const report={checkedAt:new Date().toISOString(),contract,sourceSha256,sourceAndPolicyVerified:true,sdkVersion:'1.1.8',scope:'Read-only current committee receipts and independent contract-state reads. Raw votes are preserved; SDK vote labels alone do not establish root cause.',cases:[]};
for(const [name,saved] of Object.entries(ledger)){
 if(!saved.genHash){report.cases.push({name,id:saved.id,state:saved.state,evmHash:saved.evmHash});continue;}
 const tx=await client.getTransaction({hash:saved.genHash});
 const record={name,id:saved.id,genHash:saved.genHash,evmHash:saved.evmHash,status:tx.statusName,execution:tx.txExecutionResultName,consensus:tx.resultName,rawVotes:tx.lastRound?.validatorVotes?.map(Number),sdkVoteLabels:tx.lastRound?.validatorVotesName};
 const agreed=['AGREE','MAJORITY_AGREE'].includes(tx.resultName)&&tx.txExecutionResultName==='FINISHED_WITH_RETURN'&&['ACCEPTED','FINALIZED'].includes(tx.statusName);
 const text=await client.readContract({address:contract,functionName:'get_check',args:['0xfa47b90a45f11e1b8e5f1fefcc8f248c6ddbcdf1',saved.id],transactionHashVariant:tx.statusName==='FINALIZED'?'latest-final':'latest-nonfinal'});
 record.emptyContractResult=text==='';
 if(agreed){const result=JSON.parse(text);assert.equal(result.input_hash,saved.inputHash);assert.equal(result.owner,'0xfa47b90a45f11e1b8e5f1fefcc8f248c6ddbcdf1');assert.equal(result.policy,'claimlens-evidence-v1');record.verdict=result.verdict;record.provenanceMatched=true;}
 report.cases.push(record);
}
await writeFile(`reports/state-${contract.toLowerCase()}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checkedAt:report.checkedAt,contract,cases:report.cases.map(({name,status,verdict,consensus})=>({name,status,verdict,consensus}))}));
