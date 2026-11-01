import type { OrderUpdatedEvent } from "@/features/checkout/types"

export type { OrderUpdatedEvent }

export interface NftUpdatedEvent {
  eventId: string
  resource: {
    type: "nft"
    id: string
  }
  version: number
  data: {
    id: string
    price: string
    available: boolean
    availableQuantity: number
  }
}
