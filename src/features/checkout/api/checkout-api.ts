
import { api } from "@/lib/api/axios"
import type { OrderSnapshot, QuoteSnapshot } from "../types"

export interface CheckoutItem {
  nftId: string
  quantity: number
  expectedPrice: string
}

export interface CheckoutResponse extends OrderSnapshot {
  message: string
  replayed: boolean
}

export async function createOrder(
  items: CheckoutItem[],
  quote: QuoteSnapshot,
  token: string,
  idempotencyKey: string
): Promise<CheckoutResponse> {
  const response = await api.post<CheckoutResponse>(
    "/checkout",
    { items, quote },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": idempotencyKey,
      },
    }
  )

  return response.data
}

export async function getOrder(
  orderId: string,
  token: string
): Promise<OrderSnapshot> {
  const response = await api.get<OrderSnapshot>(
    `/orders/${encodeURIComponent(orderId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return response.data
}
