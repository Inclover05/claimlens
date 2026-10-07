# Consume ClaimLens adjudications

The Intelligent Contract owns the decision. The website handles source discovery, accounts, private drafts, indexing and wallet submission. External applications can read the contract directly or retrieve public website records. The API requires wallet sign-in for submissions and owner-only records.

## Contract methods

| Method | Purpose |
| --- | --- |
| `get_policy()` | Returns `claimlens-evidence-v1`, the fixed five-outcome rubric. |
| `check_claim(payload: str)` | Adjudicates a bounded JSON request. The sender must equal its owner. A completed check cannot be overwritten. |
| `get_check(owner: str, check_id: str)` | Returns the saved result JSON, or an empty string when there is no saved result in the selected state. |

Request schema: `schema`, `policy`, UUID `id`, lowercase wallet `owner`, `claim`, original `source`, ordered `source_urls`, and UTC `as_of` date. Schema is 1. The returned input hash is SHA-256 of the exact UTF-8 payload string; reformatting the JSON changes the hash.

The result contains `verdict`, `explanation`, `caveats`, `evidence`, `input_hash`, `owner`, `policy` and `as_of`. Each evidence entry contains its fetched `url`, title, short exact quote and relation. Website visibility is not part of contract privacy.

## Read a public website record

```sh
curl https://claimlens-inclover05s-projects.vercel.app/api/checks/CHECK_UUID
curl https://claimlens-inclover05s-projects.vercel.app/api/capabilities
```

The check endpoint returns `{ "check": ... }`. Private records return 404 to guests. `result` is a JSON string when an agreed result exists. Drafts and transactions without a verdict also have records: do not treat HTTP 200 as a successful adjudication.

## Verify before relying on a result

1. Pin the expected contract address and policy from a reviewed release. Preserve the exact request, EVM hash and GenLayer transaction ID.
2. Verify the actual GenLayer receipt: successful execution plus agreed consensus. An accepted decision remains provisional.
3. For final use, require finalized status and read `get_check` from `latest-final` using the GenLayer RPC. An empty record is not a verdict.
4. Match owner, policy and input hash against the original request. Inspect the explanation, citations and caveats before applying your own downstream rules.
5. Handle Insufficient evidence, Not a factual claim, failed execution and no consensus explicitly. Do not silently convert any of these to false, zero, or a successful settlement.

ClaimLens currently creates a shared adjudication record. It does not transfer funds, settle escrow, assign reputation or enforce another application's rules. A downstream application must define its consequences and finality policy separately.

## Repeat the verification

`npm test` and `python scripts/contract-tools.py test` cover application invariants and contract fixtures. `node scripts/verify-genvm.mjs` performs live GenVM simulations without signing or paying. `scripts/verify-api-regressions.mjs` tests the deployed API with an ephemeral unfunded account. Read each script's environment requirements and report scope.

Real wallet tests use a dedicated test wallet, persist the signed EVM hash before broadcast, cap transaction costs and resume existing attempts. Never put a key in source control or an environment variable exposed to the browser. See LIMITS.md and the release report before running paid tests or integrating decisions.
