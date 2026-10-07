# ClaimLens

A fact-checking application built for GenLayer Bradbury. People submit one English factual claim, inspect candidate sources, approve a GEN fee, and read the Intelligent Contract's evidence-based conclusion and consensus record.

## Current state

ClaimLens is an adjudication layer: its Intelligent Contract independently fetches selected evidence, proposes an evidence-grounded decision, has validators independently derive and audit it, and stores the agreed result with request provenance. The website discovers candidates, manages wallet requests and displays that record.

The current date-reference revision is `0x3E2C5298063d25e1111CFbe54526e46efe35eD3E`, source SHA-256 `49ddcba217c0b1070ff70bfaf623b24e4c387a190075514165ac5778408b9ca3`. It bounds evidence and model work, resolves citations from source passages, and gives both leader and validators the same explicit evaluation-date policy. See the dated release evidence in [reports/verification.md](reports/verification.md) for actual committee outcomes and finality; a deployment or a passing simulation alone is not live verdict proof.

The [public GitHub repository](https://github.com/Inclover05/claimlens) deploys automatically to [Vercel](https://claimlens-inclover05s-projects.vercel.app). A dedicated Neon Free-plan database is connected and the deployed sign-in and private draft API checks pass. The website is publicly accessible without Vercel sign-in. A [current-contract finalized example](https://claimlens-inclover05s-projects.vercel.app/checks/29821f47-106c-461f-8d6e-be4b868c6223) and a [scoped football check](https://claimlens-inclover05s-projects.vercel.app/checks/7b3c3c81-2ccb-4b42-ac2f-42f836acbc9e) are available for review. Each page shows its current review/finality state. Fresh anonymous browser checks pass for the homepage, themes, mobile layout, motion controls, configuration and public feed.

See [PROJECT_BRIEF.md](PROJECT_BRIEF.md) for the design brief, [DEPLOYMENT.md](DEPLOYMENT.md) for deployment, [architecture verification](reports/architecture-verification.md) for the GenLayer design questions, [LIMITS.md](LIMITS.md) for operating limits, [INTEGRATION.md](INTEGRATION.md) for consuming the adjudication record, and [SUBMISSION.md](SUBMISSION.md) for the Builder Portal submission draft.

## Run locally

Use Node.js 24, as configured in CI and Vercel. Dependencies are pinned in package-lock.json.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev:vercel -- --hostname 127.0.0.1
```

The Next.js preview uses http://127.0.0.1:5173. Set DATABASE_URL to a Neon PostgreSQL connection string in .env.local, then run npm run db:migrate:vercel. GENLAYER_CONTRACT stays empty until the contract is deployed; BRAVE_SEARCH_API_KEY is optional. Environment secrets stay outside Git.

The existing Cloudflare preview is available with npm run dev. It uses drizzle/0000_moaning_ares.sql and .dev.vars.example. Its request-scoped database binding is kept separate from the Vercel database.

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

To check an X post, select **Paste a link**, paste the public post URL and quote one factual claim. The app preserves the post URL and discovers independent candidate evidence. It does not automatically extract X text. Post access varies across requests; unavailable pages, failed quotation validation or absent consensus can prevent a verdict. Real test outcomes, including failures, are recorded in `reports/verification.md`.

Website privacy does not hide on-chain claims, source links, wallet addresses or results. The contract fetches and judges evidence independently. A draft, fee quote, receipt or Accepted status alone is not a finalized fact-check. After an uncertain wallet response, resolve the existing transaction rather than submitting again.

Vercel builds the app with npm run build:vercel using vercel.json. This project is already linked to GitHub and a dedicated free Neon database with DATABASE_URL configured. The schema in db/postgres.sql is applied with npm run db:migrate:vercel. Pushes to main deploy production; pull requests receive preview deployments. Keep the database URL and tokens in Vercel environment settings.

The existing Sites project and Cloudflare-compatible Worker/D1 build remain supported. .openai/hosting.json retains that project identity; its hosting audience and runtime secrets are managed outside the source repository. Each hosting provider uses its own database.

