// Regenerates docs/screenshots against the running preview server (pnpm preview).
import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1100, height: 700 },
  deviceScaleFactor: 2,
});
const login = async (email) => {
  await page.goto("http://127.0.0.1:4173/");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByLabel(/password/i).fill("password");
  await page.getByRole("button", { name: "Sign in" }).click();
};
await page.goto("http://127.0.0.1:4173/");
await page.screenshot({ path: "docs/screenshots/login.png" });
await login("manager@example.com");
await page.getByRole("heading", { name: "Projects" }).waitFor();
await page.screenshot({ path: "docs/screenshots/projects-manager.png" });
await page.getByRole("link", { name: "Checkout redesign" }).click();
await page.getByText("Address form fails on paste", { exact: true }).waitFor();
await page.screenshot({ path: "docs/screenshots/issues-manager.png" });
await page.getByRole("button", { name: "Sign out" }).click();
await login("viewer@example.com");
await page.getByRole("heading", { name: "Projects" }).waitFor();
await page.screenshot({ path: "docs/screenshots/projects-viewer.png" });
await browser.close();
