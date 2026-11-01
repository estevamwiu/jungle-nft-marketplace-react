# Jungle NFT Marketplace

Marketplace frontend built with React, TypeScript, TanStack Router and
TanStack Query. The API, session, wallet, checkout and real-time updates are
simulated locally with MSW; no production backend or blockchain wallet is
required.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. MSW starts before React renders the application,
so the mocked API is also available in development and production builds.
There are no environment variables or external services required.

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
```

Install the Playwright browser once before running E2E tests:

```bash
npx playwright install chromium
```

Playwright starts Vite automatically, uses isolated browser contexts, and
retains traces, screenshots and video for failures under `test-results/`.
The HTML report is written to `playwright-report/`.

## Current E2E coverage

The Playwright suite currently checks catalog filters, sorting, pagination and
history, direct NFT routes and not-found handling, latency and catalog
recovery, account isolation and expired sessions, favorite failure recovery,
registration and invalid-login feedback, password changes, wallet validation
and persistence, cart quantity/coupon persistence and invalid/expired coupon
feedback, and successful, declined and timed-out checkout flows. It also
covers wallet-connection retry, pending-order recovery after a socket
interruption and reload, live Socket.IO price updates, stale/duplicate event
handling, profile persistence, cart additions made while an order is pending,
and keyboard focus behavior for the image dialog. Each flow runs at 1440px
desktop and 390px mobile. Visual-baseline coverage is still being expanded.
