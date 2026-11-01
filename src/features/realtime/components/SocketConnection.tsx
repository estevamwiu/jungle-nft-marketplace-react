import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type {
  NFT,
  NFTCatalogResponse,
} from "@/features/nft/types"
import { formatEth, isEthAmount } from "@/lib/money"
import { useCart } from "@/features/cart/hooks/use.cart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import type { OrderUpdatedEvent, NftUpdatedEvent } from "../types"

const pendingOrderKey = (userId: string) =>
  `kurio-pending-order-${userId}`

function isNftUpdatedEvent(
  value: unknown
): value is NftUpdatedEvent {
  if (typeof value !== "object" || value === null) {
    return false
  }

  if (
    !("eventId" in value) ||
    typeof value.eventId !== "string" ||
    !("version" in value) ||
    typeof value.version !== "number" ||
    !Number.isInteger(value.version) ||
    !("resource" in value) ||
    typeof value.resource !== "object" ||
    value.resource === null ||
    !("type" in value.resource) ||
    value.resource.type !== "nft" ||
    !("id" in value.resource) ||
    typeof value.resource.id !== "string" ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("id" in value.data) ||
    typeof value.data.id !== "string" ||
    !("price" in value.data) ||
    !isEthAmount(value.data.price) ||
    !("available" in value.data) ||
    typeof value.data.available !== "boolean" ||
    !("availableQuantity" in value.data) ||
    typeof value.data.availableQuantity !== "number" ||
    !Number.isSafeInteger(value.data.availableQuantity) ||
    value.data.availableQuantity < 0 ||
    value.data.available !== (value.data.availableQuantity > 0)
  ) {
    return false
  }

  return value.resource.id === value.data.id
}

function isOrderUpdatedEvent(
  value: unknown
): value is OrderUpdatedEvent {
  if (typeof value !== "object" || value === null) {
    return false
  }

  if (
    !("eventId" in value) ||
    typeof value.eventId !== "string" ||
    !("resource" in value) ||
    typeof value.resource !== "object" ||
    value.resource === null ||
    !("type" in value.resource) ||
    value.resource.type !== "order" ||
    !("id" in value.resource) ||
    typeof value.resource.id !== "string" ||
    !("version" in value) ||
    typeof value.version !== "number" ||
    !Number.isInteger(value.version) ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null ||
    !("orderId" in value.data) ||
    typeof value.data.orderId !== "string" ||
    !("userId" in value.data) ||
    typeof value.data.userId !== "string" ||
    !("status" in value.data) ||
    !["pending", "confirmed", "declined"].includes(
      String(value.data.status)
    ) ||
    !("total" in value.data) ||
    !isEthAmount(value.data.total) ||
    !("subtotal" in value.data) ||
    !isEthAmount(value.data.subtotal) ||
    !("discount" in value.data) ||
    !isEthAmount(value.data.discount) ||
    !("networkFee" in value.data) ||
    !isEthAmount(value.data.networkFee) ||
    !("couponCode" in value.data) ||
    (typeof value.data.couponCode !== "string" &&
      value.data.couponCode !== null) ||
    !("items" in value.data) ||
    !Array.isArray(value.data.items) ||
    !value.data.items.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string" &&
        "name" in item &&
        typeof item.name === "string" &&
        "image" in item &&
        typeof item.image === "string" &&
        "price" in item &&
        isEthAmount(item.price) &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0
    ) ||
    !("createdAt" in value.data) ||
    typeof value.data.createdAt !== "string" ||
    !("version" in value.data) ||
    value.data.version !== value.version
  ) {
    return false
  }

  return value.resource.id === value.data.orderId
}

export function SocketConnection() {
  const queryClient = useQueryClient()
  const { items, updateNFT } = useCart()
  const { user } = useAuth()
  const [notice, setNotice] = useState<string | null>(null)
  const lastVersions = useRef(new Map<string, number>())
  const socketRef =
    useRef<(typeof import("../lib/socket"))["socket"] | undefined>(
      undefined
    )
  const itemIdsRef = useRef<string[]>([])
    const itemNamesRef = useRef(new Map<string, string>())
    const orderVersions = useRef(new Map<string, number>())

  useEffect(() => {
    let disposed = false
    let clientSocket: (typeof import("../lib/socket"))["socket"] | undefined
    let noticeTimer: number | undefined
    const userId = user?.id ?? null

    function subscribeToCartItems() {
      if (clientSocket?.connected) {
        clientSocket.emit("nft.subscribe", {
          nftIds: itemIdsRef.current,
        })
      }
    }

    function subscribeToPendingOrder() {
      const token = localStorage.getItem("jungle-auth-token")
      const orderId = userId
        ? localStorage.getItem(pendingOrderKey(userId))
        : null

      if (clientSocket?.connected && userId && token && orderId) {
        clientSocket.emit("order.subscribe", {
          orderId,
          userId,
          token,
        })
      }
    }

    function handleConnect() {
      console.log("[CLIENT] Socket.IO conectado:", clientSocket?.id)
      subscribeToCartItems()
      subscribeToPendingOrder()
    }

    function handleOrderUpdated(payload: unknown) {
      if (!isOrderUpdatedEvent(payload)) {
        console.error("[CLIENT] Evento order.updated inválido:", payload)
        return
      }

      if (payload.data.userId !== userId) {
        return
      }

      const lastVersion =
        orderVersions.current.get(payload.resource.id) ?? 0

      if (payload.version <= lastVersion) {
        return
      }

      orderVersions.current.set(payload.resource.id, payload.version)
      queryClient.setQueryData(
        ["order", payload.data.userId, payload.data.orderId],
        payload.data
      )
    }

    function handleConnectError(error: Error) {
      console.error("[CLIENT] Erro na conexão Socket.IO:", error.message)
    }

    function handleDisconnect(reason: string) {
      console.warn("[CLIENT] Socket.IO desconectado:", reason)
    }

    function handleNftUpdated(payload: unknown) {
      if (!isNftUpdatedEvent(payload)) {
        console.error("[CLIENT] Evento nft.updated inválido:", payload)
        return
      }

      const currentVersion =
        lastVersions.current.get(payload.resource.id) ?? 0

      if (payload.version <= currentVersion) {
        return
      }

      lastVersions.current.set(payload.resource.id, payload.version)

      queryClient.setQueryData<NFT[]>(["nfts"], (current) =>
        current?.map((nft) =>
          nft.id === payload.data.id
            ? { ...nft, ...payload.data }
            : nft
        )
      )
      queryClient.setQueriesData<NFTCatalogResponse>(
        { queryKey: ["nft-catalog"] },
        (current) =>
          current
            ? {
                ...current,
                items: current.items.map((nft) =>
                  nft.id === payload.data.id
                    ? { ...nft, ...payload.data }
                    : nft
                ),
                featured: current.featured.map((nft) =>
                  nft.id === payload.data.id
                    ? { ...nft, ...payload.data }
                    : nft
                ),
              }
            : current
      )
      void queryClient.invalidateQueries({
        queryKey: ["nft-catalog"],
      })
      void queryClient.invalidateQueries({
        queryKey: ["quote"],
      })
      queryClient.setQueryData<NFT>(
        ["nft", payload.data.id],
        (current) =>
          current ? { ...current, ...payload.data } : current
      )
      updateNFT(payload.data)

      const nftName =
        itemNamesRef.current.get(payload.data.id) ??
        payload.data.id

      setNotice(
        `${nftName}: preço atualizado para ${formatEth(payload.data.price)} ETH; ${
          payload.data.available
            ? `${payload.data.availableQuantity} edição(ões) disponível(is).`
            : "sem edições disponíveis."
        }`
      )
      window.clearTimeout(noticeTimer)
      noticeTimer = window.setTimeout(() => setNotice(null), 6000)
    }

    void import("../lib/socket")
      .then(({ socket }) => {
        if (disposed) return

        clientSocket = socket
        socketRef.current = socket
        socket.on("connect", handleConnect)
        socket.on("connect_error", handleConnectError)
        socket.on("disconnect", handleDisconnect)
        socket.on("nft.updated", handleNftUpdated)
        socket.on("order.updated", handleOrderUpdated)
        socket.connect()
      })
      .catch((error: unknown) => {
        console.error("[CLIENT] Falha ao iniciar Socket.IO:", error)
      })

    return () => {
      disposed = true
      window.clearTimeout(noticeTimer)
      if (!clientSocket) return

      clientSocket.off("connect", handleConnect)
      clientSocket.off("connect_error", handleConnectError)
      clientSocket.off("disconnect", handleDisconnect)
      clientSocket.off("nft.updated", handleNftUpdated)
      clientSocket.off("order.updated", handleOrderUpdated)
      clientSocket.disconnect()
      socketRef.current = undefined
    }
  }, [queryClient, updateNFT, user?.id])

  useEffect(() => {
    const itemIds = items.map((item) => item.nft.id)
    itemIdsRef.current = itemIds
    itemNamesRef.current = new Map(
      items.map((item) => [item.nft.id, item.nft.name])
    )

    const socket = socketRef.current

    if (socket?.connected) {
      socket.emit("nft.subscribe", { nftIds: itemIds })
    }
  }, [items])

  return notice ? (
    <div
      className="fixed bottom-5 right-5 z-[100] max-w-sm border border-kurio-primary bg-kurio-surface px-5 py-4 text-sm text-kurio-text shadow-xl"
      role="status"
      aria-live="polite"
    >
      {notice}
    </div>
  ) : null
}