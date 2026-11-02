# Jungle NFT Marketplace

Marketplace frontend built with React, TypeScript, TanStack Router and
TanStack Query. The API, session, wallet, checkout and real-time updates are
simulated locally with MSW; no production backend or blockchain wallet is
required.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- Node.js 22.19+ or 24+ to run the Lighthouse audit

## Run locally

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. MSW starts before React renders the application,
so the mocked API is also available in development and production builds.
There are no environment variables or external services required.

## Deploy to Vercel

This repository is configured as a Vite single-page application. The Vercel
rewrite in `vercel.json` sends client-side routes back to `index.html`, so
direct links such as `/profile` and `/nft/1` work after deployment.

1. Push the project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Keep the detected Vite settings, or set:
   - Framework preset: **Vite**
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
4. No environment variables are required. Select **Deploy**.

The deployed site uses the same MSW mock API described below. Accounts, catalog,
wallets, checkout and real-time events are demonstrations; there is no
production backend, real wallet connection, payment processing or NFT transfer.

## Demo accounts

| E-mail | Password |
| --- | --- |
| `demo@jungle.com` | `123456` |
| `collector@jungle.com` | `123456` |

These are fictitious local accounts. Passwords are represented by PBKDF2
hashes in the mock; the demo password is never persisted as plain text.

## Mock scenarios

Append `?scenario=<name>` to the application URL. The chosen scenario is
persisted in local storage and remains active while navigating the app.

| Scenario | Effect |
| --- | --- |
| `default` | Normal mock responses and confirmed payments |
| `latency` | Adds 1.2 seconds to catalog requests |
| `variable-latency` | Adds reproducible delays from 250 to 1,300 ms to catalog requests |
| `out-of-order` | Delays older catalog pages and emits duplicate and stale order events |
| `network-error` | Simulates a connection failure for catalog and quote requests |
| `http-error` | Returns HTTP 503 for catalog and quote requests |
| `catalog-error` | Returns HTTP 503 for catalog requests |
| `quote-error` | Returns HTTP 503 for quote requests |
| `favorites-error` | Returns HTTP 503 for favorite mutations |
| `session-expired` | Rejects authenticated mock requests |
| `payment-timeout` | Persists the order, then returns HTTP 504 so retry can recover it idempotently |
| `payment-declined` | Finalizes the pending order as declined over the Socket.IO mock |
| `socket-disconnect` | Closes the mock WebSocket while an order is pending; reconnect/reload reconciles through REST |
| `wallet-rejected` | Rejects the simulated wallet connection |

Reset all mock data, account/session state, cart, favorites, profiles, wallets,
coupons and orders with:

```text
http://localhost:5173/?scenario=reset
```

The page resets storage, switches to `default`, and removes the reset query
parameter.

## Commands

```bash
npm run dev             # Development server with MSW
npm run typecheck       # TypeScript project checks
npm run lint            # ESLint
npm run build           # Type-check and production build
npm run preview         # Preview the production build
npm run test:e2e        # Playwright in desktop and mobile Chromium
npm run test:e2e:report # Open the most recent HTML test report
npm run audit:lighthouse # Build and generate three-run mobile/desktop Lighthouse reports
```

Install the Playwright browser once before running E2E tests:

```bash
npx playwright install chromium
```

Playwright starts Vite automatically, uses isolated browser contexts, and
retains traces, screenshots and video for failures under `test-results/`.
The HTML report is written to `playwright-report/`.

The Lighthouse command builds the production app, serves it locally, and
audits the home and NFT detail pages three times in mobile and desktop modes.
It writes individual HTML and JSON reports plus a median summary with tool
versions, environment, throttling settings, LCP, CLS and TBT to
`lighthouse-reports/`; these generated reports are ignored by Git.

### Lighthouse baseline

Three runs per page and profile on Node 24.12.0, Lighthouse 13.6.0 and Chrome
156.0.8078.4 (Windows x64), using the production build and default MSW mocks.
Lighthouse mobile simulation uses a 412 × 823 viewport, 4× CPU slowdown,
150 ms RTT and approximately 1.6 Mbps throughput. Desktop uses a 1350 × 940
viewport and Lighthouse's desktop throttling settings.

| Profile | Page | Performance | Accessibility | Best Practices | SEO | LCP median | CLS median | TBT median |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | Home | 59 | 100 | 100 | 100 | 4.57 s | 0.150 | 739 ms |
| Mobile | NFT details | 66 | 100 | 100 | 100 | 4.70 s | 0.000 | 706 ms |
| Desktop | Home | 98 | 100 | 100 | 100 | 1.02 s | 0.054 | 22 ms |
| Desktop | NFT details | 98 | 100 | 100 | 100 | 1.05 s | 0.000 | 8 ms |

The mobile Performance target (90) is not met. The mobile reports show about
1.6 s of JavaScript boot-up time, including approximately 783 ms attributed to
the MSW browser client and 643 ms to the main application chunk under the
4× CPU simulation. The production chunks are 466.82 kB (170.74 kB gzip) for
the MSW client and 300.10 kB (92.12 kB gzip) for the application. This startup
cost delays rendering of the largest content and contributes to the 706–739 ms
TBT; the home-page LCP breakdown also reports about 1.14 s of element render
delay. These measurements retain the required mock behavior and are not
adjusted to hide the cost. The home report additionally records one layout
shift attributed to the marketplace section (CLS 0.150); the detail page has
no measured layout shift.

## Visual regression

The visual E2E tests compare the marketplace home, catalog, NFT details, cart
and payment at 1440px desktop and 390px mobile. Those five pages also have
tablet baselines at 768px. To intentionally refresh the reviewed baselines
after a UI change, run:

```bash
npm run test:e2e -- e2e/visual.spec.ts --update-snapshots
```

Review the generated image changes before including updated snapshots.

## Current E2E coverage

The catalog follows the supplied design with nine Portuguese collection
filters, Ethereum/Polygon/Solana network filters, and four pages of mock NFTs;
the search field is intentionally omitted. The Playwright suite currently
checks catalog filters, sorting, pagination and history, direct NFT routes and
not-found handling, loading skeletons under
latency and catalog
recovery, account isolation and expired sessions, favorite failure recovery,
registration and invalid-login feedback, password changes, wallet validation
and persistence, cart quantity/coupon persistence and invalid/expired coupon
feedback, and successful, declined and timed-out checkout flows. It also
covers wallet-connection retry, pending-order recovery after a socket
interruption and reload, live Socket.IO price updates, stale/duplicate event
handling, profile persistence, cart additions made while an order is pending,
keyboard focus behavior for the image dialog, and visual baselines for the
marketplace home, catalog, NFT detail, cart and payment pages. Core E2E flows
run at 1440px desktop and 390px mobile; visual regression also covers the
768px tablet viewport.
