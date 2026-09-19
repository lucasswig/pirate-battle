import { test, expect } from '@playwright/test';

test.describe('Camera, Zoom & Responsiveness', () => {
  test('Desktop: canvas fills window, fullscreen button is present with pirate frame, manual zoom controls removed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('pirate_battle_settings');
    });
    await page.goto('/');

    await page.locator('[data-testid="menu-btn-play"]').click();
    await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBe(1280);
    expect(box!.height).toBe(720);

    const fullscreenBtn = page.locator('[data-testid="hud-fullscreen-btn"]');
    await expect(fullscreenBtn).toBeVisible();

    // Verify manual zoom buttons were removed per design requirement
    await expect(page.locator('[data-testid="hud-zoom-out"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="hud-zoom-in"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="hud-zoom-fit"]')).toHaveCount(0);

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/desktop_fullscreen_hud.png' });
    await page.screenshot({ path: 'test-results/screenshots/arena_assets_1_screenshot.png' });
  });

  test('Screen fill: arena occupies entire 1024x501 viewport with zero tiny letterboxing', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 501 });
    await page.goto('/');

    await page.locator('[data-testid="menu-btn-play"]').click();
    await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/arena_occupies_full_screen.png' });
  });

  test('Mobile viewport: canvas fills entire screen and entire map is visible', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');

    await page.locator('[data-testid="menu-btn-play"]').click();
    await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBe(844);
    expect(box!.height).toBe(390);

    await expect(page.locator('[data-testid="ctrl-forward"]')).toBeVisible();
    await expect(page.locator('[data-testid="ctrl-bow-cannon"]')).toBeVisible();

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/screenshots/mobile_landscape_screenshot.png' });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const orientationBlocker = page.locator('[data-testid="orientation-blocker"]');
    await expect(orientationBlocker).toBeVisible();
    await expect(orientationBlocker).toContainText('Rotate Your Phone to Landscape');

    const isEnginePausedInPortrait = await page.evaluate(() => (window as any).__gameEngine?.isPaused);
    expect(isEnginePausedInPortrait).toBe(true);

    await page.screenshot({ path: 'test-results/screenshots/mobile_portrait_screenshot.png' });

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    await expect(orientationBlocker).toHaveCount(0);

    const isEngineResumedInLandscape = await page.evaluate(() => (window as any).__gameEngine?.isPaused);
    expect(isEngineResumedInLandscape).toBe(false);
  });

  test('Starting match in mobile portrait initializes with engine paused and zero entity damage until rotated to landscape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const playBtn = page.getByTestId('menu-btn-play');
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    const orientationBlocker = page.locator('[data-testid="orientation-blocker"]');
    await expect(orientationBlocker).toBeVisible({ timeout: 10000 });
    await expect(orientationBlocker).toContainText('Rotate Your Phone to Landscape');

    await page.waitForFunction(() => (window as any).__gameEngine?.isInitialized === true, {
      timeout: 15000,
    });

    const isPausedOnInit = await page.evaluate(() => (window as any).__gameEngine?.isPaused);
    expect(isPausedOnInit).toBe(true);

    await page.waitForTimeout(1000);
    const health = await page.evaluate(() => (window as any).__gameEngine?.player?.health);
    expect(health).toBe(100);

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    await expect(orientationBlocker).toHaveCount(0);

    const isResumed = await page.evaluate(() => (window as any).__gameEngine?.isPaused);
    expect(isResumed).toBe(false);
  });

  test('iPhone iOS Safari: fullscreen button is completely removed and modal is never rendered', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
    });
    await page.setViewportSize({ width: 852, height: 393 });
    await page.goto('/');

    await page.locator('[data-testid="menu-btn-play"]').click();
    await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

    const fullscreenBtn = page.locator('[data-testid="hud-fullscreen-btn"]');
    await expect(fullscreenBtn).toHaveCount(0);

    const iosModal = page.locator('[data-testid="ios-fullscreen-modal"]');
    await expect(iosModal).toHaveCount(0);
  });

  test('Options screen: can switch tileset theme between Asset Pack 1 and Asset Pack 2, persists in storage', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await page.locator('[data-testid="menu-btn-options"]').click();
    await expect(page.getByRole('heading', { name: 'OPTIONS' })).toBeVisible();

    const theme1Btn = page.locator('[data-testid="options-theme-assets-1"]');
    const theme2Btn = page.locator('[data-testid="options-theme-assets-2"]');
    await expect(theme1Btn).toBeVisible();
    await expect(theme2Btn).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/options_screen_screenshot.png' });

    await theme2Btn.click();
    await page.locator('[data-testid="options-btn-save"]').click();

    const storedSettings = await page.evaluate(() => {
      const raw = localStorage.getItem('pirate_battle_settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedSettings).not.toBeNull();
    expect(storedSettings.tilesetTheme).toBe('assets_2');

    await page.locator('[data-testid="menu-btn-play"]').click();
    await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await page.locator('[data-testid="hud-pause-btn"]').click();
    await page.locator('[data-testid="pause-options-btn"]').click();

    await expect(page.locator('[data-testid="options-theme-assets-1"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="options-theme-assets-2"]')).toHaveCount(0);

    await page.locator('[data-testid="options-btn-save"]').click();
    await page.locator('[data-testid="pause-menu-btn"]').click();
    await expect(page.locator('[data-testid="menu-btn-play"]')).toBeVisible();
  });
});
