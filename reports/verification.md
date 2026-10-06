# Verification ledger — 6 October 2026

## Verified locally

- TypeScript: noEmit check passes.
- Changed application files: focused ESLint check passes (warnings for ordinary image tags are non-blocking).
- Seven Node regression tests: provider restoration among MetaMask/Rabby/OKX fixtures, wrong account/chain, chain addition via EVM RPC, uncertain outcomes vs rejection, lifecycle/execution, unsafe source rejection.
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
