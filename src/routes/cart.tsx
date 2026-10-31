
import { useState, type FormEvent } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

import { useCart } from "@/features/cart/hooks/use.cart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useNFTs } from "@/features/nft/hooks/use.nfts"

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

  const { data: nfts = [] } = useNFTs()

  const [promoCode, setPromoCode] = useState("")
  const [promoMessage, setPromoMessage] = useState("")

  const relatedNFTs = nfts
    .filter((nft) => !items.some((item) => item.nft.id === nft.id))
    .slice(0, 5)

  function handleCheckout() {
    if (items.length === 0) {
      return
    }

    if (!isAuthenticated) {
      void navigate({ to: "/login" })
      return
    }

    void navigate({ to: "/checkout" })
  }

  function handlePromoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!promoCode.trim()) {
      setPromoMessage("Informe um código promocional.")
      return
    }

    setPromoMessage(
      "Nenhuma promoção está disponível no momento."
    )
  }

  return (
    <section className="pb-16 pt-8 sm:pt-10">
      <nav
        aria-label="Navegação estrutural"
        className="mb-7 flex flex-wrap items-center gap-2 text-xs font-bold"
      >
        <Link
          to="/"
          className="text-kurio-muted transition-colors hover:text-kurio-primary"
        >
          Início
        </Link>

        <span className="text-kurio-muted">/</span>

        <Link
          to="/"
          hash="marketplace"
          className="text-kurio-muted transition-colors hover:text-kurio-primary"
        >
          Mercado
        </Link>

        <span className="text-kurio-muted">/</span>

        <span className="text-kurio-text">Carrinho</span>
      </nav>

      {items.length === 0 ? (
        <div className="border border-[#493026] bg-kurio-surface px-6 py-20 text-center">
          <ShoppingCart
            size={44}
            strokeWidth={1.5}
            className="mx-auto text-kurio-primary"
          />

          <h1 className="mt-6 text-2xl font-bold text-kurio-text">
            Seu carrinho está vazio
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-kurio-muted">
            Explore o marketplace e adicione seus NFTs favoritos
            à sua coleção.
          </p>

          <Link
            to="/"
            hash="marketplace"
            className="mt-8 inline-flex items-center justify-center bg-kurio-primary px-7 py-3 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
          >
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-14">
            <div className="min-w-0">
              <div className="mb-3 hidden grid-cols-[minmax(0,2.2fr)_0.9fr_0.9fr_1fr_30px] gap-4 border-b border-[#493026] pb-3 text-xs font-bold text-kurio-text md:grid">
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
                <span />
              </div>

              <div className="space-y-3">
                {items.map(({ nft, quantity }) => (
                  <article
                    key={nft.id}
                    className="grid gap-5 border border-[#493026] bg-kurio-surface p-4 md:grid-cols-[minmax(0,2.2fr)_0.9fr_0.9fr_1fr_30px] md:items-center md:gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <Link
                        to="/nft/$id"
                        params={{ id: nft.id }}
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#35221a] md:h-16 md:w-16"
                      >
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      <div className="min-w-0">
                        <Link
                          to="/nft/$id"
                          params={{ id: nft.id }}
                          className="block text-sm font-bold text-kurio-text transition-colors hover:text-kurio-primary"
                        >
                          {nft.name}
                        </Link>

                        <p className="mt-2 text-[11px] text-kurio-muted">
                          ID do token: #{nft.id.padStart(4, "0")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="mb-1 block text-[10px] text-kurio-muted md:hidden">
                        Preço
                      </span>

                      <span className="text-sm font-bold text-kurio-primary">
                        {nft.price.toFixed(2)} ETH
                      </span>
                    </div>

                    <div>
                      <span className="mb-2 block text-[10px] text-kurio-muted md:hidden">
                        Edições
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(nft.id, quantity - 1)
                          }
                          disabled={quantity <= 1}
                          aria-label={`Diminuir quantidade de ${nft.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-kurio-primary text-kurio-bg transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="min-w-5 text-center text-sm font-bold text-kurio-text">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(nft.id, quantity + 1)
                          }
                          aria-label={`Aumentar quantidade de ${nft.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-kurio-primary text-kurio-bg transition-opacity hover:opacity-85"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="mb-1 block text-[10px] text-kurio-muted md:hidden">
                        Total
                      </span>

                      <span className="text-sm font-bold text-kurio-primary">
                        {(nft.price * quantity).toFixed(2)} ETH
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(nft.id)}
                      aria-label={`Remover ${nft.name} do carrinho`}
                      title="Remover NFT"
                      className="justify-self-start text-kurio-muted transition-colors hover:text-red-400 md:justify-self-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-kurio-muted">
                  {totalItems} edição(ões) no carrinho
                </p>

                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-kurio-muted transition-colors hover:text-red-400"
                >
                  Limpar carrinho
                </button>
              </div>
            </div>

            <aside className="border-t border-[#493026] pt-3">
              <h2 className="mb-6 border-b border-[#493026] pb-3 text-base font-bold text-kurio-text">
                Resumo da carteira
              </h2>

              <div className="mb-7">
                <h3 className="mb-3 text-xs font-bold text-kurio-text">
                  Código promocional
                </h3>

                <form
                  onSubmit={handlePromoSubmit}
                  className="flex"
                >
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(event) => {
                      setPromoCode(event.target.value)
                      setPromoMessage("")
                    }}
                    placeholder="Digite o código promocional..."
                    aria-label="Código promocional"
                    className="min-w-0 flex-1 border border-[#704b35] bg-kurio-bg px-3 py-3 text-[11px] text-kurio-text outline-none placeholder:text-kurio-muted focus:border-kurio-primary"
                  />

                  <button
                    type="submit"
                    className="bg-kurio-primary px-4 py-3 text-xs font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
                  >
                    Aplicar
                  </button>
                </form>

                {promoMessage && (
                  <p
                    role="status"
                    className="mt-2 text-xs text-kurio-muted"
                  >
                    {promoMessage}
                  </p>
                )}
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-kurio-text">
                    Subtotal
                  </span>

                  <span className="text-kurio-text">
                    {totalPrice.toFixed(2)} ETH
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-kurio-text">
                    Desconto do lançamento
                  </span>

                  <span className="text-kurio-muted">
                    (-) 0.00 ETH
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-kurio-text">
                    Taxa de rede
                  </span>

                  <span className="text-kurio-muted">
                    A calcular
                  </span>
                </div>
              </div>

              <p className="mt-2 text-right text-[10px] text-kurio-primary">
                Taxa não simulada neste checkout
              </p>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#493026] pt-5">
                <span className="text-sm font-bold text-kurio-text">
                  Total
                </span>

                <span className="text-lg font-black text-kurio-primary">
                  {totalPrice.toFixed(2)} ETH
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="mt-6 w-full rounded bg-kurio-primary px-5 py-4 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
              >
                Conectar e finalizar
              </button>

              <Link
                to="/"
                hash="marketplace"
                className="mt-4 block text-center text-xs font-bold text-kurio-primary transition-colors hover:text-[#e6a15f]"
              >
                Continuar explorando
              </Link>
            </aside>
          </div>

          <section className="mt-20 sm:mt-24">
            <h2 className="mb-7 border-b border-[#493026] pb-3 text-base font-bold text-kurio-primary">
              Colecionadores também viram
            </h2>

            {relatedNFTs.length === 0 ? (
              <p className="py-8 text-sm text-kurio-muted">
                Não há outras recomendações disponíveis no momento.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {relatedNFTs.map((nft) => (
                  <Link
                    key={nft.id}
                    to="/nft/$id"
                    params={{ id: nft.id }}
                    className="group block"
                  >
                    <div className="overflow-hidden border border-[#493026] bg-kurio-surface p-3">
                      <div className="aspect-square overflow-hidden rounded-md bg-[#35221a]">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>

                    <h3 className="mt-3 text-xs font-bold text-kurio-text">
                      {nft.name}
                    </h3>

                    <p className="mt-1 text-sm font-bold text-kurio-primary">
                      {nft.price.toFixed(2)} ETH
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}
