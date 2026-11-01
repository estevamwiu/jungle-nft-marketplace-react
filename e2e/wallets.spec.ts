import { expect, test } from "@playwright/test"
import { loginAs } from "./helpers"

async function completePrimaryWallet(page: import("@playwright/test").Page) {
  await page.locator("#primary-displayName").fill("Wallet Owner")
  await page.locator("#primary-nickname").fill("Main wallet")
  await page.locator("#primary-network").selectOption("Ethereum")
  await page.locator("#primary-profileName").fill("Kurio Profile")
  await page.locator("#primary-address").fill(`0x${"b".repeat(40)}`)
  await page.locator("#primary-walletType").selectOption("MetaMask")
  await page.locator("#primary-referralCode").fill("JUNGLE")
  await page.locator("#primary-email").fill("demo@jungle.com")
  await page.locator("#primary-ensName").fill("collector")
}

test("wallet validation and saved values survive a page reload", async ({
  page,
}) => {
  await loginAs(page)
  await page.goto("/wallets")

  await page.getByRole("button", { name: "Salvar carteira" }).first().click()
  await expect(
    page.getByRole("alert").filter({ hasText: "Informe o nome de exibição." })
  ).toBeVisible()

  await completePrimaryWallet(page)
  await page.getByRole("button", { name: "Salvar carteira" }).first().click()
  await expect(
    page.getByText("Carteiras salvas com sucesso.")
  ).toBeVisible()

  await page.reload()
  await expect(page.locator("#primary-address")).toHaveValue(
    `0x${"b".repeat(40)}`
  )
  await expect(page.locator("#primary-ensName")).toHaveValue("collector")
})

test("invalid wallet addresses are linked to an accessible field error", async ({
  page,
}) => {
  await loginAs(page)
  await page.goto("/wallets")
  await page.locator("#primary-displayName").fill("Wallet Owner")
  await page.locator("#primary-nickname").fill("Main wallet")
  await page.locator("#primary-network").selectOption("Ethereum")
  await page.locator("#primary-profileName").fill("Kurio Profile")
  await page.locator("#primary-address").fill("not-an-address")
  await page.locator("#primary-walletType").selectOption("MetaMask")
  await page.locator("#primary-referralCode").fill("JUNGLE")
  await page.locator("#primary-email").fill("demo@jungle.com")
  await page.locator("#primary-ensName").fill("collector")
  await page.getByRole("button", { name: "Salvar carteira" }).first().click()

  const address = page.locator("#primary-address")
  await expect(address).toHaveAttribute("aria-invalid", "true")
  await expect(page.locator("#primary-address-error")).toHaveText(
    "Use um endereço 0x com 40 caracteres hexadecimais."
  )
})
