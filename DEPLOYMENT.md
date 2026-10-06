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
