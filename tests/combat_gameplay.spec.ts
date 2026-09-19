import { test, expect } from '@playwright/test';

test('Full naval combat: frontal fire, broadsides, enemy spawns, HUD, and pause', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();

  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  // Verify HUD elements are active
  const scoreLocator = page.locator('[data-testid="hud-score"]');
  const timerLocator = page.locator('[data-testid="hud-timer"]');
  await expect(scoreLocator).toBeVisible();
  await expect(timerLocator).toBeVisible();

  // 1. Fire Bow Cannon (Frontal - Space)
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);

  // 2. Fire Port Broadside (Left - KeyQ)
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(200);

  // 3. Fire Starboard Broadside (Right - KeyE)
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(300);

  // Take screenshot of cannon fire in the water
  await page.screenshot({ path: 'test-results/screenshots/combat_firing_screenshot.png' });

  // 4. Sail around to engage with spawning enemies
  await page.keyboard.down('KeyW');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyD');
  await page.keyboard.up('KeyW');

  // Allow enemies to spawn (spawn timer runs every few seconds)
  await page.waitForTimeout(3000);

  // Fire another broadside salvo
  await page.keyboard.press('Space');
  await page.keyboard.press('KeyQ');
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(500);

  // Take screenshot of active naval battle
  await page.screenshot({ path: 'test-results/screenshots/naval_battle_screenshot.png' });

  // 5. Test Pause Menu
  const pauseButton = page.locator('[data-testid="hud-pause-btn"]');
  await pauseButton.click();

  await expect(page.locator('#pause-dialog-title')).toBeVisible();
  await page.screenshot({ path: 'test-results/screenshots/game_pause_screenshot.png' });

  // Resume game
  const resumeButton = page.locator('[data-testid="pause-resume-btn"]');
  await resumeButton.click();
  await expect(page.locator('#pause-dialog-title')).not.toBeVisible();
});

test('Enemy shooter never enters reverse gear when close to player', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const speeds = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;
    const player = engine.getPlayer();

    // Spawn an EnemyShooter very close to the player (distance = 80px, well below preferredDistance 220)
    const shooter = engine.spawnEnemyForTesting('shooter', player.x + 80, player.y);

    const recordedSpeeds: number[] = [];
    for (let i = 0; i < 20; i++) {
      shooter.updateAI(player, 0.05, () => {});
      recordedSpeeds.push(shooter.currentSpeed);
    }

    return recordedSpeeds;
  });

  expect(speeds).not.toBeNull();
  expect(speeds!.length).toBeGreaterThan(0);
  for (const speed of speeds!) {
    expect(speed).toBeGreaterThanOrEqual(0);
  }
});

