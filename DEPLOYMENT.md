# ClaimLens deployment preparation

Status: contract prepared and tested locally; no Bradbury deployment or live verdict yet.

ClaimLens asks whether one factual claim is supported by sources independently fetched and assessed inside the Intelligent Contract. The website discovers candidates, saves the immutable request, signs through the selected wallet, and tracks the contract's result. The contract uses custom leader/validator comparison, not exact equality between freely worded AI responses.

## Pinned environment

- JavaScript SDK: genlayer-js 1.1.8; viem 2.57.3, from package-lock.json.
- Contract tooling: genlayer-test 0.29.2; genvm-linter 0.11.0.
- Python runner: py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6 (legacy runtime v0.2.17).
- Bradbury chain ID: 4221 (0x107d).
- Wallet and EVM RPC: https://rpc.testnet-chain.genlayer.com.
- Contract reads and lifecycle RPC: https://rpc-bradbury.genlayer.com.
- Policy: claimlens-evidence-v1; request schema: 1.
- Deployment: contracts/claimlens.py; constructor has no parameters.

The SDK's network definition supplies the consensus address. Run `node scripts/verify-deployment.mjs` to check the endpoint's chain ID and deployed code at that address. This read-only preflight does not prove real-wallet writes or contract execution.

## Deploy and verify

For the dedicated local Bradbury test wallet, Windows encrypts the private key for the current account in the Git-ignored .claimlens-wallet directory. The directory permits only its owner and SYSTEM. Creation is idempotent, and the saved encrypted signer was verified with an EOA message signature. Use only Bradbury test GEN for this wallet.

```powershell
node scripts/bradbury-wallet.mjs status
node scripts/deploy-bradbury.mjs prepare
node scripts/deploy-bradbury.mjs deploy
node scripts/deploy-bradbury.mjs status
```

The deployment helper uses the pinned SDK's contract encoding, checks the chain, source hash and available balance, and requires a successful live gas estimate before signing. It records the deterministic EVM hash before broadcasting and resumes an existing attempt rather than signing another deployment. It records a verified contract address only after successful execution, finalization, and exact source/policy read-back. The encrypted signer is local to this Windows account and must never be placed in hosted environment variables or frontend code.

The official CLI is also available as a deployment option:

Use the official CLI with a funded Bradbury test wallet. Select and inspect the effective network before signing. Record the actual CLI version in the live evidence ledger; do not silently move this app to a preview network or SDK major version.

```powershell
genlayer --version
genlayer network set testnet-bradbury
genlayer network info
genlayer deploy --contract contracts/claimlens.py
```

Set up the wallet using the CLI's account commands and the testnet faucet. Keep private keys out of the repository, chat, scripts and browser storage. Before sending, inspect the current transaction and any required protocol fee; a gas estimate alone is not a measured Intelligent Contract execution budget. Current release-candidate fee examples are not a substitute for verifying the pinned Bradbury network and SDK combination.

Save the returned transaction identifier immediately. If the response times out after signing, inspect wallet history before another deployment. Resume tracking an existing identifier. Require successful contract execution, and then finalization, rather than treating a receipt or Accepted status alone as success.

After deployment, run the source and policy verifier:

```powershell
node scripts/verify-deployment.mjs <deployed-contract-address>
```

The verifier compares the on-chain source with the exact local bytes and reads `get_policy`. Only configure GENLAYER_CONTRACT after both match. Set this public address in hosted runtime settings; locally use the ignored `.dev.vars` file based on `.dev.vars.example`. BRAVE_SEARCH_API_KEY is optional; without it, discovery is limited to Wikipedia and the supplied URL.

Drafts save their contract address immutably. A draft created before configuration has an empty contract field: create a fresh check after deployment rather than silently changing the payload's destination.

## Live release gate

Run one real-wallet check on the deployed domain, then a check with irrelevant evidence. Keep claim input, candidate URLs, input SHA-256, contract/source version, wallet/browser, EVM hash, GenLayer ID, execution result, result read-back and finality. Confirm private website checks remain private on the site while their chain data may be public.

Exercise wallet rejection, wrong chain, insufficient GEN, refresh, lost response, and recovered hash. Do not automatically resend after timeout. Measure representative source/LLM execution branches and refresh fees before signing. A mocked browser or direct fixture is not proof of live consensus.

Official references checked 6 October 2026: [CLI deployment](https://docs.genlayer.com/developers/intelligent-contracts/deploying/cli-deployment), [network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration), [networks](https://docs.genlayer.com/developers/networks), [writing data](https://docs.genlayer.com/developers/decentralized-applications/writing-data), and [non-determinism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism).

## Website hosting on Vercel

The source is in the public repository https://github.com/Inclover05/claimlens. The Vercel project is https://vercel.com/inclover05s-projects/claimlens, linked to the main branch. Vercel uses vercel.json and npm run build:vercel for the standard Next.js runtime. The existing Sites build remains available separately.

A dedicated Neon Free-plan database, claimlens-db, is connected in Frankfurt to this project's production, preview and development environments. Its schema is applied, and production wallet sign-in and private draft storage pass the API checks. Production still requires Vercel sign-in pending approval to open website access.

To refresh a local environment from this project, sync DATABASE_URL to the ignored .env.local file and apply the idempotent schema. Never commit the connection string:

```powershell
npx vercel env pull .env.local --yes --scope inclover05s-projects
npm run db:migrate:vercel
npm run dev:vercel -- --hostname 127.0.0.1
```

The migration runs atomically and creates the ClaimLens tables and feed indexes. The database adapter keeps values in parameterized queries and preserves the atomic sign-in/session batch. The Cloudflare Worker supplies its own request-scoped D1 database; Vercel uses Neon, so existing data is not automatically copied between hosts.

After future environment changes, redeploy so the running deployment receives them. The production API checks cover a real wallet signature, used-challenge rejection, saved private draft, guest denial, public-feed exclusion, logout, and the missing-contract gate; evidence is recorded in reports/api-verification-vercel.json. GenLayer deployment and real consensus verification remain pending.
