import type {
  OrderSnapshot,
  OrderStatus,
  OrderUpdatedEvent,
} from "@/features/checkout/types"
import {
  mockNfts,
  purchaseMockNftStock,
} from "./nft-store"
import type { NftUpdatedEvent } from "@/features/realtime/types"
import {
  compareEth,
  fromWei,
  isEthAmount,
  toWei,
} from "@/lib/money"
import {
  calculateMockQuote,
  quotesMatch,
} from "./quote-store"
import type { QuoteSnapshot } from "@/features/checkout/types"

interface StoredOrder extends OrderSnapshot {
  idempotencyKey: string
  fingerprint: string
}

interface OrderItemInput {
  nftId: string
  quantity: number
  expectedPrice: string
}

const STORAGE_KEY = "kurio-mock-orders"

function isStoredOrder(value: unknown): value is StoredOrder {
  if (typeof value !== "object" || value === null) {
    return false
  }

  return (
    "orderId" in value &&
    typeof value.orderId === "string" &&
    "userId" in value &&
    typeof value.userId === "string" &&
    "status" in value &&
    (value.status === "pending" ||
      value.status === "confirmed" ||
      value.status === "declined") &&
    "total" in value &&
    isEthAmount(value.total) &&
    "subtotal" in value &&
    isEthAmount(value.subtotal) &&
    "discount" in value &&
    isEthAmount(value.discount) &&
    "networkFee" in value &&
    isEthAmount(value.networkFee) &&
    "couponCode" in value &&
    (typeof value.couponCode === "string" ||
      value.couponCode === null) &&
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string" &&
        "name" in item &&
        typeof item.name === "string" &&
        "image" in item &&
        typeof item.image === "string" &&
        "price" in item &&
        isEthAmount(item.price) &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    ) &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "version" in value &&
    typeof value.version === "number" &&
    Number.isInteger(value.version) &&
    "idempotencyKey" in value &&
    typeof value.idempotencyKey === "string" &&
    "fingerprint" in value &&
    typeof value.fingerprint === "string"
  )
}

function legacyAmount(value: unknown): string | null {
  if (isEthAmount(value)) {
    return value
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    const normalized = value.toString()
    return isEthAmount(normalized) ? normalized : null
  }

  return null
}

function migrateStoredOrder(value: unknown): StoredOrder | null {
  if (isStoredOrder(value)) {
    return value
  }

  if (
    typeof value !== "object" ||
    value === null ||
    !("orderId" in value) ||
    typeof value.orderId !== "string" ||
    !("userId" in value) ||
    typeof value.userId !== "string" ||
    !("status" in value) ||
    (value.status !== "pending" &&
      value.status !== "confirmed" &&
      value.status !== "declined") ||
    !("items" in value) ||
    !Array.isArray(value.items) ||
    !("createdAt" in value) ||
    typeof value.createdAt !== "string" ||
    !("version" in value) ||
    typeof value.version !== "number" ||
    !Number.isInteger(value.version) ||
    !("idempotencyKey" in value) ||
    typeof value.idempotencyKey !== "string" ||
    !("fingerprint" in value) ||
    typeof value.fingerprint !== "string"
  ) {
    return null
  }

  const total = "total" in value ? legacyAmount(value.total) : null
  const items = value.items.map((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("id" in item) ||
      typeof item.id !== "string" ||
      !("name" in item) ||
      typeof item.name !== "string" ||
      !("image" in item) ||
      typeof item.image !== "string" ||
      !("price" in item) ||
      !("quantity" in item) ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return null
    }

    const price = legacyAmount(item.price)
    return price
      ? {
          id: item.id,
          name: item.name,
          image: item.image,
          price,
          quantity: item.quantity,
        }
      : null
  })

  if (!total || items.some((item) => item === null)) {
    return null
  }

  const normalizedItems = items.filter(
    (item): item is NonNullable<typeof item> => item !== null
  )

  return {
    orderId: value.orderId,
    userId: value.userId,
    status: value.status,
    subtotal: fromWei(
      normalizedItems.reduce(
        (sum, item) => sum + toWei(item.price) * BigInt(item.quantity),
        0n
      )
    ),
    discount: "0",
    networkFee: "0",
    total,
    couponCode: null,
    items: normalizedItems,
    createdAt: value.createdAt,
    version: value.version,
    idempotencyKey: value.idempotencyKey,
    fingerprint: value.fingerprint,
  }
}

function readOrders(): StoredOrder[] {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  const parsed: unknown = JSON.parse(raw)

  if (!Array.isArray(parsed)) {
    throw new Error("O armazenamento de pedidos simulados está inválido.")
  }

  const migrated = parsed.map(migrateStoredOrder)

  if (migrated.some((order) => order === null)) {
    throw new Error("O armazenamento de pedidos simulados está inválido.")
  }

  const orders = migrated.filter(
    (order): order is StoredOrder => order !== null
  )

  if (parsed.some((order) => !isStoredOrder(order))) {
    saveOrders(orders)
  }

  return orders
}

function saveOrders(orders: StoredOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

function toEvent(order: StoredOrder): OrderUpdatedEvent {
  return {
    eventId: `${order.orderId}:${order.version}`,
    resource: {
      type: "order",
      id: order.orderId,
    },
    version: order.version,
    data: {
      orderId: order.orderId,
      userId: order.userId,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      networkFee: order.networkFee,
      total: order.total,
      couponCode: order.couponCode,
      items: order.items,
      createdAt: order.createdAt,
      version: order.version,
    },
  }
}

export function getMockOrder(orderId: string): OrderSnapshot | null {
  const order = readOrders().find((item) => item.orderId === orderId)
  return order ? toEvent(order).data : null
}

export function createMockOrder(
  userId: string,
  idempotencyKey: string,
  items: OrderItemInput[],
  quote: QuoteSnapshot
):
  | { kind: "created"; order: OrderSnapshot }
  | { kind: "existing"; order: OrderSnapshot }
  | { kind: "conflict" }
  | { kind: "unavailable" }
  | { kind: "insufficient-stock" }
  | { kind: "stale-price" }
  | { kind: "stale-quote"; quote: QuoteSnapshot }
  | { kind: "coupon-invalid" }
  | { kind: "coupon-expired" }
  | { kind: "invalid" } {
  const orders = readOrders()
  const fingerprint = JSON.stringify(
    {
      couponCode: quote.couponCode,
      items: [...items]
        .sort((left, right) => left.nftId.localeCompare(right.nftId))
        .map(({ nftId, quantity, expectedPrice }) => ({
          nftId,
          quantity,
          expectedPrice,
        })),
    }
  )

  const existing = orders.find(
    (order) =>
      order.userId === userId &&
      order.idempotencyKey === idempotencyKey
  )

  if (existing) {
    if (existing.fingerprint !== fingerprint) {
      return { kind: "conflict" }
    }

    return { kind: "existing", order: toEvent(existing).data }
  }

  const seenNftIds = new Set<string>()

  for (const item of items) {
    if (seenNftIds.has(item.nftId)) {
      return { kind: "invalid" }
    }

    seenNftIds.add(item.nftId)
    const nft = mockNfts.find((candidate) => candidate.id === item.nftId)

    if (!nft) {
      return { kind: "invalid" }
    }

    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      !isEthAmount(item.expectedPrice)
    ) {
      return { kind: "invalid" }
    }

    if (compareEth(nft.price, item.expectedPrice) !== 0) {
      return { kind: "stale-price" }
    }

  }

  const currentQuote = calculateMockQuote(
    items.map(({ nftId, quantity }) => ({ nftId, quantity })),
    quote.couponCode ?? ""
  )

  if (currentQuote.kind !== "quoted") {
    if (currentQuote.kind === "unavailable") {
      return { kind: "unavailable" }
    }

    if (currentQuote.kind === "insufficient-stock") {
      return { kind: "insufficient-stock" }
    }

    if (currentQuote.kind === "coupon-invalid") {
      return { kind: "coupon-invalid" }
    }

    if (currentQuote.kind === "coupon-expired") {
      return { kind: "coupon-expired" }
    }

    return { kind: "invalid" }
  }

  if (Date.parse(quote.expiresAt) <= Date.now()) {
    return { kind: "stale-quote", quote: currentQuote.quote }
  }

  if (!quotesMatch(quote, currentQuote.quote)) {
    return { kind: "stale-quote", quote: currentQuote.quote }
  }

  const order: StoredOrder = {
    orderId: crypto.randomUUID(),
    userId,
    status: "pending",
    subtotal: currentQuote.quote.subtotal,
    discount: currentQuote.quote.discount,
    networkFee: currentQuote.quote.networkFee,
    total: currentQuote.quote.total,
    couponCode: currentQuote.quote.couponCode,
    items: currentQuote.quote.items,
    createdAt: new Date().toISOString(),
    version: 1,
    idempotencyKey,
    fingerprint,
  }

  orders.push(order)
  saveOrders(orders)

  return { kind: "created", order: toEvent(order).data }
}

export function finalizeMockOrder(
  orderId: string,
  status: Extract<OrderStatus, "confirmed" | "declined">
): { orderEvent: OrderUpdatedEvent; nftEvents: NftUpdatedEvent[] } | null {
  const orders = readOrders()
  const order = orders.find((item) => item.orderId === orderId)

  if (!order || order.status !== "pending") {
    return null
  }

  const nftEvents =
    status === "confirmed"
      ? purchaseMockNftStock(
          order.items.map((item) => ({
            nftId: item.id,
            quantity: item.quantity,
          }))
        )
      : []

  order.status = status === "confirmed" && nftEvents === null
    ? "declined"
    : status
  order.version += 1
  saveOrders(orders)

  return {
    orderEvent: toEvent(order),
    nftEvents: nftEvents ?? [],
  }
}

export function findMockOrderEvent(
  orderId: string,
  userId: string
): OrderUpdatedEvent | null {
  const order = readOrders().find(
    (item) => item.orderId === orderId && item.userId === userId
  )
  return order ? toEvent(order) : null
}
