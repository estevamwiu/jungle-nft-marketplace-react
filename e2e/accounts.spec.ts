import { expect, test } from "@playwright/test"
import { loginAs, logout } from "./helpers"

test("expired sessions are cleared and another demo account can sign in", async ({
  page,
}) => {
  await loginAs(page)
  await page.goto("/?scenario=session-expired")

  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("jungle-auth-token"))
    )
    .toBeNull()

  await loginAs(page, "collector@jungle.com")
  await page.goto("/profile")
  await expect(page.locator("#profile-email")).toHaveValue(
    "collector@jungle.com"
  )
  await page.goto("/")
  await logout(page)
  await loginAs(page)
  await page.goto("/profile")
  await expect(page.locator("#profile-email")).toHaveValue(
    "demo@jungle.com"
  )
})

test("favorite state is isolated per user and failed mutations are announced", async ({
  page,
}) => {
  await loginAs(page)
  await page.goto("/nft/1?scenario=default")

  const favoriteButton = page.getByRole("button", { name: "Favoritar" })
  await expect(favoriteButton).toHaveAttribute("aria-pressed", "false")
  await favoriteButton.click()
  await expect(
    page.getByRole("button", { name: "Favoritado" })
  ).toHaveAttribute("aria-pressed", "true")

  await logout(page)
  await loginAs(page, "collector@jungle.com")
  await page.goto("/nft/1?scenario=default")
  await expect(
    page.getByRole("button", { name: "Favoritar" })
  ).toHaveAttribute("aria-pressed", "false")

  await page.goto("/nft/1?scenario=favorites-error")
  await page.getByRole("button", { name: "Favoritar" }).click()
  await expect(
    page.getByRole("alert").filter({
      hasText: "Não foi possível atualizar o favorito.",
    })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Favoritar" })
  ).toHaveAttribute("aria-pressed", "false")
})

test("profile changes persist after a page reload", async ({ page }) => {
  await loginAs(page)
  await page.goto("/profile")
  await page.locator("#profile-display-name").fill("Updated Collector")
  await page.locator("#profile-username").fill("updated-collector")
  await page.getByRole("button", { name: "Salvar perfil" }).click()
  await expect(page.getByText("Perfil salvo com sucesso.")).toBeVisible()

  await page.reload()
  await expect(page.locator("#profile-display-name")).toHaveValue(
    "Updated Collector"
  )
  await expect(page.locator("#profile-username")).toHaveValue(
    "updated-collector"
  )
})

test("password changes reject wrong credentials and allow login with the new password", async ({
  page,
}) => {
  await loginAs(page)
  await page.goto("/profile")
  await page.locator("#current-password").fill("wrong-password")
  await page.locator("#new-password").fill("new-password")
  await page.locator("#confirm-new-password").fill("new-password")
  await page.getByRole("button", { name: "Salvar nova senha" }).click()
  await expect(page.getByRole("alert")).toHaveText(
    "A senha atual está incorreta."
  )

  await page.locator("#current-password").fill("123456")
  await page.getByRole("button", { name: "Salvar nova senha" }).click()
  await expect(page.getByText("Senha alterada com sucesso.")).toBeVisible()
  await page.goto("/")
  await logout(page)
  await loginAs(page, "demo@jungle.com", "new-password")
})
