export const POLICY = 'claimlens-evidence-v1';
export const VERDICTS = ['Supported','Contradicted','Misleading','Insufficient evidence','Not a factual claim'] as const;
export type Verdict = typeof VERDICTS[number];
export type Evidence = { url:string; title:string; quote:string; relation:'supports'|'contradicts'|'context'; };
export type CheckResult = { verdict:Verdict; explanation:string; caveats:string; evidence:Evidence[]; as_of:string; input_hash:string; policy:string; owner:string; };
export type SavedCheck = {id:string; claim:string; source:string; visibility:string; topic:string; created_at:number; state:string; evm_hash?:string; gen_hash?:string; input_hash:string; contract:string; result?:string; error?:string; payload?:string; owner:string; verdict?:string;};
export function submissionContractError(saved:string,active?:string):string|null {
 if(!saved||!active)return 'The Bradbury contract is awaiting deployment. Your draft is saved.';
 if(saved.toLowerCase()!==active.toLowerCase())return 'This draft uses a retired contract. Create a new check with the current contract before paying.';
 return null;
}
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
 const guidance=claimGuidance(claim);if(guidance)throw new Error(guidance);
}
export function claimGuidance(claim:string):string|null {
 const vague=/\b(?:more powerful|stronger|bigger|larger)\b.{0,80}\bthan\b/i.test(claim);
 const metric=/\b(?:gdp|gross domestic product|military spending|defen[cs]e spending|nuclear warheads|population|area|square|km2|km²|goals|points|wins|height|weight|mass|revenue|income|score|rank|index|percent|percentage|rate|capacity|kilomet|kilomet|meters|metres)\b/i.test(claim);
 return vague&&!metric?'Define the comparison before checking: name the measure and time period. For example, compare GDP in a specified year, military spending, or career goals as of a date.':null;
}
export function lifecycle(status:string,execution:string,consensus='UNKNOWN'):string {
 if(['CANCELED','UNDETERMINED'].includes(status))return status.toLowerCase();
 const agreed=['AGREE','MAJORITY_AGREE'].includes(consensus);
 if(status==='FINALIZED'){
  if(['DISAGREE','MAJORITY_DISAGREE','NO_MAJORITY','TIMEOUT','DETERMINISTIC_VIOLATION'].includes(consensus))return 'finalized_no_consensus';
  return execution==='ERROR'?'execution_failed':execution==='SUCCESS'&&agreed?'finalized':'processing';
 }
 if(status==='ACCEPTED')return execution==='ERROR'?'execution_failed':execution==='SUCCESS'&&agreed?'accepted':'processing';
 return status.toLowerCase() || 'pending';
}
