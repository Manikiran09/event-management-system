import { expect, test } from "@playwright/test";

const ADMIN_KEY = process.env.ADMIN_REGISTRATION_KEY || "admin-secret-key";
const API_ORIGIN = process.env.PLAYWRIGHT_API_ORIGIN || "http://127.0.0.1:10000";
const API_BASE_URL = `${API_ORIGIN}/api`;

const MOBILE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 360, height: 740 },
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 412, height: 915 },
  { width: 414, height: 896 },
];

const PUBLIC_ROUTES = [
  {
    path: "/login",
    label: "login",
    assertVisible: async (page) => {
      await expect(page.locator("text=Sign In").first()).toBeVisible();
    },
  },
  {
    path: "/register",
    label: "register",
    assertVisible: async (page) => {
      await expect(page.getByRole("heading", { name: "Sign Up" })).toBeVisible();
    },
  },
];

const PROTECTED_ROUTES = [
  { path: "/dashboard", label: "dashboard" },
  { path: "/events", label: "events" },
  { path: "/admin/users", label: "admin users" },
];

const TEST_ADMIN_NAME = "Mobile Smoke Admin";
const TEST_ADMIN_EMAIL = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL || "mobile-smoke-admin@example.com";
const TEST_ADMIN_PASSWORD = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD || "TestPass123!";

let isBackendAvailable = false;

test.beforeAll(async ({ request }) => {
  try {
    const response = await request.get(`${API_ORIGIN}/health`, {
      timeout: 10_000,
    });
    isBackendAvailable = response.ok();
  } catch {
    isBackendAvailable = false;
  }
});

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
  const login = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    },
  });

  if (login.ok()) {
    const body = await login.json();
    expect(body.token).toBeTruthy();
    return body.token;
  }

  const register = await request.post(`${API_BASE_URL}/auth/register`, {
    data: {
      name: TEST_ADMIN_NAME,
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
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

let caseNumber = 1;

for (const route of PUBLIC_ROUTES) {
  for (const viewport of MOBILE_VIEWPORTS) {
    const label = `mobile case ${caseNumber}: ${route.label} ${viewport.width}x${viewport.height}`;

    test(label, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/#${route.path}`);
      await route.assertVisible(page);
      await assertNoHorizontalOverflow(page, `${route.path} ${viewport.width}x${viewport.height}`);
    });

    caseNumber += 1;
  }
}

for (const route of PROTECTED_ROUTES) {
  for (const viewport of MOBILE_VIEWPORTS) {
    const label = `mobile case ${caseNumber}: ${route.label} ${viewport.width}x${viewport.height}`;

    test(label, async ({ page, request }) => {
      test.skip(
        !isBackendAvailable,
        `Backend API is unavailable at ${API_ORIGIN}. Skipping protected route checks.`
      );
      await openAsAuthenticated(page, request, route.path, viewport);
    });

    caseNumber += 1;
  }
}
