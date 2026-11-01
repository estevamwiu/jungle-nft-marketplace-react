import { createContext } from "react"

import type { NFT } from "@/features/nft/types"
import type { CartItem } from "../types"

interface CartContextValue {
  items: CartItem[]
  addItem: (nft: NFT) => void
  updateNFT: (
    nft: Pick<
      NFT,
      "id" | "price" | "available" | "availableQuantity"
    >
  ) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: string
}

export const CartContext =
  createContext<CartContextValue | undefined>(undefined)
