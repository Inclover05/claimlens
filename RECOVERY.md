# ClaimLens recovery — 6 October 2026

## Original instructions

The exact original ClaimLens brief, agreed checkpoints, and last requested next step could not be recovered. Do not present an inferred implementation plan as the original instructions.

The existing Sites project identifies prior Codex thread 01a10dbc-c181-7531-a98f-aa45e0442588. Reading that thread failed because its durable host was unavailable. Local Codex sessions contained only the current recovery chat. No ClaimLens handoff was found in this checkout or the searched Downloads Markdown/text files. Accessible OpenProof and ProofData plans describe separate projects and must not substitute for this project's brief.

## Confirmed from the saved project

- Product: ClaimLens, evidence-backed fact checking with GenLayer Bradbury.
- Existing interface: claim composer, public feed, wallet sign-in and username flow, personal dashboard, and check detail view.
- Existing backend: D1 persistence, signed-wallet authentication, candidate source discovery, fee estimates, transaction recovery, and consensus tracking.
- Existing Intelligent Contract: contracts/claimlens.py. It independently fetches sources and adjudicates Supported, Contradicted, Misleading, Insufficient evidence, or Not a factual claim. Its rubric requires evidence-grounded results and independent validator evaluation.
- Website-private checks disclose that blockchain inputs/results may remain public.
- Network constants: Bradbury chain ID 4221, with separate EVM and GenLayer RPC endpoints.
- Sites identity: appgprj_6ac425a241b48191a032f07798c7489a. Native lookup returned an active owner-accessible project, version number 0, and no current live or preview URL.
- This local copy contains no Git history.
- The JavaScript test command references tests/*.test.ts; the contract tools reference tests/direct. Neither directory exists in this copy.
- README.md describes the generic starter rather than documenting ClaimLens progress.
- TypeScript validation completed successfully on 6 October 2026: node node_modules/typescript/bin/tsc --noEmit.

## Unverified

No browser flow, fresh production build, wallet submission, deployed ClaimLens contract, validator source access, or live verdict was verified during recovery. No application source or deployment was changed.

## Proposed continuation, not recovered instructions

Preserve the existing product. First establish a working local preview and database flow, recover or restore meaningful missing tests, then verify the contract and one complete claim-to-verdict journey. Recover the old chat if its host becomes available before treating any original acceptance criteria as known.
