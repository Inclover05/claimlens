import { abi, createClient } from 'genlayer-js';
import type { Hash } from 'genlayer-js/types';
import { testnetBradbury } from 'genlayer-js/chains';
import { createPublicClient, http, encodeFunctionData, parseEventLogs, toHex, fromHex, type Hex } from 'viem';
import { db, now, HttpError } from './server';
import { lifecycle, VERDICTS, type SavedCheck, type CheckResult } from './domain';
import { executionErrorMessage, isExecutionErrorMessage } from './execution-errors';
export const EVM_RPC='https://rpc.testnet-chain.genlayer.com';
export const GEN_RPC='https://rpc-bradbury.genlayer.com';
export const evmChain={...testnetBradbury,rpcUrls:{default:{http:[EVM_RPC]}}};
const publicClient=createPublicClient({chain:evmChain,transport:http(EVM_RPC,{retryCount:0,timeout:10000})});
const lifecycleClient=createClient({chain:{...testnetBradbury,rpcUrls:{default:{http:[GEN_RPC]}}}});
const consensus=testnetBradbury.consensusMainContract!;
export async function genRpc(method:string,params:unknown[]) {
 const response=await fetch(GEN_RPC,{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0 ClaimLens/0.1','Referer':'https://genlayer.com/'},body:JSON.stringify({jsonrpc:'2.0',id:Date.now(),method,params}),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new HttpError(503,'GenLayer is temporarily unavailable. Your saved check is safe.');
 const data=await response.json() as {result:unknown;error?:{message:string}};
 if(data.error)throw new HttpError(503,'GenLayer could not complete this read. Try again shortly.');return data.result;
}
export function writeData(owner:Hex,contract:Hex,payload:string) {
 const encoded=abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject('check_claim',[payload],undefined)),false]);
 return encodeFunctionData({abi:consensus.abi,functionName:'addTransaction',args:[owner,contract,5n,3n,encoded,BigInt(now()+3600)]});
}
export async function quote(check:SavedCheck) {
 const data=writeData(check.owner as Hex,check.contract as Hex,check.payload!);
 const [gas,price,balance]=await Promise.all([publicClient.estimateGas({account:check.owner as Hex,to:consensus.address,data,value:0n}),publicClient.getGasPrice(),publicClient.getBalance({address:check.owner as Hex})]);
 const gasLimit=gas*120n/100n;
 if(balance<gasLimit*price)throw new HttpError(402,'Your wallet needs Bradbury GEN for the network fee.');
 return {from:check.owner,to:consensus.address,data,value:'0x0',gas:toHex(gasLimit),chainId:'0x107d',gasPrice:toHex(price),feeGen:Number(gasLimit*price)/1e18,expiresAt:now()+300,inputHash:check.input_hash};
}
export async function quoteAppeal(check:SavedCheck) {
 if(!check.gen_hash)throw new HttpError(409,'This check has no GenLayer decision to appeal.');
 const transaction=await lifecycleClient.getTransaction({hash:check.gen_hash as Hash});
 if(transaction.statusName!=='ACCEPTED')throw new HttpError(409,'An appeal is available only while a decision is accepted and has not finalized. Refresh the status.');
 // Bradbury's pinned 1.1.8 deployment uses submitAppeal and an authoritative
 // minimum bond. Consensus v0.6 uses a different operation and fee policy.
 const bond=await lifecycleClient.getMinAppealBond({txId:check.gen_hash as Hex});
 const data=encodeFunctionData({abi:consensus.abi,functionName:'submitAppeal',args:[check.gen_hash as Hex]});
 const [gas,price,balance]=await Promise.all([publicClient.estimateGas({account:check.owner as Hex,to:consensus.address,data,value:bond}),publicClient.getGasPrice(),publicClient.getBalance({address:check.owner as Hex})]);
 const gasLimit=gas*120n/100n;
 if(balance<bond+gasLimit*price)throw new HttpError(402,'Your wallet needs enough Bradbury GEN for the appeal bond and network fee.');
 return {from:check.owner,to:consensus.address,data,value:toHex(bond),gas:toHex(gasLimit),gasPrice:toHex(price),chainId:'0x107d',feeGen:Number(gasLimit*price)/1e18,bondGen:Number(bond)/1e18,expiresAt:now()+60,genHash:check.gen_hash};
}
const createdABI=[{anonymous:false,type:'event',name:'CreatedTransaction',inputs:[{indexed:true,name:'txId',type:'bytes32'},{indexed:false,name:'txSlot',type:'uint256'}]}] as const;
async function readResult(check:SavedCheck,final:boolean):Promise<CheckResult> {
 const data=abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject('get_check',[check.owner,check.id],undefined)),false]);
 const raw=await genRpc('gen_call',[{type:'read',to:check.contract,from:check.owner,data,transaction_hash_variant:final?'latest-final':'latest-nonfinal'}]) as string|{data:string;status?:{code:number}};
 if(typeof raw!=='string' && raw.status && raw.status.code!==0)throw new Error('Contract read failed');
 const hex=typeof raw==='string'?raw:raw.data;
 const decoded=abi.calldata.decode(fromHex((hex.startsWith('0x')?hex:`0x${hex}`) as Hex,'bytes'));
 const value=JSON.parse(String(decoded)) as CheckResult;
 if(value.input_hash!==check.input_hash || value.owner.toLowerCase()!==check.owner || value.policy!=='claimlens-evidence-v1' || !VERDICTS.includes(value.verdict))throw new Error('Result provenance did not match this check.');
 return value;
}
export async function reconcile(check:SavedCheck):Promise<SavedCheck> {
 if(!check.evm_hash)return check;
 try {
  let genHash=check.gen_hash;
  if(!genHash){
   const [transaction,receipt]=await Promise.all([publicClient.getTransaction({hash:check.evm_hash as Hex}),publicClient.getTransactionReceipt({hash:check.evm_hash as Hex})]);
   if(transaction.from.toLowerCase()!==check.owner || transaction.to?.toLowerCase()!==consensus.address.toLowerCase())throw new Error('Transaction sender or destination does not match.');
   // Verify exact contract payload from the EVM input, allowing only the signed validity timestamp to vary.
   const { decodeFunctionData }=await import('viem');
   const call=decodeFunctionData({abi:consensus.abi,data:transaction.input});
   const expected=abi.transactions.serialize([abi.calldata.encode(abi.calldata.makeCalldataObject('check_claim',[check.payload!],undefined)),false]);
   if(call.functionName!=='addTransaction'||!call.args||String(call.args[0]).toLowerCase()!==check.owner||String(call.args[1]).toLowerCase()!==check.contract.toLowerCase()||String(call.args[2])!=='5'||String(call.args[3])!=='3'||String(call.args[4])!==expected)throw new Error('Transaction input does not match this claim.');
   if(receipt.status==='reverted') {await db().prepare('UPDATE checks SET state = ?, error = ?, updated_at = ? WHERE id = ?').bind('execution_failed','The wallet transaction reverted before GenLayer execution.',now(),check.id).run();return {...check,state:'execution_failed'};}
   const logs=receipt.logs.filter(log=>log.address.toLowerCase()===consensus.address.toLowerCase());
   const events=parseEventLogs({abi:consensus.abi,eventName:'NewTransaction',logs}) as unknown as {args:{txId:Hex}}[];
   const fallback=parseEventLogs({abi:createdABI,eventName:'CreatedTransaction',logs});
   genHash=events[0]?.args.txId||fallback[0]?.args.txId;
   if(!genHash)throw new Error('Wallet transaction confirmed but its GenLayer ID is not available yet.');
   await db().prepare('UPDATE checks SET gen_hash = ?, state = ?, updated_at = ? WHERE id = ?').bind(genHash,'pending',now(),check.id).run();
  }
  const transaction=await lifecycleClient.getTransaction({hash:genHash as Hash});
  const execution=transaction.txExecutionResultName==='FINISHED_WITH_RETURN'?'SUCCESS':transaction.txExecutionResultName==='FINISHED_WITH_ERROR'?'ERROR':'UNKNOWN';
  const state=lifecycle(String(transaction.statusName||''),execution,String(transaction.resultName||'UNKNOWN'));
  let result:string|null=null; let verdict:string|null=null;
  if(['accepted','finalized'].includes(state)) {const value=await readResult({...check,gen_hash:genHash},state==='finalized');result=JSON.stringify(value);verdict=value.verdict;}
  let error:string|null=null;
  if(execution==='ERROR'&&['execution_failed','undetermined','finalized_no_consensus'].includes(state)){
   error=isExecutionErrorMessage(check.error)?check.error!:executionErrorMessage();
   if(!isExecutionErrorMessage(check.error)){
    try{
     const trace=await genRpc('gen_dbg_traceTransaction',[{txID:genHash,round:Number(transaction.lastRound?.round||0)}]) as {return_data?:string};
     if(trace.return_data&&/^0x[0-9a-f]+$/i.test(trace.return_data)&&trace.return_data.length<65536){
      const decoded=abi.calldata.decode(fromHex(trace.return_data as Hex,'bytes'));
      const detail=decoded instanceof Map?Object.fromEntries(decoded):decoded as {kind?:string;data?:unknown};
      if(detail&&typeof detail==='object'&&'kind' in detail&&detail.kind==='UserError'&&'data' in detail)error=executionErrorMessage(detail.data);
     }
    }catch{/* Trace availability must not change transaction state or trigger a resend. */}
   }
  }
  await db().prepare('UPDATE checks SET state = ?, result = ?, verdict = ?, gen_hash = ?, error = ?, updated_at = ? WHERE id = ?').bind(state,result,verdict,genHash,error,now(),check.id).run();
  return {...check,gen_hash:genHash,state,result:result||undefined,verdict:verdict||undefined,error:error||undefined};
 }catch(error){
  // No automatic rebroadcast: a timeout may still have submitted a transaction.
  console.error('ClaimLens tracking failed',error instanceof Error?error.message:'unknown');
  return {...check,error:'Transaction tracking is temporarily unavailable. Your saved transaction will not be resent. Refresh the status shortly.'};
 }
}


