import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
export const metadata:Metadata={title:'How it works — ClaimLens',description:'What GenLayer judges, how evidence is used, and what a ClaimLens verdict means.'};
const steps=[
 ['01','Bring one factual statement','Write the exact claim you want checked, or paste a post link and quote its claim. Keep it in English and narrow enough for one verdict. A headline with several unrelated assertions needs several checks.'],
 ['02','Review the candidate evidence','ClaimLens discovers public source links and saves the exact request. You can inspect the links before paying. Finding a page does not establish its reliability or support for the claim.'],
 ['03','Let validators look independently','After you approve the GEN fee in your chosen wallet, the Intelligent Contract fetches sources and evaluates the claim. GenLayer validators assess the evidence and proposed reasoning. The website does not invent or decide the verdict.'],
 ['04','Read the verdict and its record','A completed check shows the conclusion, explanation, limitations and short source quotations. Its transaction links and input hash let you trace the saved request. An accepted result is provisional during protocol review; finalization is shown separately.']
];
const verdicts=[
 ['Supported','Reliable evidence supports the material factual elements of the claim.'],
 ['Contradicted','Reliable evidence directly refutes a material factual element.'],
 ['Misleading','Material facts are accurate, but omitted context changes their meaning.'],
 ['Insufficient evidence','Sources are inconclusive, conflicting, irrelevant or unreliable. This is a valid outcome.'],
 ['Not a factual claim','The statement is an opinion, prediction or value judgment without a verifiable assertion.']
];
export default function HowItWorks(){return <main className="claimlens-shell">
 <div className="ambient ambient-one" aria-hidden="true"/><SiteHeader/>
 <article id="main-content" className="detail-content">
  <div className="guide-intro"><div className="eyebrow"><span className="eyebrow-dot"/> FOLLOW THE EVIDENCE</div><h1 className="detail-title">Clarity has a process.</h1><p>ClaimLens asks a bounded question: does the evidence available to GenLayer validators support this factual claim? The answer belongs to the Intelligent Contract and its consensus record.</p></div>
  <div className="guide-grid">{steps.map(([number,title,text])=><section key={number} className="guide-step"><span>{number}</span><h2>{title}</h2><p>{text}</p></section>)}</div>
  <section className="guide-step"><span>READING THE RESULT</span><h2>Five outcomes. Room for uncertainty.</h2><dl className="verdict-guide">{verdicts.map(([label,meaning])=><div key={label} style={{display:'contents'}}><dt>{label}</dt><dd>{meaning}</dd></div>)}</dl><p>Sources can be unavailable, incomplete or changed. A failed execution or an undecided transaction has no fact-check verdict. Citations show what validators assessed; they are not a guarantee of universal truth.</p></section>
  <div className="guide-grid"><section className="guide-step"><span>YOUR WALLET</span><h2>A fee you approve.</h2><p>Sign-in uses a message signature and does not authorize payment. Submitting a check requires Bradbury testnet GEN. Review a fresh fee estimate, then approve the transaction in the wallet you selected. Your wallet shows the final charge; ClaimLens adds no application fee.</p><p>If the wallet response times out, inspect wallet activity and link the existing transaction hash. Sending the same check again can create a duplicate payment.</p></section><section className="guide-step"><span>YOUR VISIBILITY</span><h2>Private on the website.</h2><p>A private check is visible to its owner on ClaimLens. The claim, source links, wallet address and result may still be public on the blockchain. Avoid submitting confidential information.</p><p>The public feed contains saved public checks and shows their actual states. A saved draft, fee quote or wallet receipt is not a validator verdict.</p></section></div>
  <section className="guide-step"><span>TESTNET LIMITS</span><h2>A bounded judgment.</h2><p>Choose up to four public HTTPS evidence pages. The current contract reads at most 6,000 text characters from each page and 12,000 overall, in the selected order. Long tables, later sections, images, video and paywalled material may be missing. A source date and the date of your claim may differ.</p><p>For comparisons, specify the measure, scope and date. Career goals, league goals and international goals are different questions. “More powerful” needs a defined measure such as GDP or military spending. The app flags common ambiguous wording before payment; it cannot detect every ambiguity.</p><p>X posts can require sign-in or block validators. Paste the exact statement and add independent evidence. A result checks that statement against the selected sources; it does not authenticate the post, account, image or video.</p><p>Discovery without a configured web search service uses Wikipedia and your supplied link. You can replace candidates before paying. A consensus result reflects the available evidence and policy, and can still be mistaken. No consensus means no verdict, even if a wallet fee was charged.</p><p>Before finality, the owner can review the protocol appeal cost and challenge an accepted decision. Appeals require a separate wallet transaction and any quoted bond. After finality, a fresh check is a new paid request; it does not change the earlier record.</p></section>
  <Link href="/#check" className="primary-button">Bring a claim</Link>
 </article><SiteFooter/>
 </main>;}

