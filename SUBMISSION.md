# ClaimLens — submission draft

## Short description

ClaimLens checks a factual claim against independently fetched evidence through GenLayer consensus. Users see the verdict, supporting quotations, limits and the transaction record behind the result.

## What GenLayer does

The Python Intelligent Contract fetches 1–4 public HTTPS sources itself. A leader proposes a fact-check; validators independently fetch and assess the evidence, compare verdicts and review the proposed explanation. Quoted evidence must occur in the fetched text. Successful consensus stores the result with the submitting wallet, original input SHA-256, date and policy version.

The five labels are Supported, Contradicted, Misleading, Insufficient evidence and Not a factual claim. A receipt alone is not a verdict: the website requires successful execution and matching result provenance. Accepted results remain visibly provisional until GenLayer finalizes them. Failed execution or absent consensus is shown separately.

## User journey

1. Enter one factual claim and an optional source link.
2. Connect a browser wallet, sign in and choose a profile name.
3. Review candidate evidence, website visibility and the Bradbury network fee.
4. Submit through the selected wallet. The website retains the transaction identifier for recovery after a lost response.
5. Read the evidence, limitations, consensus status and explorer records.

Website-private checks require their owner's session. Blockchain claims, source links, wallet addresses and results can still be public.

## Project links and deployment

- Repository: https://github.com/Inclover05/claimlens
- Website: https://claimlens-inclover05s-projects.vercel.app
- Hosting dashboard: https://vercel.com/inclover05s-projects/claimlens
- Network: GenLayer Bradbury, chain ID 4221.
- Contract: `0x9d707FdFF0d5C851DDAe081616CCdb60A4B09598`.
- Policy: `claimlens-evidence-v1`.
- Deployed source SHA-256: `62054246cfd48fdfd8d4e00aa4b668d0d70b897901345549b400292e9aabc1e2`.

The website currently requires Vercel sign-in. Public reviewer access needs to be enabled before using this link as an unrestricted demo.

## Verification and limits

See `reports/verification.md` for the current evidence ledger, `reports/live-website-verification.json` for real browser/chain checks and `reports/bradbury-deployment.json` for finalized deployment evidence. Verification is still in progress; use the statuses in those reports rather than treating this draft as a release certificate.

The app currently checks one claim in English. Search without a configured search service is limited to the supplied link and Wikipedia candidates. Page text is bounded; inaccessible, irrelevant or unreliable sources may prevent a conclusion. Consensus does not guarantee absolute truth.

The interface combines selective glass materials, a short logo reveal and a React Three Fiber lens, with a light theme, responsive layouts, reduced-motion fallbacks and an animation pause control.

This is a draft for the owner to adapt. The project has not been submitted to or accepted by the Builder Portal.
