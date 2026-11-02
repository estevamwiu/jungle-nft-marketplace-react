import { expect, test } from "@playwright/test"
import { loginAs } from "./helpers"

test("mock Socket.IO stays connected beyond its heartbeat interval", async ({
  page,
}) => {
  test.setTimeout(45_000)

  const disconnects: string[] = []
  let connected = false

  page.on("console", (message) => {
    if (message.text().includes("[CLIENT] Socket.IO conectado:")) {
      connected = true
    }

    if (message.text().includes("[CLIENT] Socket.IO desconectado:")) {
      disconnects.push(message.text())
    }
  })

  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Seja dono da cultura digital" })
  ).toBeVisible()

  await expect
    .poll(() => connected, { timeout: 10_000 })
    .toBe(true)
  await page.waitForTimeout(32_000)

  expect(disconnects).toEqual([])
})

test("Socket.IO price updates refresh the NFT detail and cart quote", async ({
  page,
}) => {
  await loginAs(page)
  await page.goto("/nft/1?scenario=default")
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()

  await expect(
    page.getByRole("status").filter({
      hasText: "Emerald Ape #042: preço atualizado para 1.2 ETH",
    })
  ).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText("1.2 ETH").first()).toBeVisible()

  await page
    .getByRole("link", { name: "Carrinho com 1 itens" })
    .click()
  await expect(page.getByText("1.2 ETH").first()).toBeVisible()
})
