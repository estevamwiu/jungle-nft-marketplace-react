
import { api } from "@/lib/api/axios"

export interface CheckoutItem {
  nftId: string
  quantity: number
}

export interface CheckoutResponse {
  orderId: string
  message: string
  total: number
}

export async function createOrder(
  items: CheckoutItem[],
  token: string
): Promise<CheckoutResponse> {
  const response = await api.post<CheckoutResponse>(
    "/checkout",
    { items },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return response.data
}
