# ClaimLens

A fact-checking application built for GenLayer Bradbury. People submit one English factual claim, inspect candidate sources, approve a GEN fee, and read the Intelligent Contract's evidence-based conclusion and consensus record.

## Current state

The cinematic interface, private/public drafts, wallet sign-in, profile, source discovery, lifecycle display and transaction recovery are implemented. The contract is prepared and tested in direct mode. No Bradbury contract has been deployed or configured yet; the app explicitly keeps checks as drafts until deployment.

See [PROJECT_BRIEF.md](PROJECT_BRIEF.md) for the accepted design brief, [DEPLOYMENT.md](DEPLOYMENT.md) for network and deployment preparation, and [reports/verification.md](reports/verification.md) for verified capabilities and remaining live checks.

## Run locally

Node.js 22.13 or later is required. Dependencies are pinned in package-lock.json.

```powershell
npm ci
npm run dev -- --hostname 127.0.0.1
```

The portable preview uses http://127.0.0.1:5173. The existing local D1 database uses drizzle/0000_moaning_ares.sql. Runtime settings are listed in `.dev.vars.example`; actual `.dev.vars` values stay outside Git. BRAVE_SEARCH_API_KEY is optional.

## Checks

```powershell
node node_modules/typescript/bin/tsc --noEmit
npm test
python -m pip install -r requirements.txt pytest
python scripts/contract-tools.py
python scripts/contract-tools.py test
node scripts/verify-deployment.mjs
```

The contract tooling adapter uses the official cached GenVM manager artifact and the pinned legacy runner. If that artifact is missing, follow the GenVM linter download setup before running it. Direct tests use captured validator replay and mocked evidence; they do not replace real-runtime consensus.

`scripts/browser-check.mjs` exercises form validation, mobile navigation, reduced motion and three-provider wallet recovery using Playwright fixtures. Install Playwright or set PLAYWRIGHT_MODULE to an existing installation; BROWSER_EXECUTABLE can select an installed Chromium browser. No blockchain transaction is sent. `scripts/api-check.mjs` signs into the real loopback API with an ephemeral unfunded account and creates one private local fixture draft; its public test address is recorded in the report.

## Design and motion

The interface combines a short masked brand reveal, selective translucent glass controls, and a lazy React Three Fiber evidence lens. Dark and light themes, pause controls, reduced motion, mobile static fallback and bounded canvas resolution are supported. The original GenLayer SVG is preserved. The standalone reveal at `/brand/logo-reveal.html` supports `?t=0`, `?t=0.55` and `?t=1.3` for frame inspection.

## Privacy and protocol

Website privacy does not hide on-chain claims, source links, wallet addresses or results. The contract fetches and judges evidence independently. A draft, fee quote, receipt or Accepted status alone is not a finalized fact-check. After an uncertain wallet response, resolve the existing transaction rather than submitting again.

The site is hosted through its existing Sites project and Cloudflare-compatible Worker/D1 build. `.openai/hosting.json` retains the project identity; hosting audience and runtime secrets are managed outside the source repository.
