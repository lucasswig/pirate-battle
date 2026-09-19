import { test, expect } from '@playwright/test';

test('Capture game screenshot for visual comparison', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="menu-btn-play"]').click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/screenshots/combat-visual-assets1.png' });

  await page.goto('/');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.locator('[data-testid="menu-btn-options"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/options-desktop-visual.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/screenshots/options-mobile-visual.png' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.locator('[data-testid="options-theme-assets-2"]').click();
  await page.locator('[data-testid="options-btn-save"]').click();
  await page.waitForTimeout(400);

  await page.locator('[data-testid="menu-btn-ranking"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/captains_log_ranking_visual.png' });
  await page.screenshot({ path: 'test-results/screenshots/pagination-visual.png' });

  await page.locator('[data-testid="tab-btn-history"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/captains_log_history_visual.png' });

  await page.locator('[data-testid="log-btn-menu"]').click();
  await page.waitForTimeout(400);

  await page.locator('[data-testid="menu-btn-play"]').click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/screenshots/combat-visual-assets2.png' });

  await page.locator('[data-testid="hud-pause-btn"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/pause-menu-visual.png' });
  await page.setViewportSize({ width: 1024, height: 568 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/pause-menu-visual-1024.png' });

  await page.evaluate(() => {
    (window as any).__gameEngine.events.emit('matchEnded', {
      score: 24,
      durationPlayedSeconds: 89,
      reason: 'TIME_EXPIRED',
    });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/battle-complete-visual.png' });
});

test('Capture HUD and Controls screenshots across Desktop and Mobile viewports', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  await page.locator('[data-testid="menu-btn-play"]').click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/screenshots/desktop_hud_screenshot.png' });
  await page.locator('[data-testid="hud-score"]').screenshot({ path: 'test-results/screenshots/hud_score_element.png' });
  await page.locator('[data-testid="hud-timer"]').screenshot({ path: 'test-results/screenshots/hud_timer_element.png' });
  await page.locator('[data-testid="player-health-bar"]').screenshot({ path: 'test-results/screenshots/hud_health_bar_element.png' });
  await page.locator('[data-testid="desktop-controls-ribbon"]').screenshot({ path: 'test-results/screenshots/hud_desktop_controls_element.png' });

  const rects = await page.evaluate(() => {
    const scorePanel = document.querySelector('[data-testid="hud-score"]') as HTMLElement;
    const content = scorePanel.children[1] as HTMLElement;
    const iconContainer = content.children[0] as HTMLElement;
    const iconSprite = iconContainer.children[0] as HTMLElement;
    const textSpan = content.children[1] as HTMLElement;

    const get = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    };

    const hb = document.querySelector('[data-testid="player-health-bar"]') as HTMLElement;
    const heartSprite = hb.children[0].children[0] as HTMLElement;
    const frameContainer = hb.children[1] as HTMLElement;
    const greenSlot = frameContainer.children[1] as HTMLElement;
    const textContainer = frameContainer.children[2] as HTMLElement;

    return {
      panel: get(scorePanel),
      iconSprite: get(iconSprite),
      textSpan: get(textSpan),
      healthBar: {
        heart: get(heartSprite),
        frame: get(frameContainer),
        greenSlot: get(greenSlot),
        textContainer: get(textContainer),
      }
    };
  });
  console.log('DOM Rects:', JSON.stringify(rects, null, 2));

  // Simulate damage to 76 HP to visually verify health bar progression matching Image 2
  await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (engine) {
      engine.events.emit('healthChanged', 76);
    }
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/desktop_damaged_health_screenshot.png' });
  await page.locator('[data-testid="player-health-bar"]').screenshot({ path: 'test-results/screenshots/hud_health_bar_damaged_element.png' });

  // Mobile landscape
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(400);

  // Trigger pointerdown on Forward and Bow Gun to demonstrate active warm orange plate
  const forwardBtn = page.locator('[data-testid="ctrl-forward"]');
  await forwardBtn.dispatchEvent('pointerdown');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'test-results/screenshots/mobile_landscape_hud_screenshot.png' });
  await forwardBtn.dispatchEvent('pointerup');

  // Mobile portrait
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/mobile_portrait_hud_screenshot.png' });
});

test('Verify Jungle Gaming logo appears on all menu screens and disappears during gameplay', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 568 });
  await page.goto('/');
  await page.waitForTimeout(400);

  const logo = page.locator('[data-testid="jungle-gaming-logo"]');
  await expect(logo).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/menu_main_with_logo.png' });

  await page.locator('[data-testid="menu-btn-options"]').click();
  await page.waitForTimeout(400);
  await expect(logo).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/menu_options_with_logo.png' });

  await page.locator('[data-testid="options-btn-save"]').click();
  await page.waitForTimeout(300);

  await page.locator('[data-testid="menu-btn-ranking"]').click();
  await page.waitForTimeout(400);
  await expect(logo).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/menu_ranking_with_logo.png' });

  await page.locator('[data-testid="tab-btn-history"]').click();
  await page.waitForTimeout(300);
  await expect(logo).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/menu_history_with_logo.png' });

  await page.locator('[data-testid="log-btn-menu"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-testid="menu-btn-play"]').click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });
  await page.waitForTimeout(500);

  await expect(logo).not.toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/ingame_no_logo.png' });
});

test('Capture pause menu across mobile and desktop viewports', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.locator('[data-testid="menu-btn-play"]').click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });
  await page.waitForTimeout(600);

  await page.locator('[data-testid="hud-pause-btn"]').click();
  await page.waitForTimeout(400);
  await expect(page.locator('#pause-dialog-title')).toBeVisible();
  await expect(page.locator('[data-testid="jungle-gaming-logo"]')).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/desktop_pause_screenshot.png' });

  await page.setViewportSize({ width: 1024, height: 568 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/pause_menu_1024x568.png' });

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(400);
  await expect(page.locator('[data-testid="ctrl-bow-cannon"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="jungle-gaming-logo"]')).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/pause_mobile_landscape_844.png' });

  await page.locator('[data-testid="pause-options-btn"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/pause_options_mobile_landscape_844.png' });

  await page.locator('[data-testid="options-btn-save"]').click();
  await page.waitForTimeout(300);

  await page.setViewportSize({ width: 674, height: 311 });
  await page.waitForTimeout(300);
  const debugRect = await page.evaluate(() => {
    const el = document.querySelector('[role="dialog"]');
    return {
      rect: el ? el.getBoundingClientRect() : null,
      transform: el ? window.getComputedStyle(el).transform : null,
      innerH: window.innerHeight,
      innerW: window.innerWidth
    };
  });
  console.log('DEBUG RECT 674x311:', JSON.stringify(debugRect, null, 2));
  await page.screenshot({ path: 'test-results/screenshots/pause_mobile_674x311.png' });

  await page.locator('[data-testid="pause-resume-btn"]').click();
  await page.waitForTimeout(300);
  await expect(page.locator('#pause-dialog-title')).not.toBeVisible();
  await expect(page.locator('[data-testid="ctrl-bow-cannon"]')).toBeVisible();

  await page.evaluate(() => {
    (window as any).__gameEngine.events.emit('matchEnded', {
      score: 24,
      durationPlayedSeconds: 89,
      reason: 'TIME_EXPIRED',
    });
  });
  await page.waitForTimeout(400);
  await expect(page.locator('#result-dialog-title')).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/battle_complete_mobile_landscape_667.png' });

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/battle_complete_mobile_landscape_844.png' });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/screenshots/battle_complete_desktop_1280.png' });
});

test('Capture minimal loading screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.locator('[data-testid="menu-btn-play"]').click();
  const loading = page.locator('text=LOADING...');
  await expect(loading).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/loading_screen_minimal.png' });
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });
});
