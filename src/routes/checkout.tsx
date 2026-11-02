import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router"
import { isAxiosError } from "axios"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ChevronDown,
  ShoppingBag,
  Wallet,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { useCart } from "@/features/cart/hooks/use.cart"
import { getWallets } from "@/features/account/api/account-api"
import type {
  StoredWallets,
  WalletData,
} from "@/features/account/types"
import {
  createOrder,
  getOrder,
} from "@/features/checkout/api/checkout-api"
import { getQuote } from "@/features/checkout/api/quote-api"
import type { OrderSnapshot } from "@/features/checkout/types"
import { saveOrder } from "@/features/activity/order-storage"
import { getMockScenario } from "@/mocks/scenarios"
import {
  OrderConfirmationDialog,
  type CompletedOrder,
} from "@/features/checkout/components/OrderConfirmationDialog"
import { formatEth, multiplyEth } from "@/lib/money"

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

const pendingOrderKey = (userId: string) =>
  `kurio-pending-order-${userId}`

function getIdempotencyKey(
  userId: string,
  items: Array<{
    nftId: string
    quantity: number
    expectedPrice: string
  }>,
  couponCode: string | null
): string {
  const fingerprint = JSON.stringify(
    {
      couponCode,
      items: [...items].sort((left, right) =>
        left.nftId.localeCompare(right.nftId)
      ),
    }
  )
  const storageKey = `kurio-order-idempotency-${userId}`

  try {
    const stored = localStorage.getItem(storageKey)
    const parsed: unknown = stored ? JSON.parse(stored) : null

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "fingerprint" in parsed &&
      parsed.fingerprint === fingerprint &&
      "key" in parsed &&
      typeof parsed.key === "string"
    ) {
      return parsed.key
    }

    const key = crypto.randomUUID()
    localStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }))
    return key
  } catch (error) {
    console.error("[CHECKOUT] Não foi possível persistir a chave do pedido.", error)
    throw error
  }
}

function CheckoutPage() {
  const navigate = useNavigate()
  const processedOrderIds = useRef(new Set<string>())
  const queryClient = useQueryClient()

  const { isAuthenticated, isLoading, user } = useAuth()
  const userId = user?.id
  const { items, totalItems, removeItem, updateQuantity } = useCart()
  const token = localStorage.getItem("jungle-auth-token")
  const appliedCoupon = localStorage.getItem("kurio-applied-coupon") ?? ""
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
        "Não foi possível atualizar a cotação."
      : "Não foi possível atualizar a cotação."
    : null
  const walletsQuery = useQuery<StoredWallets>({
    queryKey: ["wallets", userId],
    queryFn: ({ signal }) => {
      if (!token) {
        throw new Error("Sessão não encontrada.")
      }

      return getWallets(token, signal)
    },
    enabled: Boolean(userId && token && !isLoading),
    retry: false,
  })

  const [form, setForm] = useState<CollectorForm>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selectedWalletId, setSelectedWalletId] = useState("manual")
  const [walletConnection, setWalletConnection] = useState<
    "disconnected" | "connecting" | "connected" | "rejected"
  >("disconnected")

  const pendingOrderQuery = useQuery({
    queryKey: ["pending-order", user?.id],
    queryFn: () =>
      user
        ? localStorage.getItem(pendingOrderKey(user.id))
        : null,
    enabled: Boolean(user && !isLoading),
    retry: false,
    staleTime: Infinity,
  })
  const pendingOrderId = pendingOrderQuery.data ?? null
  const isRecoveringOrder =
    Boolean(user && !isLoading && pendingOrderQuery.isPending)

  const orderQuery = useQuery({
    queryKey: ["order", user?.id, pendingOrderId],
    queryFn: () => {
      if (!pendingOrderId || !token) {
        throw new Error("Pedido ou sessão não disponível.")
      }

      return getOrder(pendingOrderId, token)
    },
    enabled: Boolean(user && pendingOrderId && token),
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 1500 : false,
    retry: false,
  })

  const terminalOrderQuery = useQuery<OrderSnapshot | null>({
    queryKey: ["checkout-terminal-order", user?.id],
    queryFn: async () => null,
    enabled: false,
  })
  const terminalOrder = terminalOrderQuery.data
  const completedOrder: CompletedOrder | null =
    terminalOrder?.status === "confirmed"
      ? {
          orderId: terminalOrder.orderId,
          subtotal: terminalOrder.subtotal,
          discount: terminalOrder.discount,
          networkFee: terminalOrder.networkFee,
          total: terminalOrder.total,
          couponCode: terminalOrder.couponCode,
          items: terminalOrder.items,
          createdAt: terminalOrder.createdAt,
        }
      : null
  const primaryWallet = walletsQuery.data?.primary
  const secondaryWallet = walletsQuery.data?.secondary
  const hasSavedWallets = Boolean(primaryWallet || secondaryWallet)

  useEffect(() => {
    const order = orderQuery.data

    if (
      !order ||
      order.status === "pending" ||
      !userId ||
      processedOrderIds.current.has(order.orderId)
    ) {
      return
    }

    processedOrderIds.current.add(order.orderId)

    const storageKey = `kurio-order-idempotency-${userId}`
    localStorage.removeItem(pendingOrderKey(userId))
    localStorage.removeItem(storageKey)
    saveOrder(userId, {
      orderId: order.orderId,
      subtotal: order.subtotal,
      discount: order.discount,
      networkFee: order.networkFee,
      total: order.total,
      couponCode: order.couponCode,
      items: order.items,
      createdAt: order.createdAt,
      status: order.status,
    })
    queryClient.setQueryData(
      ["checkout-terminal-order", userId],
      order
    )
    queryClient.setQueryData(
      ["pending-order", userId],
      null
    )

    if (order.status === "confirmed") {
      for (const purchasedItem of order.items) {
        const cartItem = items.find(
          (item) => item.nft.id === purchasedItem.id
        )

        if (!cartItem) {
          continue
        }

        const remainingQuantity =
          cartItem.quantity - purchasedItem.quantity

        if (remainingQuantity > 0) {
          updateQuantity(purchasedItem.id, remainingQuantity)
        } else {
          removeItem(purchasedItem.id)
        }
      }

      localStorage.removeItem("kurio-applied-coupon")
    }
  }, [
    items,
    orderQuery.data,
    queryClient,
    removeItem,
    updateQuantity,
    userId,
  ])

  useEffect(() => {
    if (!pendingOrderId || !userId || !token) {
      return
    }

    void import("@/features/realtime/lib/socket")
      .then(({ socket }) => {
        if (socket.connected) {
          socket.emit("order.subscribe", {
            orderId: pendingOrderId,
            userId,
            token,
          })
        }
      })
      .catch((cause: unknown) => {
        console.error("[CHECKOUT] Falha ao acompanhar pedido.", cause)
      })
  }, [pendingOrderId, token, userId])

  function updateForm<K extends keyof CollectorForm>(
    field: K,
    value: CollectorForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (
      field === "network" ||
      field === "walletAddress" ||
      field === "walletType"
    ) {
      setSelectedWalletId("manual")
      setWalletConnection("disconnected")
    }
  }

  function handleSelectSavedWallet(
    id: "primary" | "secondary",
    wallet: WalletData
  ) {
    setSelectedWalletId(id)
    setWalletConnection("disconnected")
    setError("")
    setForm((current) => ({
      ...current,
      displayName: wallet.displayName,
      username: wallet.nickname,
      network: wallet.network,
      profileName: wallet.profileName,
      walletAddress: wallet.address,
      secondaryWallet: wallet.secondaryAddress,
      walletType: wallet.walletType,
      referralCode: wallet.referralCode,
      email: wallet.email,
      ensName: wallet.ensName,
      useAnotherWallet: Boolean(wallet.secondaryAddress),
    }))
  }

  function handleConnectWallet() {
    if (!form.walletAddress.trim() || !form.walletType) {
      setError("Selecione ou informe uma carteira antes de conectar.")
      return
    }

    setError("")
    setWalletConnection("connecting")

    window.setTimeout(() => {
      if (getMockScenario() === "wallet-rejected") {
        setWalletConnection("rejected")
        setError("A conexão da carteira foi recusada. Tente novamente.")
        return
      }

      setWalletConnection("connected")
    }, 500)
  }

  function handleDisconnectWallet() {
    setWalletConnection("disconnected")
    setError("")
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

    if (walletConnection !== "connected") {
      setError("Conecte a carteira selecionada antes de confirmar.")
      return
    }

    if (
      isSubmitting ||
      completedOrder ||
      items.length === 0 ||
      !quote ||
      quoteQuery.isFetching ||
      quoteQuery.isError
    ) {
      if (!quote || quoteQuery.isFetching || quoteQuery.isError) {
        setError(
          quoteErrorMessage ??
            "Aguarde a cotação atualizada antes de confirmar."
        )
      }

      return
    }

    if (!isAuthenticated) {
      await navigate({
        to: "/login",
        search: { returnTo: "/checkout" },
      })
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
      if (
        !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(
          form.walletAddress.trim()
        )
      ) {
        setError("Informe um endereço de carteira Solana válido.")
        return
      }
    }

    if (!token) {
      setError("Sessão não encontrada. Faça login novamente.")
      return
    }

    if (pendingOrderId || isRecoveringOrder || pendingOrderQuery.isPending) {
      setError(
        "Aguarde a recuperação ou a confirmação do pedido pendente."
      )
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const requestItems = quote.items.map((item) => ({
        nftId: item.id,
        quantity: item.quantity,
        expectedPrice: item.price,
      }))
      const idempotencyKey = getIdempotencyKey(
        user.id,
        requestItems,
        quote.couponCode
      )
      const response = await createOrder(
        requestItems,
        quote,
        token,
        idempotencyKey
      )

      localStorage.setItem(
        pendingOrderKey(user.id),
        response.orderId
      )
      queryClient.setQueryData(
        ["pending-order", user.id],
        response.orderId
      )
      queryClient.setQueryData<OrderSnapshot>(
        ["order", user.id, response.orderId],
        response
      )
      queryClient.setQueryData(
        ["checkout-terminal-order", user.id],
        null
      )
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string; code?: string }>(err)) {
        if (
          ["QUOTE_STALE", "INSUFFICIENT_STOCK", "NFT_UNAVAILABLE"].includes(
            err.response?.data?.code ?? ""
          )
        ) {
          await queryClient.invalidateQueries({
            queryKey: ["quote"],
          })
        }

        setError(
          err.response?.data?.message ?? "Não foi possível criar o pedido."
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
      <OrderConfirmationDialog
        order={completedOrder}
        onClose={() => void navigate({ to: "/" })}
      />
    )
  }

  const orderDeclined =
    terminalOrder?.status === "declined"
      ? "O pagamento foi recusado. Seus itens continuam no carrinho."
      : ""

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
          search={{ returnTo: "/checkout" }}
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
              <label
                htmlFor="displayName"
                className={labelClass}
              >
                Nome de exibição{" "}
                <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="displayName"
                type="text"
                autoComplete="name"
                required
                value={form.displayName}
                onChange={(event) =>
                  updateForm("displayName", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className={labelClass}
              >
                Nome de usuário{" "}
                <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={form.username}
                onChange={(event) =>
                  updateForm("username", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="network"
                className={labelClass}
              >
                Rede{" "}
                <span className="text-kurio-primary">*</span>
              </label>

              <div className="relative">
                <select
                  id="network"
                  autoComplete="off"
                  required
                  value={form.network}
                  onChange={(event) =>
                    updateForm("network", event.target.value)
                  }
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="">
                    Selecione uma rede
                  </option>
                  <option value="Ethereum">
                    Ethereum
                  </option>
                  <option value="Polygon">
                    Polygon
                  </option>
                  <option value="Solana">
                    Solana
                  </option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-3.5 text-kurio-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profileName"
                className={labelClass}
              >
                Nome do perfil{" "}
                <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="profileName"
                type="text"
                autoComplete="nickname"
                required
                value={form.profileName}
                onChange={(event) =>
                  updateForm("profileName", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="walletAddress"
                className={labelClass}
              >
                Endereço da carteira{" "}
                <span className="text-kurio-primary">*</span>
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
                <label
                  htmlFor="secondaryWallet"
                  className={labelClass}
                >
                  Carteira secundária{" "}
                  <span className="text-kurio-primary">*</span>
                </label>

                <input
                  id="secondaryWallet"
                  type="text"
                  required
                  value={form.secondaryWallet}
                  onChange={(event) =>
                    updateForm(
                      "secondaryWallet",
                      event.target.value
                    )
                  }
                  placeholder="Endereço da carteira secundária"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="walletType"
                className={labelClass}
              >
                Tipo de carteira{" "}
                <span className="text-kurio-primary">*</span>
              </label>

              <div className="relative">
                <select
                  id="walletType"
                  autoComplete="off"
                  required
                  value={form.walletType}
                  onChange={(event) =>
                    updateForm("walletType", event.target.value)
                  }
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="">
                    Selecione uma carteira
                  </option>
                  <option value="MetaMask">
                    MetaMask
                  </option>
                  <option value="Coinbase Wallet">
                    Coinbase Wallet
                  </option>
                  <option value="WalletConnect">
                    WalletConnect
                  </option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-3.5 text-kurio-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="referralCode"
                className={labelClass}
              >
                Código de indicação (opcional)
              </label>

              <input
                id="referralCode"
                type="text"
                autoComplete="off"
                value={form.referralCode}
                onChange={(event) =>
                  updateForm("referralCode", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className={labelClass}
              >
                E-mail{" "}
                <span className="text-kurio-primary">*</span>
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
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
              <label
                htmlFor="ensName"
                className={labelClass}
              >
                Nome ENS (opcional)
              </label>

              <input
                id="ensName"
                type="text"
                autoComplete="off"
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
            <label
              htmlFor="notes"
              className={labelClass}
            >
              Observação do colecionador (opcional)
            </label>

            <textarea
              id="notes"
              rows={5}
              autoComplete="off"
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
            {items.map(({ nft, quantity }) => {
              const quotedItem = quote?.items.find(
                (item) => item.id === nft.id
              )
              const price = quotedItem?.price ?? nft.price

              return (
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
                    {formatEth(multiplyEth(price, quantity))} ETH
                  </span>
                </article>
              )
            })}
          </div>

          <p className="mt-4 text-right text-xs text-kurio-muted">
            {totalItems} edição(ões)
          </p>

          <div className="mt-7 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
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

            <div className="flex justify-between gap-4">
              <span className="text-kurio-text">
                Desconto{quote?.couponCode ? ` (${quote.couponCode})` : ""}
              </span>

              <span className="text-kurio-text">
                {quote ? `-${formatEth(quote.discount)} ETH` : "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-kurio-text">
                Taxa de rede
              </span>

              <span className="text-kurio-text">
                {quote ? `${formatEth(quote.networkFee)} ETH` : "—"}
              </span>
            </div>
          </div>

          {quoteErrorMessage && (
            <p role="alert" className="mt-4 text-xs text-red-400">
              {quoteErrorMessage} Volte ao carrinho e tente novamente.
            </p>
          )}

          <div className="mt-6 flex justify-between border-t border-[#493026] pt-5 text-base font-bold">
            <span className="text-kurio-text">
              Total
            </span>

            <span className="text-kurio-primary">
              {quote ? `${formatEth(quote.total)} ETH` : "—"}
            </span>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-center text-sm font-bold text-kurio-text">
              Carteira e rede
            </h3>

            <div className="space-y-3">
              {hasSavedWallets ? (
                <>
                  {primaryWallet && (
                    <label className="flex cursor-pointer items-center gap-3 border border-[#493026] px-4 py-3 text-xs text-kurio-text">
                      <input
                        type="radio"
                        name="selectedWallet"
                        checked={selectedWalletId === "primary"}
                        onChange={() =>
                          handleSelectSavedWallet(
                            "primary",
                            primaryWallet
                          )
                        }
                        className="accent-[#d58d49]"
                      />
                      <span>
                        <span className="block font-bold">
                          Principal · {primaryWallet.walletType}
                        </span>
                        <span className="mt-1 block text-kurio-muted">
                          {primaryWallet.network} ·{" "}
                          {primaryWallet.address.slice(0, 8)}...
                          {primaryWallet.address.slice(-6)}
                        </span>
                      </span>
                    </label>
                  )}

                  {secondaryWallet && (
                    <label className="flex cursor-pointer items-center gap-3 border border-[#493026] px-4 py-3 text-xs text-kurio-text">
                      <input
                        type="radio"
                        name="selectedWallet"
                        checked={selectedWalletId === "secondary"}
                        onChange={() =>
                          handleSelectSavedWallet(
                            "secondary",
                            secondaryWallet
                          )
                        }
                        className="accent-[#d58d49]"
                      />
                      <span>
                        <span className="block font-bold">
                          Secundária · {secondaryWallet.walletType}
                        </span>
                        <span className="mt-1 block text-kurio-muted">
                          {secondaryWallet.network} ·{" "}
                          {secondaryWallet.address.slice(0, 8)}...
                          {secondaryWallet.address.slice(-6)}
                        </span>
                      </span>
                    </label>
                  )}

                  <label className="flex cursor-pointer items-center gap-3 border border-[#493026] px-4 py-3 text-xs text-kurio-text">
                    <input
                      type="radio"
                      name="selectedWallet"
                      checked={selectedWalletId === "manual"}
                      onChange={() => {
                        setSelectedWalletId("manual")
                        setWalletConnection("disconnected")
                      }}
                      className="accent-[#d58d49]"
                    />
                    Informar outra carteira
                  </label>
                </>
              ) : (
                ["MetaMask", "Coinbase Wallet", "WalletConnect"].map(
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
                )
              )}
            </div>

            {walletsQuery.isError && (
              <p role="alert" className="mt-3 text-xs text-red-400">
                Não foi possível carregar as carteiras salvas. Você ainda pode
                informar uma carteira manualmente.
              </p>
            )}

            <div className="mt-4">
              {walletConnection === "connected" ? (
                <div className="flex items-center justify-between gap-3">
                  <p role="status" className="text-xs text-green-400">
                    Carteira conectada para esta simulação.
                  </p>
                  <button
                    type="button"
                    onClick={handleDisconnectWallet}
                    className="text-xs text-kurio-primary underline"
                  >
                    Desconectar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={walletConnection === "connecting"}
                  className="w-full border border-kurio-primary px-4 py-3 text-xs font-bold text-kurio-primary transition-colors hover:bg-kurio-primary hover:text-kurio-bg disabled:cursor-wait disabled:opacity-60"
                >
                  {walletConnection === "connecting"
                    ? "Conectando carteira..."
                    : "Conectar carteira"}
                </button>
              )}
            </div>
          </div>

          {(error || orderDeclined) && (
            <p
              role="alert"
              className="mt-5 border border-red-900/60 bg-red-950/20 p-4 text-xs leading-6 text-red-300"
            >
              {error || orderDeclined}
            </p>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isRecoveringOrder ||
              Boolean(pendingOrderId) ||
              !quote ||
              quoteQuery.isFetching ||
              quoteQuery.isError ||
              walletConnection !== "connected"
            }
            className="mt-7 w-full rounded bg-kurio-primary px-5 py-4 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {walletConnection !== "connected"
              ? "Conecte a carteira"
              : isSubmitting
              ? "Criando pedido..."
              : isRecoveringOrder
                ? "Recuperando pedido..."
                : pendingOrderId
                  ? "Aguardando pagamento..."
                  : "Confirmar compra"}
          </button>

          <Link
            to="/cart"
            className="mt-4 block text-center text-xs text-kurio-muted transition-colors hover:text-kurio-primary"
          >
            Voltar ao carrinho
          </Link>

          <p className="mt-5 text-center text-[11px] leading-5 text-kurio-muted">
            Ambiente demonstrativo. Nenhum pagamento real será
            realizado.
          </p>
        </aside>
      </form>
    </section>
  )
}