import { useState, type FormEvent } from "react"
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router"
import { isAxiosError } from "axios"
import {
  Check,
  ChevronDown,
  ShoppingBag,
  Wallet,
  X,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCart } from "@/features/cart/hooks/use.cart"
import { createOrder } from "@/features/checkout/api/checkout-api"
import { saveOrder } from "@/features/activity/order-storage"

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
})

interface CollectorForm {
  displayName: string
  username: string
  network: string
  profileName: string
  walletAddress: string
  secondaryWallet: string
  walletType: string
  referralCode: string
  email: string
  ensName: string
  useAnotherWallet: boolean
  notes: string
}

interface CompletedOrder {
  orderId: string
  total: number
  items: {
    id: string
    name: string
    image: string
    price: number
    quantity: number
  }[]
}

const initialForm: CollectorForm = {
  displayName: "",
  username: "",
  network: "",
  profileName: "",
  walletAddress: "",
  secondaryWallet: "",
  walletType: "",
  referralCode: "",
  email: "",
  ensName: "",
  useAnotherWallet: false,
  notes: "",
}

const inputClass =
  "h-11 w-full border border-[#493026] bg-kurio-bg px-3 text-xs text-kurio-text outline-none transition-colors placeholder:text-kurio-muted focus:border-kurio-primary"

const labelClass =
  "mb-2 block text-xs font-medium text-kurio-text"

function CheckoutPage() {
  const navigate = useNavigate()

  const { isAuthenticated, isLoading, user } = useAuth()
  const { items, totalItems, totalPrice, clearCart } = useCart()

  const [form, setForm] = useState<CollectorForm>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [completedOrder, setCompletedOrder] =
    useState<CompletedOrder | null>(null)

  function updateForm<K extends keyof CollectorForm>(
    field: K,
    value: CollectorForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleAnotherWalletChange(checked: boolean) {
    setForm((current) => ({
      ...current,
      useAnotherWallet: checked,
      secondaryWallet: checked ? current.secondaryWallet : "",
    }))
  }

  async function handleConfirmOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || completedOrder || items.length === 0) {
      return
    }

    if (!isAuthenticated) {
      await navigate({ to: "/login" })
      return
    }

    if (!user) {
      setError("Não foi possível identificar o usuário autenticado.")
      return
    }

    if (
      !form.displayName.trim() ||
      !form.username.trim() ||
      !form.network ||
      !form.profileName.trim() ||
      !form.walletAddress.trim() ||
      !form.walletType ||
      !form.email.trim()
    ) {
      setError("Preencha todos os campos obrigatórios.")
      return
    }

    if (form.useAnotherWallet && !form.secondaryWallet.trim()) {
      setError("Informe o endereço da carteira secundária.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(form.email)) {
      setError("Informe um e-mail válido.")
      return
    }

    if (form.network === "Ethereum" || form.network === "Polygon") {
      if (!/^0x[a-fA-F0-9]{40}$/.test(form.walletAddress.trim())) {
        setError(
          "Informe um endereço de carteira válido para a rede selecionada."
        )
        return
      }
    }

    if (form.network === "Solana") {
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(form.walletAddress.trim())) {
        setError("Informe um endereço de carteira Solana válido.")
        return
      }
    }

    const token = localStorage.getItem("jungle-auth-token")

    if (!token) {
      setError("Sessão não encontrada. Faça login novamente.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const orderItems = items.map(({ nft, quantity }) => ({
        id: nft.id,
        name: nft.name,
        image: nft.image,
        price: nft.price,
        quantity,
      }))

      const response = await createOrder(
        items.map(({ nft, quantity }) => ({
          nftId: nft.id,
          quantity,
        })),
        token
      )

      const completedPurchase = {
        orderId: response.orderId,
        total: response.total,
        items: orderItems,
        createdAt: new Date().toISOString(),
        status: "completed" as const,
      }

      saveOrder(user.id, completedPurchase)

      setCompletedOrder({
        orderId: completedPurchase.orderId,
        total: completedPurchase.total,
        items: completedPurchase.items,
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
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm"
        role="presentation"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="purchase-success-title"
          className="relative my-auto w-full max-w-lg border border-[#704b35] bg-kurio-surface shadow-2xl"
        >
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            aria-label="Fechar confirmação"
            className="absolute right-4 top-4 text-kurio-muted transition-colors hover:text-kurio-primary"
          >
            <X size={20} />
          </button>

          <div className="border-b border-[#493026] px-6 pb-7 pt-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-kurio-primary text-kurio-primary">
              <Check size={34} strokeWidth={2.5} />
            </div>

            <h1
              id="purchase-success-title"
              className="mt-5 text-2xl font-black text-kurio-text"
            >
              Transação concluída!
            </h1>

            <p className="mt-3 text-sm leading-6 text-kurio-muted">
              Sua compra foi registrada com sucesso.
            </p>
          </div>

          <div className="max-h-[55vh] overflow-y-auto px-6 py-6">
            <div className="grid gap-4 border-b border-[#493026] pb-5 text-xs sm:grid-cols-2">
              <div>
                <p className="text-kurio-muted">
                  Identificador do pedido
                </p>

                <p
                  title={completedOrder.orderId}
                  className="mt-2 break-all font-bold text-kurio-text"
                >
                  {completedOrder.orderId}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-kurio-muted">
                  Valor total
                </p>

                <p className="mt-2 text-lg font-black text-kurio-primary">
                  {completedOrder.total.toFixed(2)} ETH
                </p>
              </div>
            </div>

            <h2 className="mb-4 mt-5 text-sm font-bold text-kurio-text">
              NFTs adquiridos
            </h2>

            <div className="space-y-3">
              {completedOrder.items.map((item) => (
                <article
                  key={item.id}
                  className="flex items-center gap-3 border border-[#493026] bg-kurio-bg p-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 shrink-0 rounded object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-kurio-text">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-[11px] text-kurio-muted">
                      Quantidade: {item.quantity}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-kurio-primary">
                    {(item.price * item.quantity).toFixed(2)} ETH
                  </span>
                </article>
              ))}
            </div>

            <p className="mt-6 text-center text-xs leading-6 text-kurio-muted">
              Esta transação é uma simulação. Nenhum pagamento
              real ou transferência de NFT foi realizado.
            </p>
          </div>

          <div className="border-t border-[#493026] px-6 py-5">
            <button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="w-full rounded bg-kurio-primary px-6 py-4 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
            >
              Voltar ao marketplace
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="py-24 text-center text-sm text-kurio-muted"
      >
        Verificando sessão...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg py-24 text-center">
        <Wallet
          size={42}
          className="mx-auto text-kurio-primary"
        />

        <h1 className="mt-6 text-2xl font-bold text-kurio-text">
          Faça login para continuar
        </h1>

        <p className="mt-4 text-sm leading-7 text-kurio-muted">
          Você precisa estar autenticado para finalizar a compra.
        </p>

        <Link
          to="/login"
          className="mt-7 inline-flex bg-kurio-primary px-6 py-3 text-sm font-bold text-kurio-bg"
        >
          Fazer login
        </Link>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-lg py-24 text-center">
        <ShoppingBag
          size={42}
          className="mx-auto text-kurio-primary"
        />

        <h1 className="mt-6 text-2xl font-bold text-kurio-text">
          Seu carrinho está vazio
        </h1>

        <p className="mt-4 text-sm text-kurio-muted">
          Adicione NFTs antes de finalizar uma compra.
        </p>

        <Link
          to="/"
          hash="marketplace"
          className="mt-7 inline-flex bg-kurio-primary px-6 py-3 text-sm font-bold text-kurio-bg"
        >
          Explorar NFTs
        </Link>
      </section>
    )
  }

  return (
    <section className="pb-20 pt-8 sm:pt-10">
      <nav
        aria-label="Navegação estrutural"
        className="mb-9 flex flex-wrap items-center gap-2 text-xs font-bold"
      >
        <Link
          to="/"
          className="text-kurio-muted hover:text-kurio-primary"
        >
          Início
        </Link>

        <span className="text-kurio-muted">/</span>

        <Link
          to="/"
          hash="marketplace"
          className="text-kurio-muted hover:text-kurio-primary"
        >
          Mercado
        </Link>

        <span className="text-kurio-muted">/</span>

        <span className="text-kurio-text">
          Pagamento
        </span>
      </nav>

      <form
        onSubmit={(event) => void handleConfirmOrder(event)}
        className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] lg:gap-12"
      >
        <div>
          <h1 className="mb-5 text-base font-bold text-kurio-text">
            Perfil do colecionador
          </h1>

          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            <div>
              <label htmlFor="displayName" className={labelClass}>
                Nome de exibição <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="displayName"
                type="text"
                required
                value={form.displayName}
                onChange={(event) =>
                  updateForm("displayName", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="username" className={labelClass}>
                Nome de usuário <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="username"
                type="text"
                required
                value={form.username}
                onChange={(event) =>
                  updateForm("username", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="network" className={labelClass}>
                Rede <span className="text-kurio-primary">*</span>
              </label>

              <div className="relative">
                <select
                  id="network"
                  required
                  value={form.network}
                  onChange={(event) =>
                    updateForm("network", event.target.value)
                  }
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="">Selecione uma rede</option>
                  <option value="Ethereum">Ethereum</option>
                  <option value="Polygon">Polygon</option>
                  <option value="Solana">Solana</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-3.5 text-kurio-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profileName" className={labelClass}>
                Nome do perfil <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="profileName"
                type="text"
                required
                value={form.profileName}
                onChange={(event) =>
                  updateForm("profileName", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="walletAddress" className={labelClass}>
                Endereço da carteira <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="walletAddress"
                type="text"
                required
                value={form.walletAddress}
                onChange={(event) =>
                  updateForm("walletAddress", event.target.value)
                }
                placeholder="Endereço público da carteira"
                autoComplete="off"
                className={inputClass}
              />
            </div>

            {form.useAnotherWallet && (
              <div>
                <label htmlFor="secondaryWallet" className={labelClass}>
                  Carteira secundária <span className="text-kurio-primary">*</span>
                </label>

                <input
                  id="secondaryWallet"
                  type="text"
                  required
                  value={form.secondaryWallet}
                  onChange={(event) =>
                    updateForm("secondaryWallet", event.target.value)
                  }
                  placeholder="Endereço da carteira secundária"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label htmlFor="walletType" className={labelClass}>
                Tipo de carteira <span className="text-kurio-primary">*</span>
              </label>

              <div className="relative">
                <select
                  id="walletType"
                  required
                  value={form.walletType}
                  onChange={(event) =>
                    updateForm("walletType", event.target.value)
                  }
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="">Selecione uma carteira</option>
                  <option value="MetaMask">MetaMask</option>
                  <option value="Coinbase Wallet">Coinbase Wallet</option>
                  <option value="WalletConnect">WalletConnect</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-3.5 text-kurio-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="referralCode" className={labelClass}>
                Código de indicação (opcional)
              </label>

              <input
                id="referralCode"
                type="text"
                value={form.referralCode}
                onChange={(event) =>
                  updateForm("referralCode", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                E-mail <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  updateForm("email", event.target.value)
                }
                placeholder={user?.email ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="ensName" className={labelClass}>
                Nome ENS (opcional)
              </label>

              <input
                id="ensName"
                type="text"
                value={form.ensName}
                onChange={(event) =>
                  updateForm("ensName", event.target.value)
                }
                placeholder="seunome.eth"
                className={inputClass}
              />
            </div>
          </div>

          <label className="mt-6 flex cursor-pointer items-center gap-3 text-xs text-kurio-text">
            <input
              type="checkbox"
              checked={form.useAnotherWallet}
              onChange={(event) =>
                handleAnotherWalletChange(event.target.checked)
              }
              className="h-4 w-4 accent-[#d58d49]"
            />

            Usar outra carteira?
          </label>

          <div className="mt-6">
            <label htmlFor="notes" className={labelClass}>
              Observação do colecionador (opcional)
            </label>

            <textarea
              id="notes"
              rows={5}
              value={form.notes}
              onChange={(event) =>
                updateForm("notes", event.target.value)
              }
              className="w-full resize-y border border-[#493026] bg-kurio-bg p-3 text-xs text-kurio-text outline-none focus:border-kurio-primary"
            />
          </div>
        </div>

        <aside className="min-w-0">
          <h2 className="mb-4 text-base font-bold text-kurio-text">
            Seus NFTs
          </h2>

          <div className="mb-3 flex justify-between border-b border-[#493026] pb-3 text-xs font-bold text-kurio-text">
            <span>NFTs</span>
            <span>Subtotal</span>
          </div>

          <div className="space-y-3">
            {items.map(({ nft, quantity }) => (
              <article
                key={nft.id}
                className="flex items-center gap-3 bg-kurio-surface p-2"
              >
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="h-16 w-16 shrink-0 rounded object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-kurio-text">
                    {nft.name}
                  </p>

                  <p className="mt-1 text-[11px] text-kurio-muted">
                    ID do token: #{nft.id.padStart(4, "0")}
                  </p>

                  <p className="mt-1 text-[11px] text-kurio-muted">
                    Quantidade: {quantity}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-bold text-kurio-primary">
                  {(nft.price * quantity).toFixed(2)} ETH
                </span>
              </article>
            ))}
          </div>

          <p className="mt-4 text-right text-xs text-kurio-muted">
            {totalItems} edição(ões)
          </p>

          <div className="mt-7 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-kurio-text">Subtotal</span>
              <span className="text-kurio-text">
                {totalPrice.toFixed(2)} ETH
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-kurio-text">
                Desconto do lançamento
              </span>
              <span className="text-kurio-muted">
                (-) 0.00 ETH
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-kurio-text">
                Taxa de rede
              </span>
              <span className="text-kurio-muted">
                Não simulada
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-between border-t border-[#493026] pt-5 text-base font-bold">
            <span className="text-kurio-text">Total</span>
            <span className="text-kurio-primary">
              {totalPrice.toFixed(2)} ETH
            </span>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-center text-sm font-bold text-kurio-text">
              Carteira e rede
            </h3>

            <div className="space-y-3">
              {["MetaMask", "Coinbase Wallet", "WalletConnect"].map(
                (wallet) => (
                  <label
                    key={wallet}
                    className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-xs transition-colors ${
                      form.walletType === wallet
                        ? "border-kurio-primary text-kurio-primary"
                        : "border-[#493026] text-kurio-text hover:border-[#80502e]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedWallet"
                      value={wallet}
                      checked={form.walletType === wallet}
                      onChange={() =>
                        updateForm("walletType", wallet)
                      }
                      className="accent-[#d58d49]"
                    />

                    {wallet}
                  </label>
                )
              )}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 border border-red-900/60 bg-red-950/20 p-4 text-xs leading-6 text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-7 w-full rounded bg-kurio-primary px-5 py-4 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Processando..." : "Confirmar compra"}
          </button>

          <Link
            to="/cart"
            className="mt-4 block text-center text-xs text-kurio-muted transition-colors hover:text-kurio-primary"
          >
            Voltar ao carrinho
          </Link>

          <p className="mt-5 text-center text-[11px] leading-5 text-kurio-muted">
            Ambiente demonstrativo. Nenhum pagamento real será realizado.
          </p>
        </aside>
      </form>
    </section>
  )
}