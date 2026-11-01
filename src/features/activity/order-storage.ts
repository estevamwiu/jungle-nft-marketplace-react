export interface OrderItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
}

export interface SavedOrder {
  orderId: string
  total: number
  items: OrderItem[]
  createdAt: string
  status: "completed"
}

const storageKey = (userId: string) => `kurio-orders-${userId}`

export function getOrders(userId: string): SavedOrder[] {
  try {
    const stored = localStorage.getItem(storageKey(userId))

    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)

    if (!Array.isArray(parsed)) return []

    return parsed.filter((order): order is SavedOrder => {
      if (typeof order !== "object" || order === null) return false

      const value = order as Partial<SavedOrder>

      return (
        typeof value.orderId === "string" &&
        typeof value.total === "number" &&
        Number.isFinite(value.total) &&
        typeof value.createdAt === "string" &&
        value.status === "completed" &&
        Array.isArray(value.items) &&
        value.items.every(
          (item) =>
            item !== null &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.image === "string" &&
            typeof item.price === "number" &&
            typeof item.quantity === "number"
        )
      )
    })
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