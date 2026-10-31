
import {
  createContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react"

import type { NFT } from "@/features/nft/types"
import type {
  CartAction,
  CartItem,
  CartState,
} from "../types"

interface CartContextValue {
  items: CartItem[]
  addItem: (nft: NFT) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

export const CartContext =
  createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = "jungle-nft-cart"

const initialState: CartState = {
  items: [],
}

function loadCart(): CartState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) return initialState

    const parsed: unknown = JSON.parse(stored)

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "items" in parsed &&
      Array.isArray(parsed.items)
    ) {
      return {
        items: parsed.items.filter(
          (item): item is CartItem =>
            typeof item === "object" &&
            item !== null &&
            typeof item.quantity === "number" &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            typeof item.nft?.id === "string" &&
            typeof item.nft?.price === "number"
        ),
      }
    }

    return initialState
  } catch {
    return initialState
  }
}

function cartReducer(
  state: CartState,
  action: CartAction
): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      if (!action.payload.available) return state

      const existingItem = state.items.find(
        (item) => item.nft.id === action.payload.id
      )

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.nft.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }
      }

      return {
        items: [
          ...state.items,
          { nft: action.payload, quantity: 1 },
        ],
      }
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter(
          (item) => item.nft.id !== action.payload
        ),
      }

    case "UPDATE_QUANTITY":
      if (
        !Number.isInteger(action.payload.quantity) ||
        action.payload.quantity < 1
      ) {
        return state
      }

      return {
        items: state.items.map((item) =>
          item.nft.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      }

    case "CLEAR_CART":
      return initialState

    default:
      return state
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(
    cartReducer,
    initialState,
    loadCart
  )

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    )
  }, [state])

  const totalItems = state.items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const totalPrice = state.items.reduce(
    (total, item) =>
      total + item.nft.price * item.quantity,
    0
  )

  const addItem = (nft: NFT) =>
    dispatch({ type: "ADD_ITEM", payload: nft })

  const removeItem = (id: string) =>
    dispatch({ type: "REMOVE_ITEM", payload: id })

  const updateQuantity = (
    id: string,
    quantity: number
  ) =>
    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { id, quantity },
    })

  const clearCart = () =>
    dispatch({ type: "CLEAR_CART" })

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
