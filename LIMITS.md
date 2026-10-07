# ClaimLens operating limits

ClaimLens adjudicates a submitted statement against selected evidence. It cannot guarantee that a claim will receive a verdict, that every relevant source was found, or that a consensus verdict is infallible. This is a Bradbury testnet application.

## Evidence and claim scope

- One English statement per request. Up to 600 characters without an original link, or 2,400 with a link.
- One to four public HTTPS evidence links. The owner can select or replace them while the check is a draft. Starting a wallet attempt fixes the request and its SHA-256 hash.
- The bounded revision reads at most 1 MB of HTML per page, extracts at most 6,000 text characters per page, and uses at most 12,000 text characters overall, in source order. Sources beyond the text budget may not be fetched. These are limits, not exhaustive document review.
- Only fetched text supports a verdict. Images, video, audio, attachments, embedded charts and later table sections are not analyzed. No historical snapshot is retained. The exact input and short quotations are recorded, but live pages can change.
- Source discovery supplies candidates, not proof. Without Brave Search configuration, it uses Wikipedia and the original link. Multiple Wikipedia pages are not independent primary sources. Search can fail, miss a source or choose irrelevant pages.
- X posts may be blocked or require sign-in. The user must quote the claim. Independent evidence may establish that claim without authenticating the post, account, media or author.
- Comparisons need a metric, scope and date. Common ambiguous comparisons are flagged before payment; the heuristic cannot recognize every ambiguity. If the submitted statement is still ambiguous or evidence is incomplete, Insufficient evidence is an appropriate result.
- Football comparisons search for matching international, club or career statistics. Prefer narrow record pages over biographies, and use the same competition, counting rules and date for both players. Wikipedia can help discovery; official FIFA, UEFA, league or federation records and specialist statistics pages can be supplied as evidence. A site's name does not guarantee that its tables are accessible within the text budget.
- Misleading requires interpretation of omitted context. It can overlap with a false statement or insufficient evidence. The rubric and validators determine the outcome; the website does not force an expected label.

## Consensus and execution

- Supported, Contradicted and Misleading require relevant citations. Citations are selected from existing source passages, at most four quotations of 10–160 characters each.
- A leader gets at most two model attempts. Each validator independently fetches evidence and uses one model call to derive a verdict and audit the proposal. A malformed, ungrounded or rejected answer never becomes a successful website verdict.
- Provider errors, inaccessible pages, changing sources, differing judgments, validator availability and protocol timeouts can prevent consensus. The receipt can distinguish execution errors, disagreement and timeouts; it does not always identify the underlying cause.
- ACCEPTED is provisional. FINALIZED alone does not mean the fact check succeeded. The app also requires successful execution, agreed consensus, and matching contract result provenance.
- No consensus is different from Insufficient evidence. The former has no agreed verdict; the latter is an agreed decision that the evidence does not establish the claim.
- Live GenVM simulation proves one execution/replay, not a real committee vote. Direct tests mock evidence/models and do not prove live reliability. Reports identify their scope.
- Protocol finality is asynchronous. There is no guaranteed completion time. The app refreshes every 15 seconds while visible and does not invent finality from a local timer.
- Checks use one Intelligent Contract and share its protocol execution queue. The app has not been load-tested. The sample tests establish individual flows, not a throughput or reliability percentage.

## Wallets, fees and privacy

- A failed or undecided check can still consume an EVM network fee. A fee estimate is an upper bound, not a verdict guarantee. ClaimLens adds no application fee.
- The stable Bradbury integration is pinned to genlayer-js 1.1.8 and its deployed consensus ABI. It estimates that deployment's EVM gas. Receipt costs are measured separately in reports/test-wallet-costs.json.
- The Consensus v0.6 release candidate has a different fee distribution, profiling, deposit/refund and appeal API. It must be tested with its matching Studio-dev/SDK family before a coordinated migration. The legacy gas measurements are **not** a v0.6 fee-profile.json.
- A wallet timeout is an uncertain outcome. Preserve and link the existing EVM hash. The app never automatically pays again to recover a check or appeal.
- Appeals are available before finality and require a separately approved transaction and any quoted bond. The UI and quote path are implemented; an actual paid appeal must be distinguished from simulated browser coverage in the release report.
- Private means owner-only access on the website. Blockchain claims, links, wallet addresses, evidence and results remain publicly inspectable. Submit no confidential information.

## Observed examples

The reports record successful live adjudications, failures and abstentions separately. In particular, the Neymar/CR7 test reached agreement on Insufficient evidence because the statement did not define which goals count and the truncated pages did not establish directly comparable totals. That is not evidence that the football assertion is true. See reports/comparison-evidence-limit.json.

Use the dated release report for the exact tested address, source hash, states, costs and remaining limitations. Historical reports describe earlier contracts and must not be treated as evidence for a later revision.

Official references: [application architecture](https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer), [independent verification](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle), [network versions](https://docs.genlayer.com/developers/networks), [v0.6 migration](https://docs.genlayer.com/developers/consensus-v06-migration).
