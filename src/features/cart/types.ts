
import type { NFT } from "@/features/nft/types"

export interface CartItem {
  nft: NFT
  quantity: number
}

export interface CartState {
  items: CartItem[]
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: NFT }
  | { type: "REMOVE_ITEM"; payload: string }
  | {
      type: "UPDATE_QUANTITY"
      payload: {
        id: string
        quantity: number
      }
    }
  | { type: "CLEAR_CART" }
