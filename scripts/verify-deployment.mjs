// Read-only deployment verification. Does not deploy or sign a transaction.
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { isAddress } from 'viem';
const EVM_RPC='https://rpc.testnet-chain.genlayer.com';
const GEN_RPC='https://rpc-bradbury.genlayer.com';
const source=await readFile(new URL('../contracts/claimlens.py',import.meta.url),'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');
const report={checkedAt:new Date().toISOString(),sdkVersion:'1.1.8',network:'Bradbury',chainId:4221,evmRpc:EVM_RPC,genRpc:GEN_RPC,consensusAddress:testnetBradbury.consensusMainContract?.address,policy:'claimlens-evidence-v1',sourceSha256:hash(source),contractAddress:null,checks:[],liveDecisionVerified:false};
async function rpc(endpoint,method,params){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'claimlens-preflight',method,params}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`RPC returned HTTP ${response.status}`);
 const data=await response.json();if(data.error)throw new Error(data.error.message||'RPC error');return data.result;
}
try{
 const chainId=await rpc(EVM_RPC,'eth_chainId',[]);
 if(parseInt(chainId,16)!==4221)throw new Error('EVM RPC is on the wrong chain.');
 report.checks.push('EVM chain ID with a wallet-style string request ID');
 const code=await rpc(EVM_RPC,'eth_getCode',[report.consensusAddress,'latest']);
 if(!code||code==='0x')throw new Error('The pinned SDK consensus address has no code.');
 report.checks.push('Consensus contract exists at the pinned SDK address');
 const address=process.argv[2];
 if(address){
  if(!isAddress(address))throw new Error('Provide a valid deployed contract address.');
  const client=createClient({chain:{...testnetBradbury,rpcUrls:{default:{http:[GEN_RPC]}}}});
  const policy=await client.readContract({address,functionName:'get_policy',args:[]});
  if(policy!==report.policy)throw new Error('The deployed policy does not match ClaimLens.');
  const deployedSource=await client.getContractCode(address);
  if(hash(deployedSource)!==report.sourceSha256)throw new Error('Deployed source differs from the tested contract.');
  report.contractAddress=address;report.checks.push('Policy read and exact deployed source hash');
 }
 report.ok=true;
}catch(error){report.ok=false;report.error=error instanceof Error?error.message:'Verification failed';process.exitCode=1;}
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await writeFile(new URL('../reports/deployment-preflight.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
