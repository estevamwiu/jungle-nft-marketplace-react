
import {
  createContext,
  useEffect,
  useCallback,
  useReducer,
  type ReactNode,
} from "react"

import type { NFT } from "@/features/nft/types"
import type {
  CartAction,
  CartItem,
  CartState,
} from "../types"
import {
  isEthAmount,
  multiplyEth,
  sumEth,
} from "@/lib/money"

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
      const items: CartItem[] = []

      for (const item of parsed.items) {
        if (
          typeof item !== "object" ||
          item === null ||
          !("quantity" in item) ||
          typeof item.quantity !== "number" ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1 ||
          !("nft" in item) ||
          typeof item.nft !== "object" ||
          item.nft === null
        ) {
          continue
        }

        const nft = item.nft
        const price =
          "price" in nft && typeof nft.price === "number"
            ? String(nft.price)
            : "price" in nft
              ? nft.price
              : null
        const availableQuantity =
          !("availableQuantity" in nft)
            ? "available" in nft && nft.available
              ? 5
              : 0
            : typeof nft.availableQuantity === "number" &&
                Number.isSafeInteger(nft.availableQuantity) &&
                nft.availableQuantity >= 0
              ? nft.availableQuantity
              : null

        if (
          !("id" in nft) ||
          typeof nft.id !== "string" ||
          !("name" in nft) ||
          typeof nft.name !== "string" ||
          !("description" in nft) ||
          typeof nft.description !== "string" ||
          !("image" in nft) ||
          typeof nft.image !== "string" ||
          !("creator" in nft) ||
          typeof nft.creator !== "string" ||
          !("category" in nft) ||
          typeof nft.category !== "string" ||
          !("available" in nft) ||
          typeof nft.available !== "boolean" ||
          availableQuantity === null ||
          !isEthAmount(price)
        ) {
          continue
        }

        items.push({
          nft: {
            id: nft.id,
            name: nft.name,
            description: nft.description,
            image: nft.image,
            price,
            creator: nft.creator,
            category: nft.category,
            available: nft.available,
            availableQuantity,
          },
          quantity: item.quantity,
        })
      }

      return { items }
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
      if (
        !action.payload.available ||
        action.payload.availableQuantity < 1
      ) {
        return state
      }

      const existingItem = state.items.find(
        (item) => item.nft.id === action.payload.id
      )

      if (existingItem) {
        if (
          existingItem.quantity >=
          action.payload.availableQuantity
        ) {
          return state
        }

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

    case "UPDATE_QUANTITY": {
      if (
        !Number.isSafeInteger(action.payload.quantity) ||
        action.payload.quantity < 1
      ) {
        return state
      }

      const currentItem = state.items.find(
        (item) => item.nft.id === action.payload.id
      )

      if (!currentItem || currentItem.nft.availableQuantity < 1) {
        return state
      }

      const quantity = Math.min(
        action.payload.quantity,
        currentItem.nft.availableQuantity
      )

      return {
        items: state.items.map((item) =>
          item.nft.id === action.payload.id
            ? { ...item, quantity }
            : item
        ),
      }
    }

    case "UPDATE_NFT": {
      return {
        items: state.items.map((item) =>
          item.nft.id === action.payload.id
            ? {
                ...item,
                nft: {
                  ...item.nft,
                  price: action.payload.price,
                  available: action.payload.available,
                  availableQuantity: action.payload.availableQuantity,
                },
                quantity:
                  action.payload.availableQuantity > 0
                    ? Math.min(
                        item.quantity,
                        action.payload.availableQuantity
                      )
                    : item.quantity,
              }
            : item
        ),
      }
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

  const totalPrice = sumEth(
    state.items.map((item) =>
      multiplyEth(item.nft.price, item.quantity)
    )
  )

  const addItem = (nft: NFT) =>
    dispatch({ type: "ADD_ITEM", payload: nft })

  const updateNFT = useCallback(
    (
      nft: Pick<
        NFT,
        "id" | "price" | "available" | "availableQuantity"
      >
    ) =>
      dispatch({ type: "UPDATE_NFT", payload: nft }),
    []
  )

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

  const clearCart = useCallback(
    () => dispatch({ type: "CLEAR_CART" }),
    []
  )

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addItem,
        updateNFT,
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
