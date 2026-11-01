import { expect, test } from "@playwright/test"

test("image dialog traps keyboard focus, closes with Escape, and restores focus", async ({
  page,
}) => {
  await page.goto("/nft/1?scenario=default")

  const openButton = page.getByRole("button", {
    name: "Ampliar imagem do NFT",
  })
  await openButton.click()

  const dialog = page.getByRole("dialog", {
    name: "Imagem ampliada de Emerald Ape #042",
  })
  const closeButton = dialog.getByRole("button", {
    name: "Fechar imagem ampliada",
  })

  await expect(dialog).toBeVisible()
  await expect(closeButton).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(closeButton).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(openButton).toBeFocused()
})
