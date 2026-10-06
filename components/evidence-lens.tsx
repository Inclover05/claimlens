"use client";
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { FileText, Pause, Play, Quote, ShieldCheck } from 'lucide-react';
const Scene=lazy(()=>import('./glass-scene'));
class SceneBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onError();}
  render(){return this.state.failed?null:this.props.children;}
}
export default function EvidenceLens(){
  const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[visible,setVisible]=useState(true),[paused,setPaused]=useState(false);
  const art=useRef<HTMLElement>(null);
  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)'),small=window.matchMedia('(max-width: 639px)');
    let capable:boolean|undefined;
    const update=()=>{
      if(motion.matches||small.matches){setEnabled(false);setReady(false);return;}
      if(capable===undefined){const canvas=document.createElement('canvas');try{const context=canvas.getContext('webgl2');capable=!!context;context?.getExtension('WEBGL_lose_context')?.loseContext();}catch{capable=false;}}
      setEnabled(capable);
    };
    update();motion.addEventListener('change',update);small.addEventListener('change',update);
    return()=>{motion.removeEventListener('change',update);small.removeEventListener('change',update);};
  },[]);
  useEffect(()=>{
    let inView=true;
    const update=()=>setVisible(inView&&!document.hidden);
    const observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;update();},{threshold:.1});
    if(art.current)observer.observe(art.current);
    document.addEventListener('visibilitychange',update);
    return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update);};
  },[]);
  return <figure ref={art} className={`lens-art ${enabled?'animated-lens':''} ${ready?'scene-ready':''} ${paused||!visible?'motion-paused':''}`} aria-label="An evidence lens: look at the source, consider the context, reach a shared judgment.">
    <div className="lens-grid" aria-hidden="true"/><div className="lens-orbit orbit-one" aria-hidden="true"/><div className="lens-orbit orbit-two" aria-hidden="true"/>
    <span className="lens-coordinate" aria-hidden="true">CLAIM / EVIDENCE / CONTEXT</span>
    <div className="lens-glass" aria-hidden="true"><div className="lens-core"><span>?</span></div></div>
    {enabled&&<div className="three-lens" aria-hidden="true"><SceneBoundary onError={()=>{setEnabled(false);setReady(false);}}><Suspense fallback={null}><Scene active={!paused&&visible} onReady={()=>setReady(true)}/></Suspense></SceneBoundary></div>}
    <div className="floating-source glass" aria-hidden="true"><span className="source-icon"><FileText size={18}/></span><div><b>Go to the source</b><span>Evidence comes first</span></div><span className="mini-bars"><i/><i/><i/></span></div>
    <div className="floating-context glass" aria-hidden="true"><Quote size={16}/><span>Context matters.</span></div>
    <div className="lens-tag glass" aria-hidden="true"><ShieldCheck size={15}/><span>Independent AI · shared consensus</span></div>
    <span className="lens-cross cross-one" aria-hidden="true">+</span><span className="lens-cross cross-two" aria-hidden="true">+</span>
    <figcaption className="lens-caption"><span>LOOK CLOSER. THINK CLEARER.</span><div/></figcaption>
    {enabled&&<button className="motion-toggle" type="button" aria-pressed={paused} aria-label={paused?'Play lens animation':'Pause lens animation'} onClick={()=>setPaused(!paused)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button>}
  </figure>;
}


