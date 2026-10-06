"use client";
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCheck, FileText, Globe2, Link2, LoaderCircle, LockKeyhole, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useWallet } from './wallet-context';
import EvidenceLens from './evidence-lens';
import SiteHeader from './site-header';
import SiteFooter from './site-footer';
import CheckCard from './check-card';
import { api } from '@/lib/client-api';
import { safeSource, type SavedCheck } from '@/lib/domain';

const examples = [
  {topic:'Football',claim:'Argentina won the 2022 FIFA World Cup.'},
  {topic:'Science',claim:'The Moon produces its own light.'},
];
const topics = ['All topics','Politics','Football','Science','World'];

export default function ClaimLens() {
  const {user,loading:walletLoading,openWallet} = useWallet();
  const [claim,setClaim] = useState('');
  const [source,setSource] = useState('');
  const [privateCheck,setPrivateCheck] = useState(false);
  const [mode,setMode] = useState('text');
  const [claimTopic,setClaimTopic] = useState('General');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [query,setQuery] = useState('');
  const [topic,setTopic] = useState('All topics');
  const [checks,setChecks] = useState<SavedCheck[]>([]);
  const [feedLoading,setFeedLoading] = useState(true);
  const [feedError,setFeedError] = useState('');
  const textarea = useRef<HTMLTextAreaElement>(null);
  const lengthLimit = source.trim() ? 2400 : 600;
  let sourceError = '';
  if (source.trim()) {try {safeSource(source.trim());} catch {sourceError='Use a public HTTPS link, such as https://x.com/…';}}
  const tooLong = claim.length > lengthLimit;
  const ready = !walletLoading && claim.trim().length >= 8 && !tooLong && !sourceError && (mode!=='link' || !!source.trim());

  useEffect(()=>{
    const controller = new AbortController();
    const timer = setTimeout(async()=>{
      setFeedLoading(true);
      try {
        const response = await fetch(`/api/checks?topic=${encodeURIComponent(topic)}&q=${encodeURIComponent(query)}`,{signal:controller.signal,cache:'no-store'});
        if(!response.ok)throw new Error('The public record is temporarily unavailable.');
        const data = await response.json() as {checks:SavedCheck[]};
        setChecks(data.checks);setFeedError('');
      }catch(e){if(!controller.signal.aborted)setFeedError(e instanceof Error?e.message:'Unable to load public checks.');}
      finally{if(!controller.signal.aborted)setFeedLoading(false);}
    },250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[topic,query]);

  async function submit(){
    if(!ready || busy)return;
    if(!user || !user.username){openWallet();return;}
    setError('');setBusy(true);
    try {
      const result = await api<{id:string}>('checks',{claim:claim.trim(),source:source.trim(),visibility:privateCheck?'private':'public',topic:claimTopic});
      window.location.href=`/checks/${result.id}`;
    }catch(e){setError(e instanceof Error?e.message:'Unable to save your check. Your input is still here.');}
    finally{setBusy(false);}
  }

  function tryExample(example:typeof examples[number]){
    setClaim(example.claim);setClaimTopic(example.topic);setMode('text');setError('');
    textarea.current?.focus();
  }

  return <main className="claimlens-shell">
    <div className="ambient ambient-one" aria-hidden="true"/><div className="ambient ambient-two" aria-hidden="true"/>
    <SiteHeader/>
    <div id="main-content">
      <section className="hero" id="check" aria-labelledby="hero-title">
        <div className="intro">
          <div className="eyebrow"><span className="eyebrow-dot"/> ONE CLAIM. INDEPENDENT JUDGMENT.</div>
          <h1 id="hero-title">A claim deserves<br/>a <em>closer look.</em></h1>
          <p>From the timeline to the headlines. Bring one claim.<br/>GenLayer validators judge it against the evidence.</p>
        </div>
        <EvidenceLens/>
        <form className="composer glass" onSubmit={e=>{e.preventDefault();void submit();}}>
          <div className="composer-top">
            <Tabs value={mode} onValueChange={setMode} aria-label="Submission format"><TabsList className="input-tabs"><TabsTrigger value="text"><FileText size={14}/> Write a claim</TabsTrigger><TabsTrigger value="link"><Link2 size={14}/> Paste a link</TabsTrigger></TabsList></Tabs>
            <span className="network"><i/> Bradbury</span>
          </div>
          {mode==='link'&&<div className="link-mode-input"><label htmlFor="post-link">Post or article link</label><div className={`source-input ${sourceError?'invalid':''}`}><Link2 size={16}/><input id="post-link" type="url" value={source} onChange={e=>setSource(e.target.value)} placeholder="https://x.com/username/status/…" aria-describedby="claim-help"/><ArrowUpRight size={14}/></div></div>}
          <label className="claim-label" htmlFor="claim">{mode==='link'?'The claim in the post':'What would you like to fact-check?'}</label>
          <textarea ref={textarea} id="claim" value={claim} onChange={e=>{setClaim(e.target.value);if(error)setError('');}} maxLength={2400} placeholder={mode==='link'?'Quote the exact statement you want checked…':'Write one clear, factual statement…'} aria-describedby="claim-help claim-counter" aria-invalid={tooLong} onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();void submit();}}}/>
          <div className={`input-hint ${tooLong?'invalid-hint':''}`}><span id="claim-help">{sourceError|| (tooLong?'Add a source link for a claim over 600 characters.':mode==='link'?'Quote one claim; a link alone is not enough.':'English only · one factual statement at a time.')}</span><span id="claim-counter">{claim.length}<span> / {lengthLimit.toLocaleString('en')}</span></span></div>
          {mode==='text'&&<div className={`source-input ${sourceError?'invalid':''}`}><Link2 size={16}/><input aria-label="Source link" type="url" value={source} onChange={e=>setSource(e.target.value)} placeholder="Add a source link (optional)"/><ArrowUpRight size={14}/></div>}
          <div className="composer-bottom">
            <div className="visibility"><Switch id="private" checked={privateCheck} onCheckedChange={setPrivateCheck} aria-label="Keep this check private"/><label htmlFor="private">{privateCheck?<LockKeyhole size={14}/>:<Globe2 size={14}/>} {privateCheck?'Private':'Public'}</label></div>
            <label className="topic-select"><span className="sr-only">Claim topic</span><select aria-label="Claim topic" value={claimTopic} onChange={e=>setClaimTopic(e.target.value)}>{['General','Politics','Football','Science','World'].map(t=><option key={t}>{t}</option>)}</select></label>
            <button type="submit" className="primary-button" disabled={!ready||busy}>{busy?<><LoaderCircle className="spinner" size={16}/> Finding sources…</>:<>Review claim</>}</button>
          </div>
          {error&&<p className="error-message" role="alert">{error}</p>}
          <div className="composer-note"><ShieldCheck size={12}/><span>{privateCheck?'Hidden on ClaimLens. Blockchain data may remain public.':'Public checks appear in the feed.'} Fees paid in GEN.</span></div>
        </form>
        <div className="example-prompts"><span>Try a claim</span>{examples.map(example=><button key={example.topic} onClick={()=>tryExample(example)}><Sparkles size={11}/>{example.topic}<ArrowUpRight size={11}/></button>)}</div>
      </section>
      <section className="process-strip" aria-label="How a check works">
        <div><span className="process-icon"><FileText size={18}/></span><p><b><span>01</span> Bring a claim</b>Text, a post, or a headline.</p></div>
        <div><span className="process-icon"><Search size={18}/></span><p><b><span>02</span> Follow the evidence</b>Independent validators evaluate sources.</p></div>
        <div><span className="process-icon"><CheckCheck size={19}/></span><p><b><span>03</span> See what holds up</b>A verdict with context and citations.</p></div>
      </section>
      <section className="explore" id="explore" aria-labelledby="explore-title">
        <div className="section-heading"><div><div className="eyebrow">THE PUBLIC RECORD</div><h2 id="explore-title">Facts worth a closer look<span>.</span></h2></div><div className="search-field"><Search size={16}/><input aria-label="Search public checks" placeholder="Search claims…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Clear search" onClick={()=>setQuery('')}>×</button>}</div></div>
        <div className="feed-toolbar"><div className="topic-filter" aria-label="Filter checks by topic">{topics.map(t=><button className={topic===t?'active':''} aria-pressed={topic===t} onClick={()=>setTopic(t)} key={t}>{t}</button>)}</div><span className="feed-count" aria-live="polite">{feedLoading?'Loading…':`${checks.length} public ${checks.length===1?'check':'checks'}`}</span></div>
        {feedError?<div className="feed-unavailable"><p role="status">{feedError}</p><button className="text-button" onClick={()=>{setTopic('All topics');setQuery('');window.location.reload();}}>Reload the record <ArrowRight size={14}/></button></div>:feedLoading&&!checks.length?<div className="feed-skeleton" aria-label="Loading public checks">{[1,2,3].map(i=><div key={i}><span/><span/><span/></div>)}</div>:checks.length?<div className="check-grid">{checks.map(check=><CheckCard check={check} key={check.id}/>)}</div>:<div className="empty-feed glass"><div className="empty-visual" aria-hidden="true"><div/><Search size={28}/></div><div><h3>{query||topic!=='All topics'?'No claims match this view.':'A clearer conversation starts here.'}</h3><p>{query||topic!=='All topics'?'Try another topic or a different search.':'The public record is waiting for its first check. What claim caught your attention?'}</p></div><a className="secondary-button" href="#check">Check a claim <ArrowUpRight size={15}/></a></div>}
      </section>
      <div className="trust-note"><ShieldCheck size={18}/><p>Sources you can inspect. Consensus you can trace.<span>Each completed check links to its evidence and GenLayer record.</span></p><a href="/how-it-works">Learn how it works <ArrowUpRight size={15}/></a></div>
    </div>
    <SiteFooter/>
  </main>;
}

