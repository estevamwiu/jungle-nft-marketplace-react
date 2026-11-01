export type OrderStatus = "pending" | "confirmed" | "declined"

export interface OrderItemSnapshot {
  id: string
  name: string
  image: string
  price: string
  quantity: number
}

export interface OrderSnapshot {
  orderId: string
  userId: string
  status: OrderStatus
  subtotal: string
  discount: string
  networkFee: string
  total: string
  couponCode: string | null
  items: OrderItemSnapshot[]
  createdAt: string
  version: number
}

export interface QuoteSnapshot {
  quoteId: string
  subtotal: string
  discount: string
  networkFee: string
  total: string
  couponCode: string | null
  items: OrderItemSnapshot[]
  createdAt: string
  expiresAt: string
}

export interface OrderUpdatedEvent {
  eventId: string
  resource: {
    type: "order"
    id: string
  }
  version: number
  data: OrderSnapshot
}
