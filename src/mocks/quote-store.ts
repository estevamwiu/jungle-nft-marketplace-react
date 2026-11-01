import type {
  OrderItemSnapshot,
  QuoteSnapshot,
} from "@/features/checkout/types"
import { compareEth, fromWei, toWei } from "@/lib/money"
import { mockNfts } from "./nft-store"

export interface QuoteItemInput {
  nftId: string
  quantity: number
}

export type MockQuoteResult =
  | { kind: "quoted"; quote: QuoteSnapshot }
  | { kind: "invalid" }
  | { kind: "unavailable" }
  | { kind: "insufficient-stock" }
  | { kind: "coupon-invalid" }
  | { kind: "coupon-expired" }

const NETWORK_FEE = "0.005"

export function calculateMockQuote(
  inputItems: QuoteItemInput[],
  rawCouponCode: string
): MockQuoteResult {
  if (
    inputItems.length === 0 ||
    inputItems.some(
      (item) =>
        !item.nftId ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1
    ) ||
    new Set(inputItems.map((item) => item.nftId)).size !==
      inputItems.length
  ) {
    return { kind: "invalid" }
  }

  const couponCode = rawCouponCode.trim().toUpperCase()
  let discountBasisPoints = 0

  if (couponCode === "EXPIRED") {
    return { kind: "coupon-expired" }
  }

  if (couponCode) {
    if (couponCode === "JUNGLE10") {
      discountBasisPoints = 1000
    } else if (couponCode === "WELCOME5") {
      discountBasisPoints = 500
    } else {
      return { kind: "coupon-invalid" }
    }
  }

  const items: OrderItemSnapshot[] = []
  let subtotalWei = 0n

  for (const input of inputItems) {
    const nft = mockNfts.find((candidate) => candidate.id === input.nftId)

    if (!nft) {
      return { kind: "invalid" }
    }

    if (!nft.available) {
      return { kind: "unavailable" }
    }

    if (input.quantity > nft.availableQuantity) {
      return { kind: "insufficient-stock" }
    }

    items.push({
      id: nft.id,
      name: nft.name,
      image: nft.image,
      price: nft.price,
      quantity: input.quantity,
    })
    subtotalWei += toWei(nft.price) * BigInt(input.quantity)
  }

  const discountWei =
    (subtotalWei * BigInt(discountBasisPoints)) / 10_000n
  const feeWei = toWei(NETWORK_FEE)

  return {
    kind: "quoted",
    quote: {
      quoteId: crypto.randomUUID(),
      subtotal: fromWei(subtotalWei),
      discount: fromWei(discountWei),
      networkFee: NETWORK_FEE,
      total: fromWei(subtotalWei - discountWei + feeWei),
      couponCode: couponCode || null,
      items,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    },
  }
}

export function quotesMatch(
  expected: QuoteSnapshot,
  actual: QuoteSnapshot
): boolean {
  return (
    expected.subtotal === actual.subtotal &&
    expected.discount === actual.discount &&
    expected.networkFee === actual.networkFee &&
    expected.total === actual.total &&
    expected.couponCode === actual.couponCode &&
    expected.items.length === actual.items.length &&
    expected.items.every((item, index) => {
      const current = actual.items[index]
      return (
        item.id === current.id &&
        item.name === current.name &&
        item.image === current.image &&
        compareEth(item.price, current.price) === 0 &&
        item.quantity === current.quantity
      )
    })
  )
}
