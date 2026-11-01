import { expect, test, type Page } from "@playwright/test"
import { loginAs } from "./helpers"

async function openCheckout(
  page: Page,
  scenario = "default",
  connectWallet = true
) {
  await loginAs(page)
  await page.goto(`/nft/1?scenario=${scenario}`)
  await page.getByRole("button", { name: "Comprar" }).click()
  await page.getByRole("button", { name: "Conectar e finalizar" }).click()

  await page.getByLabel("Nome de exibição").fill("Demo Collector")
  await page.getByLabel("Nome de usuário").fill("demo-collector")
  await page.getByLabel("Rede").selectOption("Ethereum")
  await page.getByLabel("Nome do perfil").fill("Kurio Demo")
  await page
    .getByLabel("Endereço da carteira")
    .fill(`0x${"a".repeat(40)}`)
  await page.getByLabel("Tipo de carteira").selectOption("MetaMask")
  await page.locator("#email").fill("demo@jungle.com")
  if (connectWallet) {
    await page.getByRole("button", { name: "Conectar carteira" }).click()
    await expect(
      page.getByText("Carteira conectada para esta simulação.")
    ).toBeVisible()
  }
}

test("a successful purchase reaches its confirmed receipt", async ({
  page,
}) => {
  await openCheckout(page)
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(
    page.getByRole("heading", { name: "Compra concluída!" })
  ).toBeVisible({ timeout: 10_000 })
})

test("a timed-out purchase retries with the same idempotency key", async ({
  page,
}) => {
  const idempotencyKeys: string[] = []
  page.on("request", (request) => {
    if (request.url().endsWith("/api/checkout")) {
      const key = request.headers()["idempotency-key"]

      if (key) {
        idempotencyKeys.push(key)
      }
    }
  })

  await openCheckout(page, "payment-timeout")
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(
    page.getByRole("alert").filter({
      hasText: "A resposta do pagamento expirou.",
    })
  ).toBeVisible()

  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(
    page.getByRole("heading", { name: "Compra concluída!" })
  ).toBeVisible({ timeout: 10_000 })
  expect(idempotencyKeys).toHaveLength(2)
  expect(idempotencyKeys[1]).toBe(idempotencyKeys[0])
})

test("declined payments leave the cart available for recovery", async ({
  page,
}) => {
  await openCheckout(page, "payment-declined")
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(
    page.getByRole("alert").filter({
      hasText: "O pagamento foi recusado.",
    })
  ).toBeVisible({ timeout: 10_000 })

  await page.goto("/cart?scenario=default")
  await expect(
    page.getByText("Emerald Ape #042").first()
  ).toBeVisible()
})

test("rejected wallet connection can be retried", async ({ page }) => {
  await openCheckout(page, "wallet-rejected", false)
  await page.getByRole("button", { name: "Conectar carteira" }).click()
  await expect(
    page.getByRole("alert").filter({
      hasText: "A conexão da carteira foi recusada.",
    })
  ).toBeVisible()

  await page.goto("/checkout?scenario=default")
  await page.getByLabel("Nome de exibição").fill("Demo Collector")
  await page.getByLabel("Nome de usuário").fill("demo-collector")
  await page.getByLabel("Rede").selectOption("Ethereum")
  await page.getByLabel("Nome do perfil").fill("Kurio Demo")
  await page
    .getByLabel("Endereço da carteira")
    .fill(`0x${"a".repeat(40)}`)
  await page.getByLabel("Tipo de carteira").selectOption("MetaMask")
  await page.locator("#email").fill("demo@jungle.com")
  await page.getByRole("button", { name: "Conectar carteira" }).click()
  await expect(
    page.getByText("Carteira conectada para esta simulação.")
  ).toBeVisible()
  const confirmButton = page.getByRole("button", {
    name: "Confirmar compra",
  })
  const receipt = page.getByRole("heading", { name: "Compra concluída!" })
  const stalePriceAlert = page
    .getByRole("alert")
    .filter({ hasText: "O preço de um NFT foi atualizado." })

  await confirmButton.click()
  await expect
    .poll(async () => (await receipt.isVisible()) || (await stalePriceAlert.isVisible()))
    .toBe(true)

  if (await stalePriceAlert.isVisible()) {
    await expect(confirmButton).toBeEnabled()
    await confirmButton.click()
  }

  await expect(receipt).toBeVisible({ timeout: 10_000 })
})

test("pending orders recover after a socket interruption and page reload", async ({
  page,
}) => {
  const disconnectMessages: string[] = []
  page.on("console", (message) => {
    if (message.text().includes("[CLIENT] Socket.IO desconectado:")) {
      disconnectMessages.push(message.text())
    }
  })

  await openCheckout(page, "socket-disconnect")
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(
    page.getByRole("button", { name: "Aguardando pagamento..." })
  ).toBeVisible()
  await expect.poll(() => disconnectMessages.length).toBeGreaterThan(0)

  await expect(page).toHaveURL(/\/checkout/)
  await page.reload()
  await expect(page).toHaveURL(/\/checkout/)
  await expect(
    page.getByRole("heading", { name: "Compra concluída!" })
  ).toBeVisible({ timeout: 10_000 })
})

test("old and duplicate realtime events do not regress a confirmed order", async ({
  page,
}) => {
  await openCheckout(page, "out-of-order")
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(
    page.getByRole("heading", { name: "Compra concluída!" })
  ).toBeVisible({ timeout: 10_000 })
})

test("confirmation removes purchased quantities without clearing new cart additions", async ({
  page,
}) => {
  await openCheckout(page, "socket-disconnect")
  await page.getByRole("button", { name: "Confirmar compra" }).click()
  await expect(
    page.getByRole("button", { name: "Aguardando pagamento..." })
  ).toBeVisible()

  await page
    .locator("header")
    .getByRole("link", { name: "KURIO" })
    .click()
  await page
    .getByRole("link", { name: /Emerald Ape #042/ })
    .first()
    .click()
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
  await page
    .getByRole("link", { name: "Carrinho com 2 itens" })
    .click()
  await expect(page.getByText("2 edição(ões) no carrinho")).toBeVisible()
  await page.getByRole("button", { name: "Conectar e finalizar" }).click()

  await expect(
    page.getByRole("heading", { name: "Compra concluída!" })
  ).toBeVisible({ timeout: 10_000 })
  await page.getByRole("button", { name: "Fechar confirmação" }).click()
  await page
    .getByRole("link", { name: "Carrinho com 1 itens" })
    .click()
  await expect(page.getByText("1 edição(ões) no carrinho")).toBeVisible()
})
