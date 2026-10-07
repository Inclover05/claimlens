# GenLayer architecture verification — 7 October 2026

ClaimLens is an adjudication layer on Bradbury. Its shared state transition is an immutable, provenance-bound verdict record. It does not currently settle money, update reputation or enforce another application's policy. Those downstream consequences belong to an integrating application.

The official [architecture guide](https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer) asks five design questions. This release answers them as follows:

| Question | ClaimLens implementation | Evidence |
| --- | --- | --- |
| What decision should GenLayer make? | Which of five rubric outcomes follows from one statement, its reference date and selected public evidence? | `contracts/claimlens.py`, fixed policy `claimlens-evidence-v1` |
| What state changes? | `check_claim` writes the agreed result under the sender/check UUID in contract `TreeMap` storage. The sender must match the request owner; a completed check cannot be overwritten. | Direct contract fixtures, deployed source/policy verification, independent real result read-back |
| What evidence can validators check? | The submitted ordered HTTPS references are fetched inside GenVM by both leader and validators, within explicit text budgets. No backend verdict is submitted. | Real GenVM replays; NASA, scoped football and independently sourced X website/committee checks |
| Which fields must agree? | Validators freshly fetch sources, independently derive the verdict and require exact equality of the verdict label. They also audit explanation, context and grounded citations; free wording need not be byte-identical. | `validator_fn`, adversarial direct fixtures and captured live validator replay |
| What if the proposal fails? | The website preserves transaction IDs, distinguishes execution failure, timeouts, absent consensus and agreed insufficient evidence, and never invents a verdict or automatically pays again. Accepted results remain provisional; consumers must check execution, agreement, finality and provenance. | Lifecycle tests, wallet-uncertainty browser tests, retained unsuccessful real attempts and `INTEGRATION.md` |

The [equivalence-principle guidance](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle) calls for independently deriving classification decisions rather than accepting a leader's schema alone. ClaimLens does both independent classification and a substantive proposal audit. Its pinned legacy runner exposes `gl.vm.run_nondet`; validators explicitly catch failures and return false. Current documentation's newer runtime examples must not be substituted into the archived deployed bytes without a coordinated runtime migration.

The website handles forms, source discovery, wallet consent, indexing and owner-only website access. GenLayer owns the consensus-critical evidence judgment and shared record. The final-source SHA-256 is `49ddcba217c0b1070ff70bfaf623b24e4c387a190075514165ac5778408b9ca3`; deployment `0x3E2C5298063d25e1111CFbe54526e46efe35eD3E` is finalized and source-verified.

Appeal eligibility, an authoritative bond quote and a separate wallet transaction are exposed before finality. The stable SDK 1.1.8 ABI differs from the [Consensus v0.6 migration](https://docs.genlayer.com/developers/consensus-v06-migration). Stable-network receipts and zero-bond tests are not evidence of v0.6 induced-work funding, deposits/refunds or nonzero bond settlement.

This verifies architectural fit and records measured implementation scope. It does not certify Builder Portal acceptance or imply that every optional GenLayer feature is mandatory. The dated release report and LIMITS.md are part of the reviewer package.
