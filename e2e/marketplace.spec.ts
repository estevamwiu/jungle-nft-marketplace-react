import { expect, test } from "@playwright/test"

test("catalog categories, networks, pagination, and browser history", async ({
  page,
}) => {
  await page.goto("/?scenario=default")

  await expect(page.getByRole("searchbox")).toHaveCount(0)
  const filters = page.getByRole("complementary", { name: "Filtros" })
  const mobileFilterToggle = page.getByRole("button", {
    name: "Filtros do catálogo",
  })
  if ((await page.viewportSize())!.width < 1024) {
    await mobileFilterToggle.click()
  }
  await filters.getByRole("button", { name: "Jogos 1" }).click()
  await expect(page).toHaveURL(/category=Games/)
  await expect(
    page.getByRole("link", { name: /Pixel Quest #022/ })
  ).toBeVisible()

  await filters.getByRole("button", { name: "Ethereum" }).click()
  await expect(page).toHaveURL(/network=Ethereum/)
  await expect(
    page.getByRole("link", { name: /Pixel Quest #022/ })
  ).toBeVisible()
  await filters.getByRole("button", { name: "Ethereum" }).click()
  await expect(page).not.toHaveURL(/network=/)

  await filters.getByRole("button", { name: "Todas 29" }).click()
  await filters.getByRole("button", { name: "Solana" }).click()
  await expect(page).toHaveURL(/network=Solana/)
  await expect(
    page.getByRole("link", { name: /Ivory Baron #052/ })
  ).toBeVisible()
  await filters.getByRole("button", { name: "Solana" }).click()
  await expect(page).not.toHaveURL(/network=/)

  await expect(
    page.getByRole("button", { name: "Página 4" })
  ).toBeVisible()
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
  await expect(page.getByRole("status")).toBeVisible()
  await expect(page.getByRole("searchbox")).toHaveCount(0)
  const filters = page.getByRole("complementary", { name: "Filtros" })
  if ((await page.viewportSize())!.width < 1024) {
    const mobileFilterToggle = page.getByRole("button", {
      name: "Filtros do catálogo",
    })
    await mobileFilterToggle.click()
  }
  await expect(
    filters.getByRole("heading", { name: "Coleções", exact: true })
  ).toBeVisible()
  await expect(
    filters.getByRole("button", { name: "Fotografia 4" })
  ).toBeVisible()
  await expect(
    filters.getByRole("heading", { name: "Rede", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: /Emerald Ape #042/ }).first()
  ).toBeVisible()
})

test("NFT details and cart quote expose skeletons during latency", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/nft/1?scenario=latency", { waitUntil: "commit" })
  const detailLoadingStatus = page.getByRole("status", {
    name: "Carregando detalhes do NFT...",
  })
  await expect(detailLoadingStatus).toBeVisible()
  await expect(
    page.locator(".skeleton-shimmer").first()
  ).toHaveCSS("animation-name", "none")
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()

  await page.goto("/cart?scenario=latency", { waitUntil: "commit" })
  const quoteLoadingStatus = page.getByRole("status", {
    name: "Calculando resumo do carrinho...",
  })
  await expect(quoteLoadingStatus).toBeVisible()
  await expect(quoteLoadingStatus).toBeHidden()
  await expect(page.getByText("Cotação válida até")).toBeVisible()
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
