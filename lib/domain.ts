export const POLICY = 'claimlens-evidence-v1';
export const VERDICTS = ['Supported','Contradicted','Misleading','Insufficient evidence','Not a factual claim'] as const;
export type Verdict = typeof VERDICTS[number];
export type Evidence = { url:string; title:string; quote:string; relation:'supports'|'contradicts'|'context'; };
export type CheckResult = { verdict:Verdict; explanation:string; caveats:string; evidence:Evidence[]; as_of:string; input_hash:string; policy:string; owner:string; };
export type SavedCheck = {id:string; claim:string; source:string; visibility:string; topic:string; created_at:number; state:string; evm_hash?:string; gen_hash?:string; input_hash:string; contract:string; result?:string; error?:string; payload?:string; owner:string; verdict?:string;};
export function safeSource(value:string):string {
 if (!value) return '';
 const url = new URL(value);
 const host=url.hostname.toLowerCase();
 if(url.protocol!=='https:' || url.username || url.password || (url.port && url.port!=='443') || !/^[a-z0-9.-]+$/.test(host) || !host.includes('.') || /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host) || /^\d/.test(host) || host==='metadata.google.internal' || host.endsWith('.localhost')) throw new Error('Use a public HTTPS source link.');
 if(value.length>1000) throw new Error('Source link is too long.');
 url.hash='';return url.toString();
}
export function validateClaim(claim:string,source:string) {
 if(claim.trim().length<8) throw new Error('Please enter a clear claim of at least 8 characters.');
 if(claim.length>2400 || (!source && claim.length>600)) throw new Error('Keep short claims under 600 characters. Longer claims need a source link and must stay under 2,400 characters.');
}
export function lifecycle(status:string,execution:string):string {
 if(['CANCELED','UNDETERMINED'].includes(status))return status.toLowerCase();
 if(status==='FINALIZED')return execution==='SUCCESS'?'finalized':'execution_failed';
 if(status==='ACCEPTED')return execution==='SUCCESS'?'accepted':execution==='ERROR'?'execution_failed':'processing';
 return status.toLowerCase() || 'pending';
}
