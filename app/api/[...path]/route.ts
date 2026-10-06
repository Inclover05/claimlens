import { isAddress } from 'viem';
import { authenticate, body, clientIp, db, digest, HttpError, identity, json, now, rate, requireUser, requestUrl, runtime, sameOrigin } from '@/lib/server';
import { discover } from '@/lib/discovery';
import { POLICY, safeSource, validateClaim, type SavedCheck } from '@/lib/domain';
import { quote, reconcile } from '@/lib/chain';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
const string=(value:unknown)=>typeof value==='string'?value:'';
async function handler(req:Request,ctx:Context){
 try {
  const {path}=await ctx.params;const route=path.join('/');const url=requestUrl(req);
  if(req.method==='GET'){
   if(route==='config')return json({chainId:4221,contract:runtime().GENLAYER_CONTRACT||null,searchEnabled:!!runtime().BRAVE_SEARCH_API_KEY,policy:POLICY});
   if(route==='auth/me')return json({user:await identity(req)});
   if(route==='checks'){
    const mine=url.searchParams.get('mine')==='true';const user=mine?await requireUser(req):null;
    const topic=url.searchParams.get('topic')||'All topics';const q=(url.searchParams.get('q')||'').slice(0,200);
    const rows=await db().prepare(`SELECT id,owner,claim,source,visibility,topic,created_at,state,evm_hash,gen_hash,input_hash,contract,verdict,result FROM checks WHERE ${mine?'owner = ?':"visibility = 'public'"} AND (? = 'All topics' OR topic = ?) AND claim LIKE ? ORDER BY created_at DESC LIMIT 50`).bind(...(mine?[user!.address]:[]),topic,topic,`%${q}%`).all();
    return json({checks:rows.results});
   }
   if(path[0]==='checks'&&path.length===2){
    let check=await db().prepare('SELECT * FROM checks WHERE id = ?').bind(path[1]).first<SavedCheck>();
    const user=await identity(req);
    if(!check||check.visibility==='private'&&check.owner!==user?.address)throw new HttpError(404,'This check is unavailable.');
    if(check.evm_hash&&now()-(check as unknown as {updated_at:number}).updated_at>10)check=await reconcile(check);
    if(check.owner!==user?.address)delete check.payload;
    return json({check});
   }
  }
  if(req.method==='POST'){
   sameOrigin(req);const data=await body(req);
   if(route==='auth/nonce'){
    const address=string(data.address).toLowerCase();if(!isAddress(address))throw new HttpError(400,'Choose a valid wallet account.');
    await rate(`nonce:${clientIp(req)}`,40,600);
    const id=crypto.randomUUID();const expiry=now()+300;
    const message=`${url.host} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to ClaimLens. This signature does not authorize a payment.\n\nURI: ${url.origin}\nVersion: 1\nChain ID: 4221\nNonce: ${id.replaceAll('-','')}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(expiry*1000).toISOString()}`;
    await db().prepare('INSERT INTO challenges (id,address,message,expires_at,consumed) VALUES (?,?,?,?,0)').bind(id,address,message,expiry).run();return json({id,message});
   }
   if(route==='auth/verify'){
    await rate(`verify:${clientIp(req)}`,80,600);
    const challenge=await db().prepare('SELECT * FROM challenges WHERE id = ? AND expires_at > ? AND consumed = 0').bind(string(data.id),now()).first<{id:string;address:string;message:string}>();
    if(!challenge||!await authenticate(challenge.address,challenge.message,string(data.signature)))throw new HttpError(401,'Signature was invalid or expired. Sign in again.');
    const consumed=await db().prepare('UPDATE challenges SET consumed = 1 WHERE id = ? AND consumed = 0 RETURNING id').bind(challenge.id).first();if(!consumed)throw new HttpError(401,'This sign-in request has already been used.');
    const token=crypto.randomUUID()+crypto.randomUUID();
    await db().batch([db().prepare('INSERT INTO users (address,created_at) VALUES (?,?) ON CONFLICT(address) DO NOTHING').bind(challenge.address,now()),db().prepare('INSERT INTO sessions (hash,address,expires_at) VALUES (?,?,?)').bind(await digest(token),challenge.address,now()+86400)]);
    const user=await db().prepare('SELECT address,username FROM users WHERE address = ?').bind(challenge.address).first();
    return json({user},200,{'Set-Cookie':`cl_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${url.protocol==='https:'?'; Secure':''}`});
   }
   if(route==='auth/logout'){
    const token=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('cl_session='))?.slice(11);
    if(token)await db().prepare('DELETE FROM sessions WHERE hash = ?').bind(await digest(token)).run();
    return json({ok:true},200,{'Set-Cookie':'cl_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
   }
   const user=await requireUser(req);
   if(route==='profile'){
    const username=string(data.username).toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username))throw new HttpError(400,'Choose 3–24 letters, numbers, or underscores.');
    const duplicate=await db().prepare('SELECT address FROM users WHERE username = ? AND address != ?').bind(username,user.address).first();if(duplicate)throw new HttpError(409,'That username is already taken.');
    await db().prepare('UPDATE users SET username = ? WHERE address = ?').bind(username,user.address).run();return json({user:{...user,username}});
   }
   if(route==='checks'){
    if(!user.username)throw new HttpError(400,'Choose your username before saving your first claim.');
    await rate(`check:${user.address}`,20);
    const claim=string(data.claim).trim();const source=safeSource(string(data.source).trim());validateClaim(claim,source);
    const visibility=data.visibility==='private'?'private':'public';const topic=string(data.topic);if(!['Politics','Football','Science','World','General'].includes(topic))throw new HttpError(400,'Select a topic.');
    const discovery=await discover(claim,source);const id=crypto.randomUUID();const contract=runtime().GENLAYER_CONTRACT||'';
    const payload=JSON.stringify({schema:1,policy:POLICY,id,owner:user.address,claim,source,source_urls:discovery.urls,as_of:new Date().toISOString().slice(0,10)});
    const inputHash=await digest(payload);
    await db().prepare('INSERT INTO checks (id,owner,claim,source,visibility,topic,payload,input_hash,contract,created_at,state,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,user.address,claim,source,visibility,topic,payload,inputHash,contract,now(),'draft',now()).run();
    return json({id,limitedDiscovery:discovery.limited,sourceCount:discovery.urls.length},201);
   }
   if(path[0]==='checks'&&path.length===3){
    const check=await db().prepare('SELECT * FROM checks WHERE id = ? AND owner = ?').bind(path[1],user.address).first<SavedCheck>();if(!check)throw new HttpError(404,'This check is unavailable.');
    if(path[2]==='visibility'){
     const visibility=data.visibility==='private'?'private':'public';await db().prepare('UPDATE checks SET visibility = ?, updated_at = ? WHERE id = ?').bind(visibility,now(),check.id).run();return json({ok:true});
    }
    if(path[2]==='prepare'){
     if(!check.contract||!isAddress(check.contract))throw new HttpError(503,'The Bradbury contract is awaiting deployment. Your draft is saved.');
     if(check.state!=='draft')throw new HttpError(409,'This check already has a transaction attempt. Resolve it before trying again.');
     if(!JSON.parse(check.payload!).source_urls.length)throw new HttpError(400,'Evidence discovery found no sources. Create a new check with an accessible source link.');
     const transaction=await quote(check);return json({transaction});
    }
    if(path[2]==='attempt'){
     const result=await db().prepare("UPDATE checks SET state = 'awaiting_wallet', updated_at = ? WHERE id = ? AND state = 'draft' RETURNING id").bind(now(),check.id).first();if(!result)throw new HttpError(409,'A wallet attempt is already in progress.');return json({ok:true});
    }
    if(path[2]==='rejected'){
     if(check.evm_hash)throw new HttpError(409,'A transaction was already broadcast.');
     await db().prepare("UPDATE checks SET state = 'draft', updated_at = ? WHERE id = ? AND state = 'awaiting_wallet'").bind(now(),check.id).run();return json({ok:true});
    }
    if(path[2]==='broadcast'){
     const hash=string(data.evmHash);if(!/^0x[0-9a-f]{64}$/i.test(hash))throw new HttpError(400,'Enter a valid wallet transaction hash.');
     if(check.evm_hash){if(check.evm_hash.toLowerCase()!==hash.toLowerCase())throw new HttpError(409,'This check is already linked to another transaction.');return json({ok:true});}
     // A hash alone grants no verdict: reconciliation verifies sender, recipient and payload on-chain.
     await db().prepare("UPDATE checks SET evm_hash = ?, state = 'broadcast', updated_at = ? WHERE id = ?").bind(hash,now(),check.id).run();return json({ok:true});
    }
   }
  }
  throw new HttpError(404,'Not found.');
 }catch(error){const status=error instanceof HttpError?error.status:error instanceof SyntaxError?400:500;console.error('ClaimLens request failed',error instanceof Error?error.message:'unknown');return json({error:status===500?'This action is temporarily unavailable. Your input has been kept.':error instanceof Error?error.message:'Invalid request.'},status);}
}
export const GET=handler;
export const POST=handler;


