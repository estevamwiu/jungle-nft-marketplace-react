import { expect, test } from "@playwright/test"

test("catalog filters, sort, pagination, and browser history", async ({
  page,
}) => {
  await page.goto("/?scenario=default")

  const search = page.getByRole("searchbox", {
    name: "Buscar NFT por nome",
  })
  await search.fill("quiet current")
  await expect(page).toHaveURL(/q=quiet\+current/)
  await expect(
    page.getByRole("link", { name: /Quiet Current #019/ })
  ).toBeVisible()

  await page.getByRole("button", { name: /Photography/ }).click()
  await expect(page).toHaveURL(/category=Photography/)
  await expect(
    page.getByRole("button", { name: /Photography/ })
  ).toHaveAttribute("aria-pressed", "true")

  await page.getByRole("button", { name: "Todas" }).click()
  await search.fill("")
  await page.getByLabel("Ordenar por:").selectOption("price-desc")
  await expect(page).toHaveURL(/sort=price-desc/)
  await page.getByRole("button", { name: "Próxima página" }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(
    page.getByRole("button", { name: "Página 2" })
  ).toHaveAttribute("aria-current", "page")

  await page.goBack()
  await expect(page).not.toHaveURL(/page=2/)
  await expect(page.getByLabel("Ordenar por:")).toHaveValue("price-desc")
})

test("direct NFT links load and missing NFTs show a not-found state", async ({
  page,
}) => {
  await page.goto("/nft/1?scenario=default")
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042" })
  ).toBeVisible()

  await page.goto("/nft/999?scenario=default")
  await expect(
    page.getByRole("heading", { name: "NFT não encontrado" })
  ).toBeVisible()
})

test("catalog latency exposes loading feedback before data arrives", async ({
  page,
}) => {
  await page.goto("/?scenario=latency")
  await expect(page.getByText("Carregando NFTs...")).toBeVisible()
  await expect(
    page.getByRole("link", { name: /Emerald Ape #042/ }).first()
  ).toBeVisible()
})

test("catalog failure can be recovered after returning to the default scenario", async ({
  page,
}) => {
  await page.goto("/?scenario=catalog-error")
  await expect(
    page.getByText("Não foi possível carregar os NFTs.")
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Tentar novamente" })
  ).toBeVisible()

  await page.goto("/?scenario=default")
  await expect(
    page.getByRole("link", { name: /Emerald Ape #042/ }).first()
  ).toBeVisible()
})
