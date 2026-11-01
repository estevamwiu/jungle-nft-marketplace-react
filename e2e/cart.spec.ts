import { expect, test } from "@playwright/test"
import { loginAs } from "./helpers"

test("cart quantities and valid coupons persist after refresh", async ({
  page,
}) => {
  await loginAs(page)
  await page.goto("/nft/1?scenario=default")
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
  await page
    .getByRole("link", { name: "Carrinho com 1 itens" })
    .click()

  await page
    .getByRole("button", {
      name: "Aumentar quantidade de Emerald Ape #042",
    })
    .click()
  await expect(page.getByText("2 edição(ões) no carrinho")).toBeVisible()

  await page.getByRole("textbox", { name: "Código promocional" }).fill("JUNGLE10")
  await page.getByRole("button", { name: "Aplicar" }).click()
  await expect(
    page.getByRole("status").filter({
      hasText: "Cupom JUNGLE10 aplicado com sucesso.",
    })
  ).toBeVisible()

  await page.reload()
  await expect(page.getByText("2 edição(ões) no carrinho")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Remover cupom JUNGLE10" })
  ).toBeVisible()
})

test("invalid and expired coupons show clear feedback without applying", async ({
  page,
}) => {
  await loginAs(page)
  await page.goto("/nft/1?scenario=default")
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
  await page
    .getByRole("link", { name: "Carrinho com 1 itens" })
    .click()

  const coupon = page.getByRole("textbox", { name: "Código promocional" })
  await coupon.fill("INVALID")
  await page.getByRole("button", { name: "Aplicar" }).click()
  await expect(
    page.getByRole("status").filter({
      hasText: "Este código promocional não é válido.",
    })
  ).toBeVisible()

  await coupon.fill("EXPIRED")
  await page.getByRole("button", { name: "Aplicar" }).click()
  await expect(
    page.getByRole("status").filter({
      hasText: "Este cupom expirou.",
    })
  ).toBeVisible()
})
