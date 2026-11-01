import { api } from "@/lib/api/axios"
import type { QuoteSnapshot } from "../types"

export interface QuoteItemInput {
  nftId: string
  quantity: number
}

export async function getQuote(
  items: QuoteItemInput[],
  couponCode: string,
  signal?: AbortSignal
): Promise<QuoteSnapshot> {
  const response = await api.post<QuoteSnapshot>(
    "/quotes",
    { items, couponCode },
    { signal }
  )

  return response.data
}
