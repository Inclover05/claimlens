"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Wallet } from 'lucide-react';
import { toHex } from 'viem';
import { api } from '@/lib/client-api';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { restoreWallet, switchToBradbury, WALLET_STORAGE_KEY, type Provider, type WalletChoice } from '@/lib/wallet';
export type { Provider } from '@/lib/wallet';
type User={address:string;username:string|null};
type ContextValue={user:User|null;provider:Provider|null;openWallet:()=>void;signOut:()=>Promise<void>;ensureChain:()=>Promise<void>};
const Context=createContext<ContextValue|null>(null);
export function useWallet(){const context=useContext(Context);if(!context)throw new Error('Wallet context missing');return context;}
export default function WalletContext({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null);const [choices,setChoices]=useState<WalletChoice[]>([]);const [selected,setSelected]=useState<WalletChoice|null>(null);const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [username,setUsername]=useState('');
 useEffect(()=>{let active=true;api<{user:User|null}>('auth/me').then(x=>{if(active)setUser(x.user);}).catch(()=>{});
  const announce=(event:Event)=>{const detail=(event as CustomEvent<WalletChoice>).detail;if(detail?.provider&&detail.info?.uuid)setChoices(current=>current.some(x=>x.info.uuid===detail.info.uuid)?current:[...current,detail]);};
  window.addEventListener('eip6963:announceProvider',announce);window.dispatchEvent(new Event('eip6963:requestProvider'));
  const timer=setTimeout(()=>{const ethereum=(window as unknown as {ethereum?:Provider}).ethereum;if(ethereum)setChoices(current=>current.length?current:[{info:{uuid:'injected',name:'Browser wallet',rdns:'injected',icon:''},provider:ethereum}]);},400);
  return()=>{active=false;clearTimeout(timer);window.removeEventListener('eip6963:announceProvider',announce);};
 },[]);
 const signOut=useCallback(async()=>{await api('auth/logout',{});setUser(null);setSelected(null);try{sessionStorage.removeItem(WALLET_STORAGE_KEY);}catch{}},[]);
 useEffect(()=>{if(!selected)return;const changed=(accounts:unknown)=>{if(!Array.isArray(accounts)||typeof accounts[0]!=='string'||accounts[0].toLowerCase()!==user?.address.toLowerCase())void signOut().catch(()=>setError('Your wallet account changed. Sign in again.'));};selected.provider.on?.('accountsChanged',changed);return()=>selected.provider.removeListener?.('accountsChanged',changed);},[selected,signOut,user?.address]);
 useEffect(()=>{
  if(!user||selected)return;
  let active=true;let rdns='';try{rdns=sessionStorage.getItem(WALLET_STORAGE_KEY)||'';}catch{}
  if(rdns)void restoreWallet(choices,rdns,user.address).then(choice=>{if(active&&choice)setSelected(choice);});
  return()=>{active=false;};
 },[user,choices,selected]);
 async function connect(choice:WalletChoice){setBusy(true);setError('');try{const accounts=await choice.provider.request({method:'eth_requestAccounts'}) as string[];const address=accounts[0];if(!address)throw new Error('Select an account in your wallet.');const challenge=await api<{id:string;message:string}>('auth/nonce',{address});const signature=await choice.provider.request({method:'personal_sign',params:[toHex(challenge.message),address]});const result=await api<{user:User}>('auth/verify',{id:challenge.id,signature});setSelected(choice);setUser(result.user);try{sessionStorage.setItem(WALLET_STORAGE_KEY,choice.info.rdns);}catch{}if(result.user.username)setOpen(false);}catch(e){setError(e instanceof Error?e.message:'Wallet sign-in was not completed.');}finally{setBusy(false);}}
 async function ensureChain(){if(!selected||!user)throw new Error('Reconnect your wallet to submit this check.');await switchToBradbury(selected.provider,user.address);}
 async function saveProfile(){setBusy(true);setError('');try{const result=await api<{user:User}>('profile',{username});setUser(result.user);setOpen(false);}catch(e){setError(e instanceof Error?e.message:'Could not save username.');}finally{setBusy(false);}}
 return <Context.Provider value={{user,provider:selected?.provider||null,openWallet:()=>{setError('');setOpen(true);},signOut,ensureChain}}>{children}<Dialog open={open} onOpenChange={setOpen}><DialogContent className="wallet-dialog"><DialogTitle>{user&&!user.username?'Make it yours':user?'Your profile':'Connect your wallet'}</DialogTitle><DialogDescription>{user?'Your profile is remembered for this wallet.':'Choose a wallet and sign in. The sign-in signature does not authorize a payment.'}</DialogDescription>{user?<><div className="account-address">{user.address}</div>{!selected&&<><p className="fine-print">Reconnect the wallet you want to use for this check.</p><div className="wallet-choices">{choices.map(choice=><button key={choice.info.uuid} disabled={busy} onClick={()=>void connect(choice)}><Wallet size={20}/><span>{choice.info.name}</span></button>)}</div>{!choices.length&&<p className="fine-print">Open this site in a wallet-enabled browser to reconnect.</p>}</>}<label htmlFor="username">Username</label><input id="username" className="plain-input" placeholder={user.username||'your_username'} value={username} onChange={e=>setUsername(e.target.value)} maxLength={24}/><button className="primary-button" onClick={saveProfile} disabled={busy||!username}>Save username</button><a href="/dashboard">View my checks →</a><button className="text-button" onClick={()=>void signOut().then(()=>setOpen(false))}>Sign out</button></>:<><div className="wallet-choices">{choices.map(choice=><button key={choice.info.uuid} disabled={busy} onClick={()=>void connect(choice)}><Wallet size={20}/><span>{choice.info.name}</span><span>↗</span></button>)}</div>{!choices.length&&<p>No browser wallet found. Open this site in a wallet-enabled browser.</p>}<p className="fine-print">Guests can explore public checks. Submissions require a wallet and Bradbury GEN for fees.</p></>}{busy&&<p role="status">Waiting for your wallet…</p>}{error&&<p className="error-message" role="alert">{error}</p>}</DialogContent></Dialog></Context.Provider>;
}



