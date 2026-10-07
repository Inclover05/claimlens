# Verification ledger

## Current release — 7 October 2026

Read [the dated release report](release-2026-10-07.md), [operating limits](../LIMITS.md) and [diagnostic interpretation](diagnostic-interpretation.md) for the current contract, test scope and remaining limits. Machine-readable deployment, committee, website and fee records are linked there. The material below records earlier milestones and superseded deployments; it must not be read as the current release matrix.

## Historical verification — 6 October 2026 onward

## Verified locally

- TypeScript: noEmit check passes.
- Changed application files: focused ESLint check passes (warnings for ordinary image tags are non-blocking).
- Fifteen Node regression tests pass: public HTTPS origins, cross-origin rejection, malformed forwarding headers, PostgreSQL placeholders, concurrent request isolation, wallet restoration, account/chain checks, uncertain transaction recovery, lifecycle handling, unsafe source rejection, and deployment encoding compared with the pinned SDK before signing or broadcast.
- Official GenVM linter: contract schema valid, three methods, two views, one write, no constructor parameters.
- Seven direct contract tests: payload/source provenance, duplicate guard, successful captured validator replay, changed source/disagreement rejection, source-access failure, invented quote/malformed output rejection, legitimate insufficient evidence, large page assets, HTML entity decoding, title-only evidence and incomplete styles.
- Browser fixtures: input validation, wallet dialog, mobile menu/help navigation, dashboard, reduced motion, pause control, selected-provider restoration, uncertain-outcome retry lock, refresh, API outage after a returned hash, local hash restoration and manual attachment. No chain write occurred.
- Real local API/D1: ephemeral account signed the actual nonce; signature verified; used nonce rejected; profile and private draft persisted; SHA-256 matched immutable payload; guest access denied; public feed excluded the draft; missing contract blocked submission; logout invalidated the session. Fixture rows were removed afterward.
- Visual inspection: dark desktop, light desktop, 390px mobile, and brand reveal start/mid/end. Mobile document width equals viewport width; no horizontal overflow. Heavy 3D is omitted for reduced motion and small screens.
- Read-only live Bradbury preflight: chain 4221 responds to a wallet-style string request ID; code exists at SDK consensus address 0x0112Bf6e83497965A5fdD6Dad1E447a6E004271D. See deployment-preflight.json.

The direct runner needed a Windows-only adapter to defer deleting its stdin message file until the descriptor was released. SDK and contract bytes were not altered for testing. Mock prompt patterns were anchored so the validator's rubric did not accidentally match the leader fixture.

## Live coverage and limits

The corrected contract deployment is finalized with successful execution and exact source/policy read-back. The Supported test result is finalized with independent final-state read-back. A separate irrelevant-evidence check submitted after that state was final reached agreement and returned Insufficient evidence; its accepted result remains provisional. The earlier irrelevant-evidence attempt ended without consensus and remains an explicit failed test. A real X-post draft passed source preservation, independent candidate discovery, privacy and fee estimation. Its first paid check ended UNDETERMINED with FINISHED_WITH_ERROR; the debug replay returned UNGROUNDED_QUOTE, and all five votes reported deterministic violations. No agreed verdict is claimed. See x-post-consensus-investigation.json and the preserved x-post-live-first-attempt.json. The receipt and replay do not establish why the deterministic fingerprints differed.

Before portal submission, follow DEPLOYMENT.md. Preserve actual EVM/GenLayer identifiers, wallet/browser, fee, source/hash, execution, result read-back and finality. Claims with unavailable or irrelevant evidence must remain explicit gaps or insufficient evidence. Do not reuse OpenProof's deployment or acceptance as ClaimLens evidence.

## Decision log

- Selected provider vanished after full navigation -> reconnect state and session-only provider identity added -> three-provider restore fixture and browser reload pass.
- Refresh erased uncertain-broadcast warning -> status updates preserve submission warnings and server retry lock -> browser timeout/reload fixture passes.
- Returned hash could be lost before API persistence -> save it locally immediately and make attachment idempotent -> API-outage and reload recovery fixture passes.
- Lifecycle SDK inherited EVM RPC -> separate GenLayer read endpoint -> confirmed against the installed SDK transport implementation and actual accepted/finalized result reads.
- Contract mutated a nondeterministic return -> return immutable JSON and parse fresh deterministic metadata -> linter and captured validator replay pass.


## GitHub and Vercel verification

Public repository: https://github.com/Inclover05/claimlens. Vercel project: claimlens in inclover05s-projects, linked to main for automatic production deployments. The tested production deployment reached READY at application commit 73d7f9d077d74ffb8d0b55a5c24b74f70dd7ebd5. Its canonical origin is https://claimlens-inclover05s-projects.vercel.app.

The standard Next.js production build and Cloudflare Worker build both pass. The built Worker passes the real wallet-signature and private-draft API checks after the final runtime corrections. A dedicated Neon Free-plan resource, claimlens-db, is connected in Frankfurt. PostgreSQL migration and the real loopback Next.js/Neon checks pass.

The initial eight checks passed against the then-protected Vercel production API: cross-origin rejection, correct HTTPS nonce domain/URI, verified EOA signature and secure session cookie, replay rejection, persisted private draft and matching SHA-256, guest denial and feed privacy, missing-contract submission gate, and logout. The current api-verification-vercel.json records eleven passing checks, including the funded-contract configuration and unfunded-wallet gate, invalid-source and short-claim validation. All temporary fixture rows were removed from the local D1 and Neon databases.

Production is now public after explicit user approval. Fresh browser checks without Vercel cookies or bypass headers pass: wallet sign-in, accepted/finalized result rendering, private guest denial, public search/result access, owner visibility controls and restoration to private. Anonymous desktop/mobile, themes, 3D pause and reduced-motion checks pass with no browser errors or failed application requests. The finalized NASA example was then deliberately republished for guest review and remains public; see public-example-verification.json. See public-site-verification.json and x-post-draft-verification.json for the other anonymous checks.

- Next.js normalized the request URL to localhost -> derive the public origin from the request host and trusted Vercel forwarding metadata, with Worker context isolation -> cross-origin tests and real loopback nonce/signature flow pass.
- PostgreSQL rejected an ambiguous upsert column -> qualify limits.count -> repeated sign-in/verification and replay checks pass.

## Dedicated Bradbury test wallet

A new local test signer was created at the user's request. Its private key is encrypted with Windows DPAPI for the user's account in .claimlens-wallet, which is excluded from Git. File permissions were verified: only the owner and SYSTEM have access. Loading the encrypted key and verifying its EOA message signature passes.

The wallet received 5 test GEN. Deployment used a successful live gas estimate and the pinned SDK encoding; the local journal saved its deterministic EVM hash before broadcast and prevents an automatic duplicate deployment after an uncertain outcome.

## Initial finalized Bradbury deployment — superseded

- Contract: `0x9C3F33ab49Cf6F806cB4A1254F6770f42f7337Bf`.
- EVM transaction: `0x8d825baead1b57c0e3a7822c23579feaa667848a3b5c25445f00baf79fb5360b`; receipt success.
- GenLayer ID: `0x5e6cb750e7e4d3b86d5fda2ff21bb3390fda14063127101f8e0e780c19ae14e3`; `FINALIZED`, `FINISHED_WITH_RETURN`, confirmed 6 October 2026 at 20:00 UTC.
- Exact source SHA-256: `4ea3783af35968355028637f47c52de4664a8f93e95e059a51177404240625da`; policy read-back: `claimlens-evidence-v1`.
- Measured deployment network fee: 0.0013934664375 test GEN. This is the EVM receipt fee, not a general claim execution cost estimate.
- Vercel contract address configured for production, preview and development. Real website verdict checks are in progress.

See `bradbury-deployment-initial.json` for the retired deployment; `bradbury-deployment.json` records the corrected active source. The saved-session composer fix disables Review claim until sign-in restoration completes; its browser regression holds the session response deliberately.

## Source extraction correction

The first paid production check reached GenLayer but ended `UNDETERMINED` with `FINISHED_WITH_ERROR`. Independently reading the supplied NASA page showed the fact-bearing article started after the old 50,000-character raw HTML cutoff. A proposed result also used page titles as evidence; it is not counted as a verified verdict. See `live-website-verification-initial.json` for its identifiers.

The corrected source bounds raw input at 1 MB, removes scripts/styles before limiting evidence, prefers article/main content, decodes entities and marks truncated text. The rubric explicitly rejects titles/navigation as evidence and inference from omitted content. The official linter and all seven direct tests pass. Replacement contract `0x9d707FdFF0d5C851DDAe081616CCdb60A4B09598` is finalized with successful execution and exact source/policy read-back; the NASA-backed Supported result is also finalized.

## Consensus and finality handling

Fifteen Node tests and ten browser regression checks pass, including finalized receipts with unsuccessful consensus. A receipt must report both successful execution and `AGREE`/`MAJORITY_AGREE` before the website reads a verdict. Finalized negative consensus displays no verdict and records protocol finality separately. Finalized records no longer depend on another RPC read to remain viewable. TypeScript and focused ESLint pass (one existing image optimization warning).

The user explicitly approved anonymous website access on 6 October 2026; Vercel sign-in protection has now been disabled for this project. Fresh unauthenticated access verification passes; see public-site-verification.json.

## Corrected finalized deployment

Contract `0x9d707FdFF0d5C851DDAe081616CCdb60A4B09598` reached `FINALIZED` with `FINISHED_WITH_RETURN`, verified 6 October 2026 at 20:40 UTC. Exact source SHA-256 is `62054246cfd48fdfd8d4e00aa4b668d0d70b897901345549b400292e9aabc1e2`, with policy `claimlens-evidence-v1`. Normal finalization completed without the test wallet sending a finalization transaction. See bradbury-deployment.json for the corrected active deployment; bradbury-deployment-initial.json retains the retired contract.

## Release record integrity

The public GitHub source, local bytes and finalized on-chain source have identical SHA-256, verified independently in source-integrity-verification.json. The deployment helper now prevents a retired journal from overwriting the active release record; inspecting both actual deployments confirms the guard. Saved pre-deployment balances are labeled explicitly, and test-wallet-costs.json reconciles current balance with actual receipt fees.

## Fresh negative-evidence test

A new request was submitted only after the deployment and previous Supported result were finalized. It returned Insufficient evidence with FINISHED_WITH_RETURN and AGREE; the final round records four AGREE votes and one TIMEOUT. See consensus-investigation-after-finality.json. This successful separate test does not establish why the earlier committee reported deterministic violations. The original failed attempt and its no-verdict display are retained. No normal idleness transaction was sent: the helper stopped before creating a signing journal while the network continued handling timeouts.

## X-post access and first paid test

The selected real FIFA post is https://x.com/FIFAWorldCup/status/1604535989480955908, published on 18 December 2022. Its official embed and one direct response contain the Argentina world-champions claim. Current contract extraction of that response retains the claim in 200 characters; this local observation does not prove identical validator access. The app preserves the link and asks the user to quote one claim manually. See x-post-source-access.json and x-post-draft-verification.json.

The first claim, “Argentina won the 2022 FIFA World Cup,” did not produce an agreed result. A separate test used “Argentina won the 2022 FIFA World Cup final” with the same real post and more specific candidate discovery. Both ended UNDETERMINED / FINISHED_WITH_ERROR / DISAGREE; all five votes in each report deterministic violations. Both debug replays returned UNGROUNDED_QUOTE with no storage changes. The traces do not include the rejected quote and do not prove why the execution fingerprints differed. No contract rule or deployed source was changed for these tests.

Both original identifiers and payments are preserved. Independent contract reads return no saved result. Actual owner browser checks display no verdict or resubmission button, and guest access is denied. See x-post-live-verification.json for the failure-handling checks, x-post-live-first-attempt.json and x-post-live-second-attempt.json for the unsuccessful expected-verdict runs, and x-post-final-consensus-investigation.json for the second receipt. A passing failure-handling check does not certify successful X fact-checking. The overall requested-verdict report remains unsuccessful.

X verdicts remain a release gap. Further work must establish why generated quotations fail the exact, bounded-source check and why rejected outputs produce cross-validator fingerprint disagreements, while preserving strict evidence validation. No additional paid retry is implied by this report.

## Measured test-wallet costs

Eight actual EVM transactions reconcile the initial 5 test GEN to a balance of 4.99616293349511755 GEN and total receipt fees of 0.00383706650488245 GEN. This includes both deployments and all six paid checks, including failures. See test-wallet-costs.json for individual receipts. No finalization or idleness transaction was sent by this wallet.
