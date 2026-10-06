export async function api<T=Record<string,unknown>>(path:string,data?:unknown):Promise<T>{
 const response=await fetch(`/api/${path}`,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),cache:'no-store'});
 const value=await response.json() as {error?:string}&T;if(!response.ok)throw new Error(value.error||'This action could not be completed.');return value;
}
