# Architecture

## Runtime and data flow

- `src/main.tsx` starts the MSW service worker and initializes the selected
  scenario before mounting React.
- TanStack Router owns route state. Catalog search and filters are URL-backed;
  discrete filter, sort and page changes create browser-history entries while
  text search replaces the current entry.
- Axios API modules call the mock REST endpoints. TanStack Query owns request
  lifecycle, caching, mutation state and invalidation.
- `src/mocks/handlers.ts` implements REST contracts and validates requests.
  Mock accounts, sessions, favorites, profiles, wallets and orders are stored
  in local storage where refresh persistence is required.
- `src/mocks/order-store.ts` is the order and idempotency source of truth.
  Quotes validate current prices, stock, coupon and expiration before an order
  is created.
- `src/mocks/realtime.ts` intercepts the Socket.IO-compatible WebSocket
  transport with `@mswjs/socket.io-binding`. The browser still uses
  `socket.io-client`; events are not dispatched directly into UI state.

## Session and account isolation

Each user has a distinct mock user ID. Authentication tokens resolve to one
user, and protected handlers validate that mapping. Favorites, profiles,
wallets and order history are keyed by user ID. `session-expired` makes
protected requests return 401 so the normal authentication recovery path is
exercised.

Passwords are PBKDF2 hashes with per-user salts. Demo credentials and fixture
data are intentionally fictitious and must not be used as real credentials.

## Cart and checkout

The cart is persisted locally and is independent of the order store. Checkout
requests a quote from the mock API, then creates an order with an
`Idempotency-Key`. Retrying an identical attempt returns the existing order;
reusing its key with different content is a conflict.

An order begins as `pending`. Socket.IO emits `order.updated`; the client also
polls REST while pending and recovers the order after refresh. A confirmed
order reduces only the purchased quantities from the current cart, preserving
additional quantities added while payment was pending. A declined order leaves
the cart intact. Terminal order statuses are not reverted by duplicate or
older events.

## Cache and realtime reconciliation

Catalog, detail, quote, favorite and order data use TanStack Query. Socket
events carry a stable resource identity and monotonically increasing version.
The client rejects duplicate or older versions, updates active cached
resources, and invalidates catalog and quote queries when an NFT changes.
After socket reconnection, active cart items and the pending order are
subscribed again; the REST order query reconciles the final state.

## Mock transport limitations

MSW's browser service worker intercepts REST requests and the
`@mswjs/socket.io-binding` adapter translates Socket.IO client events over a
mocked WebSocket connection. This validates client protocol and UI behavior,
but it is not a production Socket.IO server: there is no cross-browser server,
network infrastructure, blockchain, wallet extension or payment gateway.
Order state and fixture mutations are local to the browser context.
