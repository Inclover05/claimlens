# ClaimLens build brief

Updated by the user on 6 October 2026. This brief supersedes the unavailable earlier build instructions.

## Product

Build a fact-checking application on GenLayer for a GenLayer Builder Portal submission. Users bring a factual claim and optional source link. GenLayer validators independently evaluate evidence and own the recorded judgment. Preserve the existing claim composer, public feed, wallet profiles, dashboard, private website checks, GEN fee review, citations, and transaction lifecycle.

## Required visual skills

- logo-animation: https://github.com/iart-ai/motion-design-skills — skills/logo-animation
- liquid-glass-design: https://github.com/affaan-m/ecc — skills/liquid-glass-design
- react-three-fiber: https://github.com/freshtechbro/claudedesignskills — .claude/skills/react-three-fiber

Apply all three together. The user requested a beautiful, intriguing, cinematic display and motion design. The glass skill is written for native Apple interfaces; translate its material hierarchy, selective glass, contrast, and interaction principles to the web rather than adding native Swift APIs.

## Visual direction

An evidence observatory: deep forest surfaces, luminous green glass, warm white type, a floating animated optical lens, and one short masked brand reveal. Keep the working claim form immediately available. Provide a light appearance, responsive layouts, visible focus, readable text, reduced-motion fallbacks, and a pause control for continuous animation.

## Completion evidence

Verify the real interface and wallet/draft journey, source and result handling, fee review, execution status, independent contract judgment, and a fresh claim. Record precisely which flows pass and which remain unverified. Never fabricate live verdicts, successful transactions, a deployed contract, or Builder Portal acceptance. Website-private checks must disclose that chain records can remain public.

## Authority

The user supplied the three repositories and authorized restoring the skills and continuing work with full access. No request was made to submit the project to the portal on the user's behalf.

## OpenProof playbook applied (6 October 2026)

The attached OpenProof retrospective is implementation guidance, not a change of ClaimLens product scope. Its prior contract addresses, verdict history and Builder acceptance do not prove anything about this app.

Applied lessons: keep the explicitly selected EIP-6963 provider after navigation; validate account and chain; use separate wallet/EVM and GenLayer lifecycle endpoints; distinguish rejection from uncertain broadcast; retain returned hashes through API outages; make hash attachment idempotent; preserve retry locks; keep replay results immutable before deterministic metadata; require execution success and matching provenance before displaying a verdict; label finality separately; keep fixture evidence distinct from live checks.

The user confirmed there is no existing ClaimLens deployment and asked to prepare deployment from this code. The funded test wallet has deployed the corrected source and its source-verified address is configured on Vercel. Public browser checks pass, including an accepted fact-check result. DEPLOYMENT.md and reports/verification.md track finality and the remaining live evidence tests.
