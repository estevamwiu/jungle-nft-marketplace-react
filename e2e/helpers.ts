import { expect, type Page } from "@playwright/test"

export async function loginAs(
  page: Page,
  email = "demo@jungle.com",
  password = "123456"
) {
  await page.goto("/login?scenario=default")
  await page.locator("#login-email").fill(email)
  await page.locator("#login-password").fill(password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/(?:\?.*)?$/)

  const menuButton = page.locator(
    'button[aria-controls="kurio-mobile-menu"]'
  )

  if (
    (await menuButton.isVisible()) &&
    !(await page.getByText(/Olá,/).isVisible())
  ) {
    await menuButton.click()
  }
}

export async function logout(page: Page) {
  const menuButton = page.locator(
    'button[aria-controls="kurio-mobile-menu"]'
  )
  const headerLogout = page
    .locator("header")
    .getByRole("button", { name: "Sair" })
  const isMobile = (page.viewportSize()?.width ?? 0) < 768

  if (isMobile) {
    await menuButton.click()
    await page
      .locator("#kurio-mobile-menu")
      .getByRole("button", { name: "Sair" })
      .click()
  } else {
    await headerLogout.click()
  }

  await expect(page).toHaveURL(/\/(?:\?.*)?$/)

  if (isMobile) {
    await menuButton.click()
    await expect(
      page
        .locator("#kurio-mobile-menu")
        .getByRole("link", { name: "Entrar" })
    ).toBeVisible()
  } else {
    await expect(
      page.locator("header").getByRole("link", { name: "Entrar" })
    ).toBeVisible()
  }
}
