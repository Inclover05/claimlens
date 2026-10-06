import { runtime, usesVercelProxy } from './runtime';
import { publicRequestUrl, isSameOrigin } from './request-origin';
export { runtime } from './runtime';
import { verifyMessage, isAddress } from 'viem';
export function db() { const value=runtime().DB; if(!value)throw new Error('Saved checks are temporarily unavailable.');return value; }
export async function digest(value:string) { const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join(''); }
export const now = () => Math.floor(Date.now()/1000);
export async function identity(req:Request):Promise<{address:string;username:string|null}|null> {
 const token=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('cl_session='))?.slice(11);
 if(!token)return null;
 return db().prepare('SELECT users.address, users.username FROM sessions JOIN users ON users.address = sessions.address WHERE sessions.hash = ? AND sessions.expires_at > ?').bind(await digest(token),now()).first();
}
export async function requireUser(req:Request) { const user=await identity(req);if(!user)throw new HttpError(401,'Sign in with your wallet to continue.');return user; }
export class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
export function requestUrl(req:Request) { return publicRequestUrl(req, usesVercelProxy()); }
export function sameOrigin(req:Request) {if(!isSameOrigin(req, usesVercelProxy()))throw new HttpError(403,'Request origin is not allowed.');}
export async function body(req:Request) {const text=await req.text();if(text.length>14000)throw new HttpError(413,'Submission is too large.');return JSON.parse(text) as Record<string,unknown>;}
export async function rate(key:string,max:number,window=3600){const k=`${key}:${Math.floor(now()/window)}`;const row=await db().prepare('INSERT INTO limits (key,count) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count = limits.count + 1 RETURNING count').bind(k).first<{count:number}>();if(!row||row.count>max)throw new HttpError(429,'Please wait before trying again.');}
export function json(value:unknown,status=200,headers:Record<string,string>={}){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
export async function authenticate(address:string,message:string,signature:string) {if(!isAddress(address)||!/^0x[0-9a-f]+$/i.test(signature))return false;return verifyMessage({address:address as `0x${string}`,message,signature:signature as `0x${string}`});}



export function clientIp(req:Request) { return usesVercelProxy() ? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown' : req.headers.get('cf-connecting-ip') || 'local'; }
