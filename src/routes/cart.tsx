
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useCart } from "@/features/cart/hooks/use.cart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/cart")({
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart()

  function handleCheckout() {
    if (!isAuthenticated) {
      void navigate({ to: "/login" })
      return
    }

    void navigate({ to: "/checkout" })
  }

  return (
    <section className="py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Meu carrinho
      </h1>

      <p className="mb-8 text-slate-400">
        {totalItems} NFT(s) no carrinho
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 p-10 text-center">
          <h2 className="text-xl font-semibold">
            Seu carrinho está vazio
          </h2>

          <p className="mt-3 text-slate-400">
            Explore o marketplace e adicione seus NFTs favoritos.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-3 text-white hover:bg-violet-700"
          >
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map(({ nft, quantity }) => (
              <article
                key={nft.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-800 p-4 sm:flex-row"
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="h-32 w-full rounded-lg object-cover sm:w-32"
                />

                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div>
                    <Link
                      to="/nft/$id"
                      params={{ id: nft.id }}
                      className="text-lg font-semibold hover:text-violet-400"
                    >
                      {nft.name}
                    </Link>

                    <p className="text-sm text-slate-400">
                      Criado por {nft.creator}
                    </p>

                    <p className="mt-2 font-semibold text-violet-400">
                      {nft.price.toFixed(2)} ETH
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={quantity <= 1}
                        onClick={() =>
                          updateQuantity(nft.id, quantity - 1)
                        }
                      >
                        −
                      </Button>

                      <span className="min-w-6 text-center">
                        {quantity}
                      </span>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(nft.id, quantity + 1)
                        }
                      >
                        +
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(nft.id)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-6 text-xl font-semibold">
              Resumo do pedido
            </h2>

            <div className="mb-4 flex justify-between text-slate-400">
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

            <Button
              type="button"
              className="mt-6 w-full"
              onClick={handleCheckout}
            >
              Finalizar compra
            </Button>

            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={clearCart}
            >
              Limpar carrinho
            </Button>
          </aside>
        </div>
      )}
    </section>
  )
}
