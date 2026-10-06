import { safeSource } from './domain.ts';
import { runtime } from './runtime.ts';
import { discoveryQueries } from './discovery-queries.ts';
function candidates(source:string,groups:string[][]):string[] {
 const urls=source?[source]:[];
 // Reserve the first rank for each query before considering more results.
 for(let rank=0;rank<5;rank++)for(const group of groups){
  try {const url=safeSource(group[rank]||'');if(url&&!urls.includes(url))urls.push(url);}catch{}
 }
 return urls.slice(0,4);
}
async function searchAll(queries:string[],search:(query:string)=>Promise<string[]>):Promise<string[][]> {
 const results=await Promise.allSettled(queries.map(search));
 return results.map(result=>result.status==='fulfilled'?result.value:[]);
}
// Discovery supplies candidate URLs only. Validators fetch and judge their contents.
export async function discover(claim:string,source:string):Promise<{urls:string[];limited:boolean}> {
 const queries=discoveryQueries(claim);
 const key=runtime().BRAVE_SEARCH_API_KEY;
 if(key){
  const groups=await searchAll(queries,async query=>{
   const res=await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,{headers:{'X-Subscription-Token':key,'Accept':'application/json'},signal:AbortSignal.timeout(8000)});
   if(!res.ok)throw new Error('Discovery unavailable');
   const data=await res.json() as {web?:{results?:unknown}}|null;
   if(!Array.isArray(data?.web?.results))return [];
   return data.web.results.slice(0,5).filter((item:unknown):item is {url:string}=>!!item&&typeof item==='object'&&'url' in item&&typeof item.url==='string').map((item:{url:string})=>item.url);
  });
  const urls=candidates(source,groups);
  if(urls.some(url=>url!==source))return {urls,limited:groups.some(group=>!group.length)};
  // An unavailable or empty search service must still reach the fallback.
 }
 const groups=await searchAll(queries,async query=>{
  const res=await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3`,{headers:{'User-Agent':'ClaimLens/0.1 (GenLayer evidence discovery)'},signal:AbortSignal.timeout(8000)});
  if(!res.ok)throw new Error('Discovery unavailable');
  const data=await res.json() as {query?:{search?:unknown}}|null;
  if(!Array.isArray(data?.query?.search))return [];
  return data.query.search.slice(0,3).filter((item:unknown):item is {title:string}=>!!item&&typeof item==='object'&&'title' in item&&typeof item.title==='string').map((item:{title:string})=>`https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replaceAll(' ','_'))}`);
 });
 return {urls:candidates(source,groups),limited:true};
}
