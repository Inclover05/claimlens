# ClaimLens

A fact-checking application built for GenLayer Bradbury. People submit one English factual claim, inspect candidate sources, approve a GEN fee, and read the Intelligent Contract's evidence-based conclusion and consensus record.

## Current state

The cinematic interface, private/public drafts, wallet sign-in, profile, source discovery, lifecycle display and transaction recovery are implemented. The corrected Bradbury contract is deployed at `0x9d707FdFF0d5C851DDAe081616CCdb60A4B09598`, finalized with successful execution and matching source/policy. It replaces an initial deployment whose live test exposed premature HTML truncation. A real NASA-backed check has a finalized Supported result with independent final-state read-back. A fresh irrelevant-evidence check returned Insufficient evidence and is accepted. Two separate paid X-post checks produced no consensus; both debug traces record UNGROUNDED_QUOTE, and the app displays no verdict. X verdicts are not verified as working.

The [public GitHub repository](https://github.com/Inclover05/claimlens) deploys automatically to [Vercel](https://claimlens-inclover05s-projects.vercel.app). A dedicated Neon Free-plan database is connected and the deployed sign-in and private draft API checks pass. The website is publicly accessible without Vercel sign-in. A [real finalized example](https://claimlens-inclover05s-projects.vercel.app/checks/65ad7eca-ffa7-419b-8053-791ce0773550) is available for review. Fresh anonymous browser checks pass for the homepage, themes, mobile layout, motion controls, configuration and public feed.

See [PROJECT_BRIEF.md](PROJECT_BRIEF.md) for the accepted design brief, [DEPLOYMENT.md](DEPLOYMENT.md) for network and deployment preparation, and [reports/verification.md](reports/verification.md) for verified capabilities and remaining live checks.

## Run locally

Node.js 22.13 or later is required. Dependencies are pinned in package-lock.json.

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

