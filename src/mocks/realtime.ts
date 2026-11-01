import { ws } from "msw"
import { toSocketIo } from "@mswjs/socket.io-binding"
import {
  finalizeMockOrder,
  findMockOrderEvent,
} from "./order-store"
import { getMockUserIdFromToken } from "./handlers"
import { updateMockNftPrice } from "./nft-store"
import { getMockScenario, waitForMockLatency } from "./scenarios"
import type {
  NftUpdatedEvent,
} from "@/features/realtime/types"
import type { OrderUpdatedEvent } from "@/features/checkout/types"

const socketOrigin = window.location.origin.replace(/^http/, "ws")
const realtime = ws.link(socketOrigin)
const orderTimers = new Map<string, number>()
const interruptedOrders = new Set<string>()

function scheduleOrderUpdate(
  orderId: string,
  pendingEvent: OrderUpdatedEvent,
  emitOrder: (event: OrderUpdatedEvent) => void,
  emitNft: (event: NftUpdatedEvent) => void
) {
  if (orderTimers.has(orderId)) {
    return
  }

  const delay = getMockScenario() === "socket-disconnect" ? 3_000 : 1_500
  const timer = window.setTimeout(async () => {
    orderTimers.delete(orderId)
    await waitForMockLatency()
    const declined = getMockScenario() === "payment-declined"
    const finalization = finalizeMockOrder(
      orderId,
      declined ? "declined" : "confirmed"
    )

    if (finalization) {
      finalization.nftEvents.forEach(emitNft)
      emitOrder(finalization.orderEvent)

      if (getMockScenario() === "out-of-order") {
        finalization.nftEvents.forEach(emitNft)
        emitOrder(pendingEvent)
        emitOrder(finalization.orderEvent)
      }
    }
  }, delay)

  orderTimers.set(orderId, timer)
}

export const realtimeHandler = realtime.addEventListener(
  "connection",
  (connection) => {
    console.log("[MSW] Conexão WebSocket interceptada")

    const io = toSocketIo(connection)
    const simulatedNfts = new Set<string>()
    const timers = new Set<number>()

    io.client.on("nft.subscribe", (_event, payload: unknown) => {
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("nftIds" in payload) ||
        !Array.isArray(payload.nftIds)
      ) {
        return
      }

      for (const id of payload.nftIds) {
        if (typeof id !== "string" || simulatedNfts.has(id)) {
          continue
        }

        simulatedNfts.add(id)

        const timer = window.setTimeout(() => {
          timers.delete(timer)
          const event = updateMockNftPrice(id)

          if (event) {
            io.client.emit("nft.updated", event)
          }
        }, 1500)

        timers.add(timer)
      }
    })

    io.client.on("order.subscribe", (_event, payload: unknown) => {
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("orderId" in payload) ||
        typeof payload.orderId !== "string" ||
        !("userId" in payload) ||
        typeof payload.userId !== "string" ||
        !("token" in payload) ||
        typeof payload.token !== "string" ||
        getMockUserIdFromToken(payload.token) !== payload.userId
      ) {
        return
      }

      const event = findMockOrderEvent(
        payload.orderId,
        payload.userId
      )

      if (!event) {
        return
      }

      io.client.emit("order.updated", event)

      if (event.data.status === "pending") {
        if (
          getMockScenario() === "socket-disconnect" &&
          !interruptedOrders.has(payload.orderId)
        ) {
          interruptedOrders.add(payload.orderId)
          window.setTimeout(() => {
            connection.client.close(
              4000,
              "simulated socket interruption"
            )
          }, 250)
        }

        scheduleOrderUpdate(
          payload.orderId,
          event,
          (updatedEvent) =>
            io.client.emit("order.updated", updatedEvent),
          (updatedEvent) =>
            io.client.emit("nft.updated", updatedEvent)
        )
      }
    })

    connection.client.addEventListener(
      "close",
      () => {
        timers.forEach((timer) => window.clearTimeout(timer))
        timers.clear()
      },
      { once: true }
    )
  }
)