"use client";
import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
const subscribe=()=>()=>{};
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun, Wallet, X } from 'lucide-react';
import { useWallet } from './wallet-context';
export default function SiteHeader(){
 const {user,openWallet}=useWallet();const {theme,setTheme}=useTheme();const mounted=useSyncExternalStore(subscribe,()=>true,()=>false);const [menu,setMenu]=useState(false);const pathname=usePathname();

 const links=[{href:'/#check',label:'Check a claim'},{href:'/#explore',label:'Explore'},{href:'/how-it-works',label:'How it works'}];
 return <><Link className="skip-link" href="#main-content">Skip to content</Link><header className="site-header"><Link className="brand-lockup" href="/" aria-label="ClaimLens home"><span className="brand-logo"><img src="/brand/genlayer-logo.svg" alt="GenLayer" width={117} height={28}/></span><span className="brand-divider"/><span className="brand-name">ClaimLens<span>.</span></span></Link><nav aria-label="Main navigation" className="desktop-nav">{links.map(link=><Link key={link.href} href={link.href} className={pathname===link.href?'selected':''}>{link.label}</Link>)}</nav><div className="header-actions">{user&&<Link className="my-checks-link" href="/dashboard">My checks</Link>}<button className="icon-button theme-button" aria-label={mounted&&theme==='dark'?'Use light theme':'Use dark theme'} onClick={()=>setTheme(theme==='dark'?'light':'dark')} disabled={!mounted}>{mounted&&theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button><button className="wallet-button" onClick={openWallet} aria-label={user?`Wallet profile for ${user.username||user.address}`:"Connect wallet"}><Wallet size={15}/><span>{user?.username|| (user?'Your wallet':'Connect wallet')}</span></button><button className="icon-button mobile-menu-button" aria-label={menu?'Close menu':'Open menu'} aria-expanded={menu} aria-controls="mobile-nav" onClick={()=>setMenu(!menu)}>{menu?<X size={18}/>:<Menu size={18}/>}</button></div></header>{menu&&<nav id="mobile-nav" className="mobile-nav glass" aria-label="Mobile navigation">{links.map(link=><Link href={link.href} key={link.href} onClick={()=>setMenu(false)}>{link.label}</Link>)}<Link href="/dashboard">My checks</Link></nav>}</>;
}



