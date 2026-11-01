const SCENARIO_STORAGE_KEY = "kurio-mock-scenario"

const RESET_KEYS = [
  "jungle-auth-token",
  "jungle-nft-cart",
  "kurio-mock-users",
  "kurio-mock-sessions",
  "kurio-mock-favorites",
  "kurio-mock-orders",
  "kurio-applied-coupon",
]

const RESET_PREFIXES = [
  "kurio-profile-",
  "kurio-wallets-v2-",
  "kurio-orders-",
  "kurio-pending-order-",
  "kurio-order-idempotency-",
]

export type MockScenario =
  | "default"
  | "latency"
  | "variable-latency"
  | "out-of-order"
  | "network-error"
  | "http-error"
  | "catalog-error"
  | "quote-error"
  | "favorites-error"
  | "session-expired"
  | "payment-timeout"
  | "payment-declined"
  | "socket-disconnect"
  | "wallet-rejected"

const scenarios = new Set<MockScenario>([
  "default",
  "latency",
  "variable-latency",
  "out-of-order",
  "network-error",
  "http-error",
  "catalog-error",
  "quote-error",
  "favorites-error",
  "session-expired",
  "payment-timeout",
  "payment-declined",
  "socket-disconnect",
  "wallet-rejected",
])

function resetMockStorage() {
  for (const key of RESET_KEYS) {
    localStorage.removeItem(key)
  }

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)

    if (key && RESET_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      localStorage.removeItem(key)
    }
  }
}

export function initializeMockScenario() {
  const url = new URL(window.location.href)
  const requestedScenario = url.searchParams.get("scenario")

  if (requestedScenario === "reset") {
    resetMockStorage()
    localStorage.setItem(SCENARIO_STORAGE_KEY, "default")
    url.searchParams.delete("scenario")
    window.history.replaceState(window.history.state, "", url)
    return
  }

  if (
    requestedScenario &&
    scenarios.has(requestedScenario as MockScenario)
  ) {
    localStorage.setItem(SCENARIO_STORAGE_KEY, requestedScenario)
  } else if (!localStorage.getItem(SCENARIO_STORAGE_KEY)) {
    localStorage.setItem(SCENARIO_STORAGE_KEY, "default")
  }
}

export function getMockScenario(): MockScenario {
  const scenario =
    localStorage.getItem(SCENARIO_STORAGE_KEY) ?? "default"

  return scenarios.has(scenario as MockScenario)
    ? (scenario as MockScenario)
    : "default"
}

export function waitForMockLatency(
  scenario = getMockScenario(),
  requestIndex = 0
): Promise<void> {
  const duration =
    scenario === "latency"
      ? 1_200
      : scenario === "variable-latency"
        ? 250 + (requestIndex % 4) * 350
        : 0

  return duration === 0
    ? Promise.resolve()
    : new Promise((resolve) => {
        window.setTimeout(resolve, duration)
      })
}
