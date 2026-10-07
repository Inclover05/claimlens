import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createPublicClient,formatEther,http} from 'viem';
const client=createPublicClient({transport:http('https://rpc.testnet-chain.genlayer.com',{timeout:15000,retryCount:0})});
assert.equal(await client.getChainId(),4221);
const wallet='0xfA47B90A45F11e1B8E5f1FeFCC8f248C6ddbcdf1';
const known=[['initial-deployment','0x8d825baead1b57c0e3a7822c23579feaa667848a3b5c25445f00baf79fb5360b'],['initial-source-test','0x5ab0989bc538f65ed8d499070766d9c9a71cc5eb02be67212319c1ce8ec0e92a'],['corrected-deployment','0xbdea7397027c94121aafabbb14084c34e970ef417c123e46795486c7dddc0683'],['supported','0xb8b8e31dcabb13067c3a4ced3d07ab05edf629d1378e78ca9897c88bbaa7bb1a'],['irrelevant-evidence-first-attempt','0x57facbf672313a34ee5b8f546b6a3133d84d82137148d77afae4ac40e7bcfeb0']];
for(const file of await readdir('.claimlens-wallet')){
 if(!/^(?:live-checks-.+|deployment(?:-[a-z-]+)?|0x[0-9a-f]{64}\.(?:finalization|idleness|process-idleness|appeal))\.json$/.test(file))continue;
 const data=JSON.parse(await readFile('.claimlens-wallet/'+file,'utf8'));
 const entries=file.startsWith('live-checks-')?Object.entries(data):[[file.replace('.json',''),data]];
 for(const [name,item] of entries)if(item.evmHash&&!known.some(([,hash])=>hash.toLowerCase()===item.evmHash.toLowerCase()))known.push([name,item.evmHash]);
}
const transactions=await Promise.all(known.map(async([purpose,hash])=>{const [tx,receipt]=await Promise.all([client.getTransaction({hash}),client.getTransactionReceipt({hash})]);assert.equal(tx.from.toLowerCase(),wallet.toLowerCase());assert.equal(tx.value,0n);return {purpose,hash,status:receipt.status,gasUsed:receipt.gasUsed.toString(),gasPriceWei:receipt.effectiveGasPrice.toString(),feeGEN:formatEther(receipt.gasUsed*receipt.effectiveGasPrice)};}));
const total=transactions.reduce((sum,tx)=>sum+BigInt(tx.gasUsed)*BigInt(tx.gasPriceWei),0n);
const balance=await client.getBalance({address:wallet});
assert.equal(total+balance,5000000000000000000n);
const report={checkedAt:new Date().toISOString(),network:'Bradbury testnet',chainId:4221,wallet,initialFundingGEN:'5',balanceGEN:formatEther(balance),measuredEVMFeesGEN:formatEther(total),transactions,scope:'Actual EVM receipt fees for this dedicated wallet; test GEN only. Fee quotes are upper bounds and are not measured costs. The contract and its caller transactions sent zero additional value.'};
await writeFile('reports/test-wallet-costs.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({balanceGEN:report.balanceGEN,measuredEVMFeesGEN:report.measuredEVMFeesGEN,transactions:transactions.length}));
