
import { useState } from "react"
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router"
import { isAxiosError } from "axios"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCart } from "@/features/cart/hooks/use.cart"
import { createOrder } from "@/features/checkout/api/checkout-api"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()

  const { isAuthenticated, isLoading, user } = useAuth()
  const { items, totalItems, totalPrice, clearCart } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: string
    total: number
  } | null>(null)

  async function handleConfirmOrder() {
    if (isSubmitting || completedOrder || items.length === 0) {
      return
    }

    if (!isAuthenticated) {
      await navigate({ to: "/login" })
      return
    }

    const token = localStorage.getItem("jungle-auth-token")

    if (!token) {
      setError("Sessão não encontrada. Faça login novamente.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await createOrder(
        items.map(({ nft, quantity }) => ({
          nftId: nft.id,
          quantity,
        })),
        token
      )

      setCompletedOrder({
        orderId: response.orderId,
        total: response.total,
      })

      clearCart()
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        setError(
          err.response?.data?.message ??
            "Não foi possível finalizar a compra."
        )
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (completedOrder) {
    return (
      <section className="mx-auto max-w-xl py-20 text-center">
        <div className="rounded-2xl border border-green-800 bg-slate-900 p-8">
          <div className="mb-4 text-5xl">
            ✓
          </div>

          <h1 className="text-3xl font-bold">
            Compra realizada!
          </h1>

          <p className="mt-4 text-slate-400">
            Seu pedido foi processado com sucesso.
          </p>

          <p className="mt-4 text-sm text-slate-400">
            Pedido: {completedOrder.orderId}
          </p>

          <p className="mt-4 text-xl font-semibold text-violet-400">
            Total: {completedOrder.total.toFixed(2)} ETH
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Esta é uma compra simulada. Nenhum pagamento real foi realizado.
          </p>

          <Button
            className="mt-8"
            onClick={() => void navigate({ to: "/" })}
          >
            Voltar ao marketplace
          </Button>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return (
      <p className="py-20 text-center text-slate-400">
        Verificando sessão...
      </p>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-2xl font-bold">
          Faça login para continuar
        </h1>

        <p className="mt-3 text-slate-400">
          Você precisa estar autenticado para finalizar a compra.
        </p>

        <Button
          className="mt-6"
          onClick={() => void navigate({ to: "/login" })}
        >
          Fazer login
        </Button>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-2xl font-bold">
          Seu carrinho está vazio
        </h1>

        <p className="mt-3 text-slate-400">
          Adicione NFTs antes de finalizar uma compra.
        </p>

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-3 text-white"
        >
          Explorar NFTs
        </Link>
      </section>
    )
  }

  return (
    <section className="py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Finalizar compra
      </h1>

      <p className="mb-8 text-slate-400">
        Confira os NFTs antes de confirmar seu pedido.
      </p>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-semibold">
            Itens do pedido
          </h2>

          {items.map(({ nft, quantity }) => (
            <article
              key={nft.id}
              className="flex items-center gap-4 rounded-xl border border-slate-800 p-4"
            >
              <img
                src={nft.image}
                alt={nft.name}
                className="h-24 w-24 rounded-lg object-cover"
              />

              <div className="flex-1">
                <h3 className="font-semibold">
                  {nft.name}
                </h3>

                <p className="text-sm text-slate-400">
                  Quantidade: {quantity}
                </p>

                <p className="mt-2 text-violet-400">
                  {(nft.price * quantity).toFixed(2)} ETH
                </p>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Resumo da compra
          </h2>

          <p className="mb-4 text-sm text-slate-400">
            Comprador: {user?.name}
          </p>

          <div className="mb-4 flex justify-between">
            <span>Quantidade</span>
            <span>{totalItems}</span>
          </div>

          <div className="flex justify-between border-t border-slate-700 pt-4">
            <span className="font-semibold">
              Total
            </span>

            <span className="text-xl font-bold text-violet-400">
              {totalPrice.toFixed(2)} ETH
            </span>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <Button
            className="mt-6 w-full"
            disabled={isSubmitting}
            onClick={() => void handleConfirmOrder()}
          >
            {isSubmitting
              ? "Processando..."
              : "Confirmar compra"}
          </Button>

          <Link
            to="/cart"
            className="mt-4 block text-center text-sm text-slate-400 hover:text-white"
          >
            Voltar ao carrinho
          </Link>

          <p className="mt-5 text-xs text-slate-500">
            Pagamento simulado. Nenhuma transação real será realizada.
          </p>
        </aside>
      </div>
    </section>
  )
}
