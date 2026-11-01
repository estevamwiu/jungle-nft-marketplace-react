
import { useContext } from "react"
import { CartContext } from "../context/CartContextValue"

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error(
      "useCart deve ser utilizado dentro de CartProvider"
    )
  }

  return context
}
