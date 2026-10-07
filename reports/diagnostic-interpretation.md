# Reading unsuccessful attempts

Receipt status, execution outcome, consensus result and saved contract state are separate facts. A debug replay can propose a result even when no committee agreed to it. ClaimLens displays a verdict only after agreed successful execution and a provenance-matching contract read.

Some historical investigation reports contain `DETERMINISTIC_VIOLATION` in `votes`. Those strings came from **genlayer-js 1.1.8's validator vote lookup**, not an independently established root cause. They must not be treated as proof of memory-fingerprint corruption or a network-wide defect. The current official receipt documentation uses execution vote names that differ from this legacy lookup; the deployed ABI family must be established before translating raw values. Preserve numeric votes and result hashes when investigating. Do not substitute release-candidate labels into the pinned stable integration based on their numeric similarity.

The football diagnostic on 7 October 2026 did establish one narrower issue: an instrumented validator simulation rejected a supported comparison because it assumed the supplied evaluation date was in the future. The revised rubric makes `as_of` the explicit reference date, prohibits an assumed model clock and retains abstention for material source-date limitations. That change passed the real leader/validator football replay. It does not guarantee committee agreement or source freshness.

The unsuccessful X-plus-Wikipedia attempt remains unsuccessful. Its leader/debug proposal is not an accepted result. X availability, changing content, quoted passages, model audits and timeouts remain possible causes; its receipt alone does not isolate one cause.

Reference: [official receipt schema and execution votes](https://docs.genlayer.com/api-references/genlayer-node/gen/gen_getTransactionReceipt). The [version migration guide](https://docs.genlayer.com/developers/consensus-v06-migration) explains why an SDK, runner and deployment family must be migrated together.
