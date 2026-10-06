import { safeSource } from './domain';
import { runtime } from './server';
// Discovery supplies candidate URLs only. Validators fetch and judge their contents.
export async function discover(claim:string,source:string):Promise<{urls:string[];limited:boolean}> {
 const urls=source ? [source] : [];
 const key=runtime().BRAVE_SEARCH_API_KEY;
 try {
  if(key){
   const res=await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(claim.slice(0,350))}&count=5`,{headers:{'X-Subscription-Token':key,'Accept':'application/json'},signal:AbortSignal.timeout(8000)});
   if(!res.ok)throw new Error('Discovery unavailable');
   const data=await res.json() as {web?:{results:{url:string}[]}};
   for(const item of data.web?.results||[]){try{urls.push(safeSource(item.url));}catch{}}
   return {urls:[...new Set(urls)].slice(0,4),limited:false};
  }
  const res=await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(claim.slice(0,350))}&srlimit=3`,{headers:{'User-Agent':'ClaimLens/0.1 (GenLayer evidence discovery)'},signal:AbortSignal.timeout(8000)});
  if(res.ok){const data=await res.json() as {query?:{search:{title:string}[]}};for(const item of data.query?.search||[])urls.push(`https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replaceAll(' ','_'))}`);}
 }catch{/* A failed search cannot become a factual verdict. */}
 return {urls:[...new Set(urls)].slice(0,4),limited:true};
}
