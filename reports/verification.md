# Verification ledger — 6 October 2026

## Verified locally

- TypeScript: noEmit check passes.
- Changed application files: focused ESLint check passes (warnings for ordinary image tags are non-blocking).
- Fourteen Node regression tests pass: public HTTPS origins, cross-origin rejection, malformed forwarding headers, PostgreSQL placeholders, concurrent request isolation, wallet restoration, account/chain checks, uncertain transaction recovery, lifecycle handling, unsafe source rejection, and deployment encoding compared with the pinned SDK before signing or broadcast.
- Official GenVM linter: contract schema valid, three methods, two views, one write, no constructor parameters.
- Five direct contract tests: payload/source provenance, duplicate guard, successful captured validator replay, changed source/disagreement rejection, source-access failure, invented quote/malformed output rejection, and legitimate insufficient evidence.
- Browser fixtures: input validation, wallet dialog, mobile menu/help navigation, dashboard, reduced motion, pause control, selected-provider restoration, uncertain-outcome retry lock, refresh, API outage after a returned hash, local hash restoration and manual attachment. No chain write occurred.
- Real local API/D1: ephemeral account signed the actual nonce; signature verified; used nonce rejected; profile and private draft persisted; SHA-256 matched immutable payload; guest access denied; public feed excluded the draft; missing contract blocked submission; logout invalidated the session. Fixture rows were removed afterward.
- Visual inspection: dark desktop, light desktop, 390px mobile, and brand reveal start/mid/end. Mobile document width equals viewport width; no horizontal overflow. Heavy 3D is omitted for reduced motion and small screens.
- Read-only live Bradbury preflight: chain 4221 responds to a wallet-style string request ID; code exists at SDK consensus address 0x0112Bf6e83497965A5fdD6Dad1E447a6E004271D. See deployment-preflight.json.

The direct runner needed a Windows-only adapter to defer deleting its stdin message file until the descriptor was released. SDK and contract bytes were not altered for testing. Mock prompt patterns were anchored so the validator's rubric did not accidentally match the leader fixture.

## Not yet verified

No ClaimLens contract address is configured. There is no deployed source/policy comparison, real-wallet deployment or paid claim transaction, execution result, accepted/finalized verdict, production-domain wallet compatibility, or measured protocol fee profile. Read-only RPC success and passing fixtures do not prove these capabilities.

Before portal submission, follow DEPLOYMENT.md. Preserve actual EVM/GenLayer identifiers, wallet/browser, fee, source/hash, execution, result read-back and finality. Claims with unavailable or irrelevant evidence must remain explicit gaps or insufficient evidence. Do not reuse OpenProof's deployment or acceptance as ClaimLens evidence.

## Decision log

- Selected provider vanished after full navigation -> reconnect state and session-only provider identity added -> three-provider restore fixture and browser reload pass.
- Refresh erased uncertain-broadcast warning -> status updates preserve submission warnings and server retry lock -> browser timeout/reload fixture passes.
- Returned hash could be lost before API persistence -> save it locally immediately and make attachment idempotent -> API-outage and reload recovery fixture passes.
- Lifecycle SDK inherited EVM RPC -> separate GenLayer read endpoint -> confirmed against installed SDK transport implementation; live decision still pending.
- Contract mutated a nondeterministic return -> return immutable JSON and parse fresh deterministic metadata -> linter and captured validator replay pass.


## GitHub and Vercel verification

Public repository: https://github.com/Inclover05/claimlens. Vercel project: claimlens in inclover05s-projects, linked to main for automatic production deployments. The tested production deployment reached READY at application commit 73d7f9d077d74ffb8d0b55a5c24b74f70dd7ebd5. Its canonical origin is https://claimlens-inclover05s-projects.vercel.app.

The standard Next.js production build and Cloudflare Worker build both pass. The built Worker passes the real wallet-signature and private-draft API checks after the final runtime corrections. A dedicated Neon Free-plan resource, claimlens-db, is connected in Frankfurt. PostgreSQL migration and the real loopback Next.js/Neon checks pass.

Eight checks also pass against the actual protected Vercel production API: cross-origin rejection, correct HTTPS nonce domain/URI, verified EOA signature and secure session cookie, replay rejection, persisted private draft and matching SHA-256, guest denial and feed privacy, missing-contract submission gate, and logout. See api-verification-vercel.json. All temporary fixture rows were removed from the local D1 and Neon databases.

Production remains behind Vercel sign-in pending explicit approval to make the website public. Authenticated CLI verification proves the deployed API behavior; it does not prove anonymous website access or a rendered production browser session. No deployed ClaimLens contract is configured, and no blockchain transaction was sent.

- Next.js normalized the request URL to localhost -> derive the public origin from the request host and trusted Vercel forwarding metadata, with Worker context isolation -> cross-origin tests and real loopback nonce/signature flow pass.
- PostgreSQL rejected an ambiguous upsert column -> qualify limits.count -> repeated sign-in/verification and replay checks pass.

## Dedicated Bradbury test wallet

A new local test signer was created at the user's request. Its private key is encrypted with Windows DPAPI for the user's account in .claimlens-wallet, which is excluded from Git. File permissions were verified: only the owner and SYSTEM have access. Loading the encrypted key and verifying its EOA message signature passes.

The read-only deployment preflight confirms chain 4221, deployed consensus code, the existing tested contract source hash, and the pinned SDK encoding. The wallet had 0 test GEN at preparation, so no deployment or live claim transaction was sent. Live gas estimation, contract execution, finalization, source/policy read-back and website consensus tests remain pending funding. The local deployment journal records the deterministic EVM hash before broadcast and prevents automatic duplicate deployment after an uncertain outcome.
