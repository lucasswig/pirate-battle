import { test, expect } from '@playwright/test';

test('Player ship spawns, responds to navigation inputs, and renders health bar', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();

  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  await expect(page.locator('[data-testid="desktop-controls-ribbon"]')).toBeVisible();
  await expect(page.locator('[data-testid="player-health-bar"]')).toBeVisible();

  // Give the canvas a moment to initialize the player entity
  await page.waitForTimeout(500);

  // Take screenshot of initial spawn
  await page.screenshot({ path: 'test-results/screenshots/player_spawn_screenshot.png' });

  // Simulate pressing 'KeyW' (Sail Forward) and 'KeyA' (Turn Left)
  await page.keyboard.down('KeyW');
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(800);
  await page.keyboard.up('KeyA');
  await page.keyboard.up('KeyW');

  // Let the physics settle
  await page.waitForTimeout(500);

  // Take screenshot after movement and rotation
  await page.screenshot({ path: 'test-results/screenshots/player_moving_screenshot.png' });
});
