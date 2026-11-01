import { fromWei, isEthAmount, toWei } from "@/lib/money"

export interface OrderItem {
  id: string
  name: string
  image: string
  price: string
  quantity: number
}

export interface SavedOrder {
  orderId: string
  subtotal: string
  discount: string
  networkFee: string
  total: string
  couponCode: string | null
  items: OrderItem[]
  createdAt: string
  status: "confirmed" | "declined" | "completed"
}

const storageKey = (userId: string) => `kurio-orders-${userId}`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeAmount(value: unknown): string | null {
  if (isEthAmount(value)) {
    return value
  }

  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    const normalized = value.toString()
    return isEthAmount(normalized) ? normalized : null
  }

  return null
}

function normalizeOrder(value: unknown): SavedOrder | null {
  if (!isRecord(value)) {
    return null
  }

  const total = normalizeAmount(value.total)

  if (
    typeof value.orderId !== "string" ||
    !total ||
    typeof value.createdAt !== "string" ||
    (value.status !== "confirmed" &&
      value.status !== "declined" &&
      value.status !== "completed") ||
    !Array.isArray(value.items)
  ) {
    return null
  }

  const items = value.items.map((item): OrderItem | null => {
    if (!isRecord(item)) {
      return null
    }

    const price = normalizeAmount(item.price)

    if (
      typeof item.id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.image !== "string" ||
      !price ||
      typeof item.quantity !== "number" ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return null
    }

    return {
      id: item.id,
      name: item.name,
      image: item.image,
      price,
      quantity: item.quantity,
    }
  })

  if (items.some((item) => item === null)) {
    return null
  }

  const normalizedItems = items.filter(
    (item): item is OrderItem => item !== null
  )
  const calculatedSubtotal = fromWei(
    normalizedItems.reduce(
      (sum, item) => sum + toWei(item.price) * BigInt(item.quantity),
      0n
    )
  )
  const subtotal = normalizeAmount(value.subtotal)
  const discount = normalizeAmount(value.discount)
  const networkFee = normalizeAmount(value.networkFee)

  return {
    orderId: value.orderId,
    subtotal: subtotal ?? calculatedSubtotal,
    discount: discount ?? "0",
    networkFee: networkFee ?? "0",
    total,
    couponCode:
      typeof value.couponCode === "string" ? value.couponCode : null,
    items: normalizedItems,
    createdAt: value.createdAt,
    status: value.status,
  }
}

export function getOrders(userId: string): SavedOrder[] {
  try {
    const stored = localStorage.getItem(storageKey(userId))

    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)

    if (!Array.isArray(parsed)) return []

    const orders = parsed
      .map(normalizeOrder)
      .filter((order): order is SavedOrder => order !== null)

    if (JSON.stringify(orders) !== JSON.stringify(parsed)) {
      localStorage.setItem(storageKey(userId), JSON.stringify(orders))
    }

    return orders
  } catch {
    return []
  }
}

export function saveOrder(userId: string, order: SavedOrder): void {
  const orders = getOrders(userId)

  if (orders.some((existing) => existing.orderId === order.orderId)) {
    return
  }

  localStorage.setItem(
    storageKey(userId),
    JSON.stringify([order, ...orders])
  )
}