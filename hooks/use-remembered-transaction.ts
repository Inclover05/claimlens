"use client";
import { useCallback, useSyncExternalStore } from 'react';
const subscribe=(listener:()=>void)=>{window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener);};
const serverSnapshot=()=>'';
export function useRememberedTransaction(id:string){
 const snapshot=useCallback(()=>{try{return localStorage.getItem(`claimlens-tx:${id}`)||'';}catch{return '';}},[id]);
 return useSyncExternalStore(subscribe,snapshot,serverSnapshot);
}
