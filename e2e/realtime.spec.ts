import { expect, test } from "@playwright/test"
import { loginAs } from "./helpers"

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
