# ClaimLens — Builder Portal submission draft

**Project:** ClaimLens

**Website:** https://claimlens-inclover05s-projects.vercel.app/

**Public source:** https://github.com/Inclover05/claimlens

**Network:** GenLayer Bradbury testnet, chain ID 4221

**Intelligent Contract:** `0x3E2C5298063d25e1111CFbe54526e46efe35eD3E`

## Short description

ClaimLens is an evidence-based adjudication layer for factual claims. Users review public evidence links and approve a Bradbury transaction. The Intelligent Contract fetches evidence, proposes a bounded judgment, and asks validators to independently adjudicate the statement and audit its reasoning and citations. The resulting record includes its verdict, explanation, source quotations, limitations and immutable request hash.

## Why GenLayer is central

The backend does not use a private LLM to decide truth. Non-deterministic evidence retrieval and judgment happen inside GenLayer execution. Independent verification rejects ungrounded, malformed or unsupported proposals. Agreed decisions become shared contract state; other applications can read the owner/check record and apply their own downstream rules. ClaimLens distinguishes provisional acceptance, successful finalization, agreed insufficient evidence, execution failure and absence of consensus.

This follows the [adjudication-layer architecture](https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer) and [independent verification principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle). It does not claim that every optional protocol feature is mandatory or that Builder Portal acceptance has been certified.

## Reviewer walkthrough

1. Open the public website and inspect the [current-contract finalized NASA example](https://claimlens-inclover05s-projects.vercel.app/checks/29821f47-106c-461f-8d6e-be4b868c6223) and [scoped football check](https://claimlens-inclover05s-projects.vercel.app/checks/7b3c3c81-2ccb-4b42-ac2f-42f836acbc9e). Check each page's current finality state.
2. Connect an EVM wallet, sign the domain-bound login message and select Bradbury. Testing a new check requires test GEN.
3. Submit one English factual statement. For football, specify career/club/international scope, competition where relevant, and date. For X, paste the post URL and quote its exact claim.
4. Review or replace one to four evidence pages. A post URL can remain the original source while independent pages provide the evidence.
5. Read the privacy disclosure and fee estimate, then approve one wallet transaction. Follow the separate wallet and GenLayer transaction links.
6. Inspect the verdict, short quotations, caveats, input hash and consensus/finality state. No consensus has no verdict. An owner can review an appeal quote while a decision is accepted and not finalized.

## Evidence and boundaries

The dated [verification report](reports/release-2026-10-07.md), [architecture verification](reports/architecture-verification.md), machine-readable reports and [operating limits](LIMITS.md) distinguish direct tests, runtime simulations and real committee outcomes. Five of six initial current-revision cases produced agreed verdicts; one timed out. Misleading is implemented and covered by direct fixtures but has no verified real committee example. An actual production appeal transaction started a fresh committee and moved the prior X decision to no majority. The quoted bond was zero, so nonzero bond settlement is unverified.

Text budgets can omit long tables. X can block access. Undated statistics may not establish a precise date. Models can disagree, and validators can time out. A failed check can still cost a network fee. Website-private checks remain publicly inspectable on-chain. The app uses the stable Bradbury SDK/ABI family; Consensus v0.6 requires a coordinated migration and separate fee profiling.

This is the submission text and review guide. It is not a record of a completed portal submission.
