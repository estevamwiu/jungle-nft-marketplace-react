
import { useState, type FormEvent } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { isAxiosError } from "axios"
import { useQuery } from "@tanstack/react-query"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

import { useCart } from "@/features/cart/hooks/use.cart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useNFTs } from "@/features/nft/hooks/use.nfts"
import { getQuote } from "@/features/checkout/api/quote-api"
import { formatEth, multiplyEth } from "@/lib/money"

const COUPON_STORAGE_KEY = "kurio-applied-coupon"

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
  } = useCart()

  const { data: nfts = [] } = useNFTs()

  const [appliedCoupon, setAppliedCoupon] = useState(
    () => localStorage.getItem(COUPON_STORAGE_KEY) ?? ""
  )
  const [promoCode, setPromoCode] = useState(appliedCoupon)
  const [promoMessage, setPromoMessage] = useState("")
  const quoteItems = items.map(({ nft, quantity }) => ({
    nftId: nft.id,
    quantity,
  }))
  const quoteQuery = useQuery({
    queryKey: ["quote", quoteItems, appliedCoupon],
    queryFn: ({ signal }) =>
      getQuote(quoteItems, appliedCoupon, signal),
    enabled: quoteItems.length > 0,
    retry: false,
  })
  const quote = quoteQuery.data
  const quoteErrorMessage = quoteQuery.isError
    ? isAxiosError<{ message?: string }>(quoteQuery.error)
      ? quoteQuery.error.response?.data?.message ??
        "Não foi possível calcular a cotação."
      : "Não foi possível calcular a cotação."
    : null

  const relatedNFTs = nfts
    .filter((nft) => !items.some((item) => item.nft.id === nft.id))
    .slice(0, 5)

  function handleCheckout() {
    if (items.length === 0 || !quote || quoteQuery.isFetching) {
      return
    }

    if (!isAuthenticated) {
      void navigate({
        to: "/login",
        search: { returnTo: "/cart" },
      })
      return
    }

    void navigate({ to: "/checkout" })
  }

  async function handlePromoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!promoCode.trim()) {
      setPromoMessage("Informe um código promocional.")
      return
    }

    try {
      const newQuote = await getQuote(quoteItems, promoCode.trim())
      const coupon = newQuote.couponCode ?? ""
      localStorage.setItem(COUPON_STORAGE_KEY, coupon)
      setAppliedCoupon(coupon)
      setPromoCode(coupon)
      setPromoMessage(
        coupon
          ? `Cupom ${coupon} aplicado com sucesso.`
          : "Cotação atualizada sem cupom."
      )
    } catch (error: unknown) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined
      setPromoMessage(message ?? "Não foi possível validar o cupom.")
    }
  }

  function handleRemoveCoupon() {
    localStorage.removeItem(COUPON_STORAGE_KEY)
    setAppliedCoupon("")
    setPromoCode("")
    setPromoMessage("Cupom removido.")
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
                        <p className="mt-1 text-[11px] text-kurio-muted">
                          {nft.availableQuantity} edição(ões) disponíveis
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="mb-1 block text-[10px] text-kurio-muted md:hidden">
                        Preço
                      </span>

                      <span className="text-sm font-bold text-kurio-primary">
                        {formatEth(nft.price)} ETH
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
                          disabled={
                            !nft.available ||
                            quantity >= nft.availableQuantity
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
                        {formatEth(multiplyEth(nft.price, quantity))} ETH
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
                  onSubmit={(event) => void handlePromoSubmit(event)}
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
                    disabled={items.length === 0}
                    className="bg-kurio-primary px-4 py-3 text-xs font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
                  >
                    Aplicar
                  </button>
                </form>

                <p className="mt-2 text-[10px] text-kurio-muted">
                  Cupons demonstrativos: JUNGLE10 (10%) e WELCOME5 (5%).
                </p>

                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="mt-2 text-xs text-kurio-primary underline"
                  >
                    Remover cupom {appliedCoupon}
                  </button>
                )}

                {promoMessage && (
                  <p
                    role="status"
                    className="mt-2 text-xs text-kurio-muted"
                  >
                    {promoMessage}
                  </p>
                )}
                {quoteErrorMessage && (
                  <p role="alert" className="mt-2 text-xs text-red-400">
                    {quoteErrorMessage} Revise os itens e tente novamente.
                  </p>
                )}
              </div>

              {quote && (
                <p className="mt-3 text-right text-[10px] text-kurio-muted">
                  Cotação válida até{" "}
                  {new Date(quote.expiresAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-kurio-text">
                    Subtotal
                  </span>

                  <span className="text-kurio-text">
                    {quote
                      ? `${formatEth(quote.subtotal)} ETH`
                      : quoteQuery.isFetching
                        ? "Calculando..."
                        : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-kurio-text">
                    Desconto{quote?.couponCode ? ` (${quote.couponCode})` : ""}
                  </span>

                  <span className="text-kurio-text">
                    {quote
                      ? `-${formatEth(quote.discount)} ETH`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-kurio-text">
                    Taxa de rede
                  </span>

                  <span className="text-kurio-text">
                    {quote
                      ? `${formatEth(quote.networkFee)} ETH`
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#493026] pt-5">
                <span className="text-sm font-bold text-kurio-text">
                  Total
                </span>

                <span className="text-lg font-black text-kurio-primary">
                  {quote
                    ? `${formatEth(quote.total)} ETH`
                    : quoteQuery.isFetching
                      ? "Calculando..."
                      : "—"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={
                  !quote ||
                  quoteQuery.isFetching ||
                  quoteQuery.isError
                }
                className="mt-6 w-full rounded bg-kurio-primary px-5 py-4 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f] disabled:cursor-not-allowed disabled:opacity-50"
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
                      {formatEth(nft.price)} ETH
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
