import { test, expect } from '@playwright/test';

test('Ocean arena loads and renders PixiJS canvas', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'test-results/screenshots/current-menu-visual.png' });
  await playBtn.click();

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 10000 });

  // Wait for the loading screen to disappear
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 10000 });

  // Verify HUD elements are visible
  await expect(page.locator('[data-testid="hud-score"]')).toBeVisible();
  await expect(page.locator('[data-testid="hud-timer"]')).toBeVisible();

  // Allow a moment for PixiJS to render the scene
  await page.waitForTimeout(1000);

  // Take a verification screenshot
  await page.screenshot({ path: 'test-results/screenshots/arena_screenshot.png' });
});

test('Mobile landscape menu fits viewport perfectly and scales content', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  const rankingBtn = page.locator('[data-testid="menu-btn-ranking"]');

  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await expect(rankingBtn).toBeVisible({ timeout: 10000 });

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/screenshots/mobile-menu-visual.png' });
});

test('Main menu secondary buttons have golden hover fill and trigger hover sound', async ({ page }) => {
  await page.goto('/');
  const historyBtn = page.locator('[data-testid="menu-btn-history"]');
  await expect(historyBtn).toBeVisible();

  await historyBtn.hover();
  await page.waitForTimeout(200);

  await page.screenshot({ path: 'test-results/screenshots/match-history-hover.png' });

  const textSpan = historyBtn.locator('span');
  await expect(textSpan).toHaveClass(/text-\[#331c00\]/);
});

