import type { EthAmount } from "@/features/nft/types"

const WEI_PER_ETH = 10n ** 18n
const ETH_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/

export function isEthAmount(value: unknown): value is EthAmount {
  return typeof value === "string" && ETH_PATTERN.test(value)
}

export function toWei(value: EthAmount): bigint {
  if (!isEthAmount(value)) {
    throw new Error(`Valor ETH inválido: ${value}`)
  }

  const [whole, fraction = ""] = value.split(".")
  return (
    BigInt(whole) * WEI_PER_ETH +
    BigInt(fraction.padEnd(18, "0") || "0")
  )
}

export function fromWei(value: bigint): EthAmount {
  if (value < 0n) {
    throw new Error("Valores ETH não podem ser negativos.")
  }

  const whole = value / WEI_PER_ETH
  const fraction = (value % WEI_PER_ETH)
    .toString()
    .padStart(18, "0")
    .replace(/0+$/, "")

  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export function addEth(left: EthAmount, right: EthAmount): EthAmount {
  return fromWei(toWei(left) + toWei(right))
}

export function multiplyEth(
  amount: EthAmount,
  quantity: number
): EthAmount {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error("A quantidade deve ser um inteiro não negativo.")
  }

  return fromWei(toWei(amount) * BigInt(quantity))
}

export function compareEth(left: EthAmount, right: EthAmount): number {
  const leftWei = toWei(left)
  const rightWei = toWei(right)

  return leftWei < rightWei ? -1 : leftWei > rightWei ? 1 : 0
}

export function sumEth(values: EthAmount[]): EthAmount {
  return fromWei(
    values.reduce((total, value) => total + toWei(value), 0n)
  )
}

export function formatEth(value: EthAmount): string {
  return fromWei(toWei(value))
}
