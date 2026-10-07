"use client";
import {useState} from 'react';
import {api} from '@/lib/client-api';
import {useWallet} from './wallet-context';
import {walletErrorCode} from '@/lib/wallet';
type AppealQuote={from:string;to:string;data:string;value:string;gas:string;gasPrice:string;chainId:string;feeGen:number;bondGen:number;expiresAt:number;genHash:string};
export default function AppealControl({id,onUpdate}:{id:string;onUpdate:()=>Promise<void>}){
 const {provider,ensureChain}=useWallet();const [quote,setQuote]=useState<AppealQuote|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [consent,setConsent]=useState(false);const [hash,setHash]=useState('');const [uncertain,setUncertain]=useState(false);
 const key=`claimlens-appeal:${id}`;
 async function estimate(){
  setBusy(true);setError('');
  try{const saved=localStorage.getItem(key);if(saved){setUncertain(true);if(saved!=='uncertain')setHash(saved);return;}await ensureChain();setQuote((await api<{transaction:AppealQuote}>(`checks/${id}/appeal`,{})).transaction);}
  catch(e){setError(e instanceof Error?e.message:'Appeal quote unavailable.');}finally{setBusy(false);}
 }
 async function appeal(){
  if(!quote||!provider||busy||!consent)return;
  if(quote.expiresAt<=Date.now()/1000){setQuote(null);setError('This appeal quote expired. Request a fresh quote.');return;}
  setBusy(true);setError('');let attempted=false;
  try{
   if(localStorage.getItem(key))throw new Error('A previous appeal request is recorded. Inspect wallet activity before continuing.');
   await ensureChain();
   // Persist uncertainty before invoking the provider. An API or wallet timeout
   // must never cause this component to submit another paid appeal automatically.
   localStorage.setItem(key,'uncertain');attempted=true;
   const {feeGen,bondGen,expiresAt,genHash,...transaction}=quote;void feeGen;void bondGen;void expiresAt;void genHash;
   const value=await provider.request({method:'eth_sendTransaction',params:[transaction]});
   if(typeof value!=='string'||!/^0x[0-9a-f]{64}$/i.test(value))throw new Error('Wallet returned no transaction hash.');
   localStorage.setItem(key,value);setHash(value);setUncertain(true);setQuote(null);await onUpdate();
  }catch(e){if(attempted&&walletErrorCode(e)===4001){localStorage.removeItem(key);setError('You declined the appeal request.');}else{setUncertain(attempted);setError(attempted?'The appeal outcome is uncertain. Inspect wallet activity; this page will not resend it.':e instanceof Error?e.message:'Appeal unavailable.');}}
  finally{setBusy(false);}
 }
 return <div className="context-note"><h3 className="small-heading">Challenge this provisional decision</h3><p>An appeal asks GenLayer to reconsider the decision before finality. It requires a separate GEN bond and network fee. The bond can be lost if the appeal fails.</p>{uncertain?<p>Check wallet activity and refresh the record. {hash&&<a href={`https://explorer.testnet-chain.genlayer.com/tx/${hash}`} target="_blank" rel="noopener noreferrer">View appeal transaction ↗</a>}</p>:quote?<><p>Appeal bond: {quote.bondGen.toFixed(6)} GEN<br/>Estimated network fee: {quote.feeGen.toFixed(6)} GEN</p><label className="privacy-ack"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I understand the appeal bond is at risk.</label><button className="secondary-button" disabled={busy||!consent} onClick={()=>void appeal()}>{busy?'Waiting for wallet…':'Submit appeal'}</button></>:<button className="text-button" disabled={busy} onClick={()=>void estimate()}>{busy?'Checking appeal eligibility…':'Review appeal cost'}</button>}{error&&<p className="error-message" role="status">{error}</p>}</div>;
}
