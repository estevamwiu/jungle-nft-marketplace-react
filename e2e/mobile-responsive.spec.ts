import { expect, test, type Page } from "@playwright/test"
import { loginAs } from "./helpers"

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    )
    .toBeLessThanOrEqual(1)
}

test("marketplace, checkout, and account pages fit a narrow mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })

  await page.goto("/?scenario=default")
  await expect(
    page.getByRole("heading", {
      name: "Seja dono da cultura digital",
    })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.locator("#marketplace").scrollIntoViewIfNeeded()
  await page.getByRole("button", { name: "Filtros do catálogo" }).click()
  await expect(
    page.getByRole("button", { name: "Fotografia 4" })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.goto("/nft/1?scenario=default")
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042" })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.goto("/login?scenario=default")
  await expect(page.getByRole("dialog", { name: "Entrar" })).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.goto("/register?scenario=default")
  await expect(
    page.getByRole("dialog", { name: "Criar conta" })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await loginAs(page)

  await page.goto("/nft/1?scenario=default")
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
  await page.goto("/cart?scenario=default")
  await expect(
    page.getByRole("heading", { name: "Resumo da carteira" })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.getByRole("button", { name: "Conectar e finalizar" }).click()
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.goto("/profile?scenario=default")
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.goto("/wallets?scenario=default")
  await expect(
    page.getByRole("heading", { name: "Carteira principal" })
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.goto("/activity?scenario=default")
  await expect(page.getByRole("heading", { name: "Atividade" })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
