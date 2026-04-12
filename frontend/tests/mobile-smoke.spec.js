import { expect, test } from "@playwright/test";

const ADMIN_KEY = process.env.ADMIN_REGISTRATION_KEY || "admin-secret-key";

const assertNoHorizontalOverflow = async (page, contextLabel) => {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(metrics.scrollWidth, `${contextLabel} has horizontal overflow`).toBeLessThanOrEqual(
    metrics.clientWidth + 1
  );
};

const createAdminToken = async (request) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `mobile-admin-${suffix}@example.com`;
  const password = "TestPass123!";

  const register = await request.post("http://localhost:10000/api/auth/register", {
    data: {
      name: `Mobile Admin ${suffix}`,
      email,
      password,
      role: "admin",
      adminKey: ADMIN_KEY,
    },
  });

  expect(register.ok()).toBeTruthy();
  const body = await register.json();
  expect(body.token).toBeTruthy();
  return body.token;
};

const openAsAuthenticated = async (page, request, path, viewport) => {
  const token = await createAdminToken(request);
  await page.setViewportSize(viewport);
  await page.addInitScript((value) => localStorage.setItem("token", value), token);
  await page.goto(`/#${path}`);
  await expect(page.locator("text=EventHub").first()).toBeVisible();
  await assertNoHorizontalOverflow(page, `${path} at ${viewport.width}x${viewport.height}`);
};

test("mobile case 1: login page 320x568", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#/login");
  await expect(page.locator("text=Sign In").first()).toBeVisible();
  await assertNoHorizontalOverflow(page, "login 320x568");
});

test("mobile case 2: login page 360x800", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#/login");
  await expect(page.locator("text=Sign In").first()).toBeVisible();
  await assertNoHorizontalOverflow(page, "login 360x800");
});

test("mobile case 3: login page 390x844", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/login");
  await expect(page.locator("text=Sign In").first()).toBeVisible();
  await assertNoHorizontalOverflow(page, "login 390x844");
});

test("mobile case 4: register page 320x568", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#/register");
  await expect(page.getByRole("heading", { name: "Sign Up" })).toBeVisible();
  await assertNoHorizontalOverflow(page, "register 320x568");
});

test("mobile case 5: register page 360x800", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#/register");
  await expect(page.getByRole("heading", { name: "Sign Up" })).toBeVisible();
  await assertNoHorizontalOverflow(page, "register 360x800");
});

test("mobile case 6: register page 390x844", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/register");
  await expect(page.getByRole("heading", { name: "Sign Up" })).toBeVisible();
  await assertNoHorizontalOverflow(page, "register 390x844");
});

test("mobile case 7: dashboard page 320x568", async ({ page, request }) => {
  await openAsAuthenticated(page, request, "/dashboard", { width: 320, height: 568 });
});

test("mobile case 8: dashboard page 360x800", async ({ page, request }) => {
  await openAsAuthenticated(page, request, "/dashboard", { width: 360, height: 800 });
});

test("mobile case 9: events page 320x568", async ({ page, request }) => {
  await openAsAuthenticated(page, request, "/events", { width: 320, height: 568 });
});

test("mobile case 10: events page 390x844", async ({ page, request }) => {
  await openAsAuthenticated(page, request, "/events", { width: 390, height: 844 });
});

test("mobile case 11: admin users page 320x568", async ({ page, request }) => {
  await openAsAuthenticated(page, request, "/admin/users", { width: 320, height: 568 });
});

test("mobile case 12: admin users page 390x844", async ({ page, request }) => {
  await openAsAuthenticated(page, request, "/admin/users", { width: 390, height: 844 });
});
