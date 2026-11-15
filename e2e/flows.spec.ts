import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByLabel(/password/i).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("viewer: read-only experience", async ({ page }) => {
  await signIn(page, "viewer@example.com");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New project" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);

  await page.goto("/users");
  await expect(page.getByRole("heading", { name: /don’t have access/ })).toBeVisible();
});

test("manager: create a project and an issue, change its status", async ({ page }) => {
  await signIn(page, "manager@example.com");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: /name/i }).fill("Onboarding flow");
  await page.getByRole("dialog").getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "Onboarding flow" }).click();

  await page.getByRole("textbox", { name: "New issue" }).fill("Write copy");
  await page.getByRole("button", { name: "Add issue" }).click();
  const status = page.getByRole("combobox", { name: "Status for Write copy" });
  await status.selectOption("in_progress");
  await expect(status).toHaveValue("in_progress");
});

test("session survives a reload via the refresh token", async ({ page }) => {
  await signIn(page, "admin@example.com");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
});

test("keyboard: skip link and dialog focus management", async ({ page }) => {
  await signIn(page, "manager@example.com");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await page.reload(); // fresh load: focus starts at the top of the document
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  const trigger = page.getByRole("button", { name: "New project" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});
