import { expect, test, type Page } from "@playwright/test"
import { loginAs } from "./helpers"

async function waitForViewportAssets(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
  })

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    )
    .toBeLessThanOrEqual(1)

  await expect
    .poll(() =>
      page.evaluate(() => {
        const { innerHeight, innerWidth } = window

        return Array.from(document.images)
          .filter((image) => {
            const bounds = image.getBoundingClientRect()

            return (
              bounds.bottom > 0 &&
              bounds.right > 0 &&
              bounds.top < innerHeight &&
              bounds.left < innerWidth
            )
          })
          .every((image) => image.complete && image.naturalWidth > 0)
      })
    )
    .toBe(true)
}

async function waitForUpdatedQuote(page: Page) {
  await expect(page.getByText("1.2 ETH", { exact: true }).first())
    .toBeVisible()
  await expect(page.getByText("1.205 ETH", { exact: true }))
    .toBeVisible()
}

test("marketplace home visual baseline", async ({ page }) => {
  await page.goto("/?scenario=default")
  await expect(
    page.getByRole("heading", {
      name: "Seja dono da cultura digital",
    })
  ).toBeVisible()
  await expect(
    page.getByText(
      "Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet."
    )
  ).toBeVisible()
  await expect(
    page.getByRole("heading", {
      name: "Lançamentos gênesis de edição limitada",
    })
  ).toBeVisible()
  await expect(
    page.getByText(
      "Colecione edições exclusivas diretamente dos criadores antes da revelação pública."
    )
  ).toBeVisible()
  await expect(
    page.getByRole("heading", {
      name: "Arte digital selecionada e muito mais",
    })
  ).toBeVisible()
  await expect(
    page.getByText(
      "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura."
    )
  ).toBeVisible()
  await expect(
    page.getByText("12 de setembro | Leitura de 6 min")
  ).toBeVisible()
  await expect(
    page.getByText("13 de setembro | Leitura de 2 min")
  ).toBeVisible()
  await expect(
    page.getByText("15 de setembro | Leitura de 3 min")
  ).toBeVisible()
  await expect(
    page.getByText("15 de setembro | Leitura de 2 min")
  ).toBeVisible()
  await expect(
    page.getByText(
      "Proteja sua carteira, seus ativos e sua identidade."
    )
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Destaque anterior" })
  ).toHaveCount(0)
  await page.getByRole("button", {
    name: "Mostrar destaque Sage Nomad #014",
  }).click()
  await expect(
    page.getByRole("img", { name: "Sage Nomad #014 em destaque" })
  ).toBeVisible()
  await page.getByRole("button", {
    name: "Mostrar destaque Emerald Ape #042",
  }).click()
  await waitForViewportAssets(page)

  await expect(page).toHaveScreenshot("marketplace-home.png", {
    animations: "disabled",
    caret: "hide",
  })
})

test("marketplace catalog visual baseline", async ({ page }) => {
  await page.goto("/?scenario=default")
  await waitForViewportAssets(page)
  await page.locator("#marketplace").evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto"
    element.scrollIntoView({ block: "start" })
  })
  await expect
    .poll(() =>
      page.locator("#marketplace").evaluate((element) =>
        Math.round(element.getBoundingClientRect().top)
      )
    )
    .toBe(96)
  await expect(page.getByRole("searchbox")).toHaveCount(0)
  const mobileFilterToggle = page.getByRole("button", {
    name: "Filtros do catálogo",
  })
  if ((await page.viewportSize())!.width < 1024) {
    await mobileFilterToggle.click()
  }
  await expect(
    page.getByRole("button", { name: "Fotografia 4" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Rede", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: /Emerald Ape #042/ }).first()
  ).toBeVisible()
  if ((await page.viewportSize())!.width < 1024) {
    await mobileFilterToggle.click()
  }
  await waitForViewportAssets(page)

  await expect(page).toHaveScreenshot("marketplace-catalog.png", {
    animations: "disabled",
    caret: "hide",
  })
})

test("NFT details visual baseline", async ({ page }) => {
  await page.goto("/nft/1?scenario=default")
  await expect(
    page.getByRole("heading", { name: "Emerald Ape #042" })
  ).toBeVisible()
  await waitForViewportAssets(page)

  await expect(page).toHaveScreenshot("nft-details.png", {
    animations: "disabled",
    caret: "hide",
  })
})

test("cart visual baseline", async ({ page }) => {
  await page.goto("/nft/1?scenario=default")
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
  await page.goto("/cart?scenario=default")
  await expect(
    page.getByRole("heading", { name: "Resumo da carteira" })
  ).toBeVisible()
  await expect(page.getByText("Cotação válida até")).toBeVisible()
  await waitForUpdatedQuote(page)
  await waitForViewportAssets(page)

  await expect(page).toHaveScreenshot("cart.png", {
    animations: "disabled",
    caret: "hide",
    mask: [page.getByText(/^Cotação válida até/)],
  })
})

test("payment visual baseline", async ({ page }) => {
  await loginAs(page)
  await page.goto("/nft/1?scenario=default")
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click()
  await page.goto("/cart?scenario=default")
  await page.getByRole("button", { name: "Conectar e finalizar" }).click()
  await expect(
    page.getByRole("heading", { name: "Perfil do colecionador" })
  ).toBeVisible()
  await waitForUpdatedQuote(page)
  await waitForViewportAssets(page)

  await page.addStyleTag({
    content:
      '[role="status"][aria-live="polite"].fixed { visibility: hidden !important; }',
  })

  await expect(page).toHaveScreenshot("payment.png", {
    animations: "disabled",
    caret: "hide",
  })
})

test("login visual baseline", async ({ page }) => {
  await page.goto("/login?scenario=default")
  await expect(page.getByRole("dialog", { name: "Entrar" })).toBeVisible()

  if ((await page.viewportSize())!.width < 768) {
    await expect(
      page.getByRole("dialog", { name: "Entrar" }).getByRole("link", {
        name: "KURIO",
      })
    ).toBeVisible()
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Crie uma conta" })).toBeVisible()
  } else {
    await expect(page.getByRole("link", { name: "Criar conta" })).toBeVisible()
  }

  await expect(page).toHaveScreenshot("login.png", {
    animations: "disabled",
    caret: "hide",
  })
})

test("registration visual baseline", async ({ page }) => {
  await page.goto("/register?scenario=default")
  await expect(
    page.getByRole("dialog", { name: "Criar conta" })
  ).toBeVisible()

  if ((await page.viewportSize())!.width < 768) {
    await expect(
      page.getByRole("heading", { name: "Criar perfil de colecionador" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Entre" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Criar conta" })
    ).toHaveJSProperty("innerText", "Criar perfil")
  }

  await expect(page).toHaveScreenshot("register.png", {
    animations: "disabled",
    caret: "hide",
  })
})
