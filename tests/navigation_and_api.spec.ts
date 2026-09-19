import { test, expect } from '@playwright/test';

test('Main Menu, Options, Ranking, and Match History flow with MSW and UI Sprites', async ({ page }) => {
  await page.goto('/');

  // 1. Verify Main Menu loaded with official assets
  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  const optionsBtn = page.locator('[data-testid="menu-btn-options"]');
  const rankingBtn = page.locator('[data-testid="menu-btn-ranking"]');
  const historyBtn = page.locator('[data-testid="menu-btn-history"]');

  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await expect(optionsBtn).toBeVisible();
  await expect(rankingBtn).toBeVisible();
  await expect(historyBtn).toBeVisible();

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/screenshots/main_menu_screenshot.png' });

  // 2. Test Options Screen Navigation and Customization
  await optionsBtn.click();
  await expect(page.getByRole('heading', { name: 'OPTIONS' })).toBeVisible();

  // Advance duration to 120s
  const durationPlus = page.locator('[data-testid="options-btn-duration-plus"]');
  await durationPlus.click();

  // Save settings
  const saveBtn = page.locator('[data-testid="options-btn-save"]');
  await saveBtn.click();

  // Should return to Main Menu
  await expect(playBtn).toBeVisible();

  // 3. Test Captain's Log (Ranking Tab) powered by MSW
  await rankingBtn.click();
  await expect(page.locator("text=CAPTAIN'S LOG")).toBeVisible();
  await expect(page.locator('[data-testid="tab-btn-ranking"]')).toBeVisible();
  await expect(page.locator('[data-testid="tab-btn-history"]')).toBeVisible();
  await expect(page.getByText('120 SECOND BATTLES')).toBeVisible();

  // Verify Page 1 entries matching mockup
  await expect(page.locator('text=Captain Flint')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=Red Sparrow')).toBeVisible();
  await expect(page.locator('text=Captain Jack')).toBeVisible();
  await expect(page.locator('text=YOU')).toBeVisible();
  await expect(page.locator('text=PAGE 1 OF 3')).toBeVisible();

  // Test Pagination Controls
  const prevBtn = page.locator('[data-testid="log-btn-prev"]');
  const nextBtn = page.locator('[data-testid="log-btn-next"]');
  await expect(prevBtn).toBeDisabled();

  await nextBtn.click();
  await expect(page.locator('text=PAGE 2 OF 3')).toBeVisible();
  await expect(page.locator('text=Edward Teach (Blackbeard)')).toBeVisible();
  await expect(prevBtn).toBeEnabled();

  await prevBtn.click();
  await expect(page.locator('text=PAGE 1 OF 3')).toBeVisible();
  await expect(page.locator('text=Captain Flint')).toBeVisible();

  // Save screenshot of Captain's Log (Ranking)
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/screenshots/ranking_screenshot.png' });
  await page.screenshot({ path: 'C:/Users/thelu/.gemini/antigravity/brain/945bcbeb-1bdc-41ab-b9ce-93f949136a20/captains_log_ranking.png' });

  // 4. Test Tab Switching to Match History
  const tabHistory = page.locator('[data-testid="tab-btn-history"]');
  await tabHistory.click();
  await expect(page.locator('text=OUTCOME')).toBeVisible();
  await expect(page.locator('text=VICTORY').first()).toBeVisible();

  // Save screenshot of Captain's Log (Match History)
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/screenshots/history_screenshot.png' });
  await page.screenshot({ path: 'C:/Users/thelu/.gemini/antigravity/brain/945bcbeb-1bdc-41ab-b9ce-93f949136a20/captains_log_history.png' });

  // 5. Return to Menu via MAIN MENU button
  const menuBtn = page.locator('[data-testid="log-btn-menu"]');
  await menuBtn.click();
  await expect(playBtn).toBeVisible();

  // 6. Direct navigation to Match History from Main Menu
  await historyBtn.click();
  await expect(page.locator("text=CAPTAIN'S LOG")).toBeVisible();
  await expect(page.locator('text=OUTCOME')).toBeVisible();

  const menuBtn2 = page.locator('[data-testid="log-btn-menu"]');
  await menuBtn2.click();
  await expect(playBtn).toBeVisible();
});

test('Captain\'s Log panel preserves design dimensions and all content fits inside panel', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 576 });
  await page.goto('/');

  const rankingBtn = page.locator('[data-testid="menu-btn-ranking"]');
  await expect(rankingBtn).toBeVisible({ timeout: 10000 });
  await rankingBtn.click();

  const panel = page.locator('div[style*="panel_menu.png"]');
  await expect(panel).toBeVisible();

  const panelBox = await panel.boundingBox();
  const menuBtn = page.locator('[data-testid="log-btn-menu"]');
  const menuBtnBox = await menuBtn.boundingBox();

  expect(panelBox).not.toBeNull();
  expect(menuBtnBox).not.toBeNull();

  const metrics = await page.evaluate(() => {
    const panel = document.querySelector('div[style*="panel_menu.png"]') as HTMLElement;
    const title = document.querySelector('h1') as HTMLElement;
    const tabs = document.querySelector('[data-testid="tab-btn-ranking"]')?.parentElement as HTMLElement;
    const table = document.querySelector('[data-testid="log-btn-prev"]')?.parentElement?.previousElementSibling as HTMLElement;
    const pagination = document.querySelector('[data-testid="log-btn-prev"]')?.parentElement as HTMLElement;
    const menuBtn = document.querySelector('[data-testid="log-btn-menu"]') as HTMLElement;

    return {
      panel: panel.getBoundingClientRect(),
      title: title.getBoundingClientRect(),
      tabs: tabs?.getBoundingClientRect(),
      table: table?.getBoundingClientRect(),
      pagination: pagination?.getBoundingClientRect(),
      menuBtn: menuBtn.getBoundingClientRect(),
    };
  });
  console.log('LAYOUT METRICS:', JSON.stringify(metrics, null, 2));

  expect(panelBox!.width).toBeGreaterThanOrEqual(800);
  expect(panelBox!.width).toBeLessThanOrEqual(840);
  expect(menuBtnBox!.y + menuBtnBox!.height).toBeLessThan(panelBox!.y + panelBox!.height - 8);

  await page.screenshot({ path: 'C:/Users/thelu/.gemini/antigravity/brain/945bcbeb-1bdc-41ab-b9ce-93f949136a20/captains_log_ranking.png' });

  // Test pagination
  const nextBtn = page.locator('[data-testid="log-btn-next"]');
  await nextBtn.click();
  await expect(page.getByText('PAGE 2 OF 3')).toBeVisible();

  // Test tab toggle to MATCH HISTORY
  const historyTab = page.locator('[data-testid="tab-btn-history"]');
  await historyTab.click();
  await expect(page.getByText('SHIPS SUNK')).toBeVisible();
  await page.screenshot({ path: 'C:/Users/thelu/.gemini/antigravity/brain/945bcbeb-1bdc-41ab-b9ce-93f949136a20/captains_log_history.png' });

  // Return to main menu
  await menuBtn.click();
  await expect(page.locator('[data-testid="menu-btn-play"]')).toBeVisible();
});

test('MSW Network Scenarios Drawer toggles empty, error, and reset states cleanly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="menu-btn-play"]')).toBeVisible({ timeout: 10000 });

  const drawerToggle = page.locator('[data-testid="network-drawer-toggle"]');
  await expect(drawerToggle).toBeVisible({ timeout: 10000 });

  const box = await drawerToggle.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(50);
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  const centerX = box!.x + box!.width / 2;
  expect(Math.abs(centerX - viewportWidth / 2)).toBeLessThan(10);

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(drawerToggle).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(drawerToggle).toBeVisible();

  await drawerToggle.click();

  const drawerPanel = page.locator('[data-testid="network-drawer-panel"]');
  await expect(drawerPanel).toBeVisible();

  const emptyBtn = page.locator('[data-testid="scenario-btn-EMPTY"]');
  await emptyBtn.click();

  const closeBtn = page.locator('[data-testid="network-drawer-close"]');
  await closeBtn.click();

  const rankingBtn = page.locator('[data-testid="menu-btn-ranking"]');
  await rankingBtn.click();
  await expect(page.locator('text=No voyages logged yet.')).toBeVisible({ timeout: 10000 });

  const historyTab = page.locator('[data-testid="tab-btn-history"]');
  await historyTab.click();
  await expect(page.locator('text=No battles fought yet.')).toBeVisible({ timeout: 10000 });

  // 2. Open drawer and activate ERROR_500 scenario
  await drawerToggle.click();
  const errBtn = page.locator('[data-testid="scenario-btn-ERROR_500"]');
  await errBtn.click();
  await closeBtn.click();

  // Switch tabs to trigger fetch under ERROR_500
  const tabRanking = page.locator('[data-testid="tab-btn-ranking"]');
  await tabRanking.click();
  await expect(page.locator('text=Failed to retrieve rankings.')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="btn-retry-ranking"]')).toBeVisible();

  // 3. Reset seed data & scenarios
  await drawerToggle.click();
  const resetBtn = page.locator('[data-testid="network-btn-reset"]');
  await resetBtn.click();
  await closeBtn.click();

  // Leaderboard recovers automatically upon invalidation
  await expect(page.locator('text=Captain Flint')).toBeVisible({ timeout: 10000 });

  // Return to menu
  await page.locator('[data-testid="log-btn-menu"]').click();
});

test('Idempotency prevents duplicate match records on repeated submissions', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="menu-btn-play"]')).toBeVisible({ timeout: 10000 });

  // Evaluate double submission with identical matchId
  const result = await page.evaluate(async () => {
    const payload = {
      matchId: 'idempotent_test_match_999',
      playerId: 'test_player',
      captainName: 'Idempotent Tester',
      result: 'VICTORY' as const,
      score: 42,
      durationSeconds: 120,
      shipsDestroyed: 10,
      shotsFired: 30,
      shotsHit: 25,
      accuracyPercent: 83,
    };

    const firstRes = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const firstJson = await firstRes.json();

    const secondRes = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const secondJson = await secondRes.json();

    const listRes = await fetch('/api/matches?page=1&pageSize=50');
    const listJson = await listRes.json();
    const count = listJson.data.items.filter((m: any) => m.matchId === 'idempotent_test_match_999').length;

    return {
      firstStatus: firstRes.status,
      secondStatus: secondRes.status,
      secondMessage: secondJson.message,
      occurrencesInList: count,
    };
  });

  expect(result.firstStatus).toBe(201);
  expect(result.secondStatus).toBe(200);
  expect(result.secondMessage).toContain('idempotent');
  expect(result.occurrencesInList).toBe(1);
});

test('Pending offline records persist after browser refresh and show sync control', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="menu-btn-play"]')).toBeVisible({ timeout: 10000 });

  // Inject an offline match directly into localStorage
  await page.evaluate(() => {
    const pendingMatch = {
      id: 'offline_persisted_test_1',
      matchId: 'offline_persisted_test_1',
      playerId: 'player_local',
      captainName: 'Offline Sailor',
      date: 'Today',
      result: 'VICTORY',
      score: 15,
      durationSeconds: 90,
      shipsDestroyed: 5,
      shotsFired: 20,
      shotsHit: 15,
      accuracyPercent: 75,
      synced: false,
      recordedAt: new Date().toISOString(),
    };
    localStorage.setItem('pirate_offline_matches', JSON.stringify([pendingMatch]));
  });

  // Reload page to test persistence across refresh
  await page.reload();
  await expect(page.locator('[data-testid="menu-btn-play"]')).toBeVisible({ timeout: 10000 });

  // Navigate to Match History
  const historyBtn = page.locator('[data-testid="menu-btn-history"]');
  await expect(historyBtn).toBeVisible({ timeout: 10000 });
  await historyBtn.click();

  // Verify pending sync button and badge
  await expect(page.locator('[data-testid="btn-sync-offline"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=PENDING').first()).toBeVisible({ timeout: 10000 });

  // Click sync
  await page.locator('[data-testid="btn-sync-offline"]').click();

  // After sync, pending button should disappear
  await expect(page.locator('[data-testid="btn-sync-offline"]')).not.toBeVisible({ timeout: 10000 });
});
