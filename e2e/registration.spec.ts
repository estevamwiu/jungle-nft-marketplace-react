import { expect, test } from "@playwright/test"

test("registration validates passwords, reports duplicate users, and creates a new account", async ({
  page,
}) => {
  await page.goto("/register?scenario=default")

  await page.locator("#register-name").fill("Test Collector")
  await page.locator("#register-email").fill("demo@jungle.com")
  await page.locator("#register-password").fill("123456")
  await page.locator("#register-confirm-password").fill("different")
  await page.getByRole("button", { name: "Criar conta" }).click()
  await expect(page.getByRole("alert")).toHaveText(
    "As senhas não coincidem."
  )

  await page.locator("#register-confirm-password").fill("123456")
  await page.getByRole("button", { name: "Criar conta" }).click()
  await expect(page.getByRole("alert")).toHaveText(
    "Este e-mail já está cadastrado."
  )

  const email = `collector-${Date.now()}@jungle.com`
  await page.locator("#register-email").fill(email)
  await page.getByRole("button", { name: "Criar conta" }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.locator("#login-email").fill(email)
  await page.locator("#login-password").fill("123456")
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/(?:\?.*)?$/)
})

test("invalid login reports an error and allows retry", async ({ page }) => {
  await page.goto("/login?scenario=default")
  await page.locator("#login-email").fill("demo@jungle.com")
  await page.locator("#login-password").fill("wrong-password")
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page.getByRole("alert")).toHaveText(
    "E-mail ou senha inválidos."
  )

  await page.locator("#login-password").fill("123456")
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/(?:\?.*)?$/)
})
