# Reliability corrections — 6 October 2026

The failed ordinary football claim and two failed X-post checks exposed a shared evidence-processing problem. Each debug replay returned `UNGROUNDED_QUOTE`; no rejected quotation was retained, so the exact offending text and reason for different validator fingerprints remain unknown. The successful opinion check needed no factual quotation and did not exercise that path.

The replacement contract supplies bounded, exact passages with IDs. Models select an existing passage for an exact fetched URL; the contract supplies its quotation text. An invented ID or URL fails validation. One bounded repair is allowed for invalid structured output. Validators independently fetch sources, assess the claim and check the proposed explanation. Expected processing errors cross the nondeterministic boundary as immutable data and require independent reproduction before the deterministic contract raises an error. Failed processing cannot be stored as an evidence verdict.

Discovery searches each side of a comparison and the complete assertion, reserves candidates for each query, preserves the supplied source and bounds the combined list to four URLs. Both search providers use this coverage. Unavailable, malformed, empty or unsafe search-service results reach the Wikipedia fallback. Candidate discovery never supplies a verdict.

The website exposes only controlled processing-error messages, preserves the original transaction and blocks another fee quote or wallet attempt for a draft tied to a retired contract. Existing transactions remain associated with their original contract and immutable payload.

## Regression evidence

- 21 Node tests pass, including both search providers, outage/malformed-response fallback, unsafe candidate rejection, source preservation, comparison coverage, retired-draft payment gates, public error filtering, lifecycle/provenance gates and uncertain-broadcast recovery.
- 17 direct contract tests pass against the pinned official SDK adapter. They cover exact Unicode passages, invented IDs/text, bounded repair, changed sources, independent disagreement, matching processing errors, partial source outages, all five result labels and different independent wording. These fixtures do not prove live GenVM execution or consensus.
- TypeScript and focused ESLint pass. The deployed contract source remains byte-for-byte unchanged while the surrounding discovery and regression coverage are improved.
- The original public football check displays its explicit quote-validation failure in an anonymous preview browser, with no verdict or payment button. See `processing-error-verification.json`; no new transaction was sent for that check.

Live replacement-contract results and finality must pass before production activation. The actual original failures remain in the investigation reports; none is overwritten or reclassified as a successful fact-check.
