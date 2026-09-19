import { test, expect } from '@playwright/test';

test.describe('Accessibility & Resilience Suite', () => {
  test('Keyboard navigation: Tab cycles menu buttons, dialog traps focus, and Escape closes dialogs', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const playBtn = page.getByTestId('menu-btn-play');
    await expect(playBtn).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('data-testid'));
    expect(firstFocused).toBe('menu-btn-play');

    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('data-testid'));
    expect(secondFocused).toBe('menu-btn-options');

    await page.keyboard.press('Enter');
    const optionsTitle = page.locator('h2:has-text("OPTIONS")');
    await expect(optionsTitle).toBeVisible();

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const backBtn = page.getByTestId('options-btn-save');
    await backBtn.click();
    await expect(playBtn).toBeVisible();

    await playBtn.click();
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    await expect(canvas).toHaveAttribute('role', 'application');
    await expect(canvas).toHaveAttribute('tabindex', '0');

    await page.waitForTimeout(500);

    const pauseBtn = page.getByTestId('hud-pause-btn');
    await pauseBtn.click();

    const pauseDialog = page.locator('div[role="dialog"][aria-labelledby="pause-dialog-title"]');
    await expect(pauseDialog).toBeVisible();
    await expect(pauseDialog).toHaveAttribute('aria-modal', 'true');

    const resumeBtn = page.getByTestId('pause-resume-btn');
    const initialFocusedInModal = await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('data-testid'));
    expect(initialFocusedInModal).toBe('pause-resume-btn');

    await page.keyboard.press('Tab');
    const optionsBtnInModal = await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('data-testid'));
    expect(optionsBtnInModal).toBe('pause-options-btn');

    await page.keyboard.press('Tab');
    const menuBtnInModal = await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('data-testid'));
    expect(menuBtnInModal).toBe('pause-menu-btn');

    await page.keyboard.press('Tab');
    const wrappedFocus = await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('data-testid'));
    expect(wrappedFocus).toBe('pause-resume-btn');

    await page.keyboard.press('Escape');
    await expect(pauseDialog).not.toBeVisible();

    const drawerToggle = page.getByTestId('network-drawer-toggle');
    await drawerToggle.click();

    const drawerPanel = page.locator('div[role="dialog"][aria-labelledby="network-drawer-title"]');
    await expect(drawerPanel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(drawerPanel).not.toBeVisible();
  });

  test('Semantic match info & live regions announce gameplay events', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const playBtn = page.getByTestId('menu-btn-play');
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();

    const liveAnnouncer = page.getByTestId('combat-live-announcer');
    await expect(liveAnnouncer).toBeAttached();
    await expect(liveAnnouncer).toHaveAttribute('role', 'status');
    await expect(liveAnnouncer).toHaveAttribute('aria-live', 'polite');

    const pauseBtn = page.getByTestId('hud-pause-btn');
    await pauseBtn.click();
    await expect(liveAnnouncer).toContainText('Voyage paused.');

    const resumeBtn = page.getByTestId('pause-resume-btn');
    await resumeBtn.click();
    await expect(liveAnnouncer).toContainText('Voyage resumed.');

    await page.evaluate(() => {
      const engine = (window as any).__gameEngine;
      if (engine) {
        engine.events.emit('scoreChanged', 1);
      }
    });
    await expect(liveAnnouncer).toContainText('Enemy ship sunk! Current score: 1');

    await page.evaluate(() => {
      const engine = (window as any).__gameEngine;
      if (engine) {
        engine.events.emit('healthChanged', 25);
      }
    });
    await expect(liveAnnouncer).toContainText('Warning: Hull integrity critical at 25 percent!');
  });

  test('Match abandon: Returning to menu mid-game discards match and does NOT submit to API', async ({ page }) => {
    let postMatchCalls = 0;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/matches') && !req.url().includes('sync-offline')) {
        postMatchCalls++;
      }
    });

    await page.goto('http://localhost:3000/');
    const playBtn = page.getByTestId('menu-btn-play');
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();

    const pauseBtn = page.getByTestId('hud-pause-btn');
    await expect(pauseBtn).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);

    await pauseBtn.click();
    const returnMenuBtn = page.getByTestId('pause-menu-btn');
    await expect(returnMenuBtn).toBeVisible();
    await returnMenuBtn.click();

    await expect(playBtn).toBeVisible();
    await page.waitForTimeout(1000);

    expect(postMatchCalls).toBe(0);
  });

  test('Asset fallback resilience: Engine loads and falls back safely if a sprite asset fails', async ({ page }) => {
    await page.route('**/assets/png/default/ships/ship_3.png', (route) => {
      route.abort('failed');
    });

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('http://localhost:3000/');
    const playBtn = page.getByTestId('menu-btn-play');
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    await page.waitForFunction(() => (window as any).__gameEngine?.isInitialized === true, {
      timeout: 15000,
    });

    const engineReady = await page.evaluate(() => {
      const engine = (window as any).__gameEngine;
      return Boolean(engine && engine.isInitialized);
    });
    expect(engineReady).toBe(true);

    const fatalErrors = pageErrors.filter((e) => !e.includes('net::ERR_FAILED'));
    expect(fatalErrors.length).toBe(0);
  });

  test('Audio lifecycle: Ocean ambience only plays during active voyage and stops immediately upon returning to menu', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    const playBtn = page.getByTestId('menu-btn-play');
    await expect(playBtn).toBeVisible({ timeout: 10000 });

    const initialAmbienceActive = await page.evaluate(() => {
      const sm = (window as any).__soundManager;
      return sm ? sm.isOceanAmbienceActive() : null;
    });
    expect(initialAmbienceActive).toBe(false);

    await playBtn.click();
    await page.waitForFunction(() => (window as any).__gameEngine?.isInitialized === true, {
      timeout: 15000,
    });

    const inGameAmbienceActive = await page.evaluate(() => {
      const sm = (window as any).__soundManager;
      return sm ? sm.isOceanAmbienceActive() : null;
    });
    expect(inGameAmbienceActive).toBe(true);

    const pauseBtn = page.getByTestId('hud-pause-btn');
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    const returnMenuBtn = page.getByTestId('pause-menu-btn');
    await expect(returnMenuBtn).toBeVisible();
    await returnMenuBtn.click();

    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    const postReturnAmbience = await page.evaluate(() => {
      const sm = (window as any).__soundManager;
      return {
        active: sm ? sm.isOceanAmbienceActive() : null,
        playing: sm ? sm.isOceanAmbiencePlaying() : null,
      };
    });
    expect(postReturnAmbience.active).toBe(false);
    expect(postReturnAmbience.playing).toBe(false);

    const optionsBtn = page.getByTestId('menu-btn-options');
    await expect(optionsBtn).toBeVisible();
    await optionsBtn.click();

    const volumePlusBtn = page.getByTestId('options-btn-volume-plus');
    await expect(volumePlusBtn).toBeVisible();
    await volumePlusBtn.click();

    const saveReturnBtn = page.getByTestId('options-btn-save');
    await expect(saveReturnBtn).toBeVisible();
    await saveReturnBtn.click();

    await expect(playBtn).toBeVisible({ timeout: 10000 });

    const postOptionsAmbienceActive = await page.evaluate(() => {
      const sm = (window as any).__soundManager;
      return sm ? sm.isOceanAmbienceActive() : null;
    });
    expect(postOptionsAmbienceActive).toBe(false);
  });
});
