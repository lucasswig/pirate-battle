import { test, expect } from '@playwright/test';

test('Enemy ship destruction choreography: wreck conversion, immediate collision removal, debris, and castaways', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const result = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const player = engine.getPlayer();
    const shooter = engine.spawnEnemyForTesting('shooter', 400, 200);

    const initialEnemyCount = engine.getEnemies().length;
    const initialWreckCount = engine.getWrecks().length;

    shooter.takeDamage(30);
    const hasDamagedTexture = (shooter as any).isDamagedTexture;

    shooter.takeDamage(30);

    const enemyIndex = engine.getEnemies().indexOf(shooter);
    if (enemyIndex !== -1) {
      (engine as any).handleEnemyDestruction(shooter, enemyIndex);
    }

    const enemiesAfterDeath = engine.getEnemies();
    const wrecksAfterDeath = engine.getWrecks();
    const isEnemyInActiveList = enemiesAfterDeath.includes(shooter);
    const isEnemyInWrecks = wrecksAfterDeath.includes(shooter);

    const healthBarPresent = Boolean((shooter as any).healthBarGraphic);
    const wreckAlpha = (shooter as any).sprite.alpha;
    const isDead = shooter.isDead;

    const visual = engine.getVisualFeedback();
    const debrisCount = visual?.getWoodDebrisCount() ?? 0;
    const castawaysCount = visual?.getCastawaysCount() ?? 0;

    const playerInitialX = shooter.x;
    const playerInitialY = shooter.y;
    player.x = playerInitialX;
    player.y = playerInitialY;
    engine.getCollisionSystem()?.resolveShipVsShipCollisions(player, engine.getEnemies());
    const playerDidNotGetPushed = (player.x === playerInitialX && player.y === playerInitialY);

    return {
      initialEnemyCount,
      initialWreckCount,
      hasDamagedTexture,
      isEnemyInActiveList,
      isEnemyInWrecks,
      healthBarPresent,
      wreckAlpha,
      isDead,
      debrisCount,
      castawaysCount,
      playerDidNotGetPushed,
    };
  });

  expect(result).not.toBeNull();
  expect(result!.hasDamagedTexture).toBe(true);
  expect(result!.isEnemyInActiveList).toBe(false);
  expect(result!.isEnemyInWrecks).toBe(true);
  expect(result!.healthBarPresent).toBe(false);
  expect(result!.wreckAlpha).toBe(0.75);
  expect(result!.isDead).toBe(true);
  expect(result!.debrisCount).toBeGreaterThanOrEqual(3);
  expect(result!.castawaysCount).toBeGreaterThanOrEqual(1);
  expect(result!.playerDidNotGetPushed).toBe(true);
});

test('Damaged ship visuals: fire placed behind sail and active on surviving ships', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const damageVisuals = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const chaser = engine.spawnEnemyForTesting('chaser', 300, 300);

    const fireContainerIndex = chaser.container.children.indexOf((chaser as any).fireContainer);
    const shipSpriteIndex = chaser.container.children.indexOf((chaser as any).sprite);
    const fireBehindSail = fireContainerIndex < shipSpriteIndex;

    const initialFireLeft = (chaser as any).fireLeft?.visible ?? false;

    chaser.takeDamage(20);
    chaser.updateDamageVisuals();
    const midFireLeft = (chaser as any).fireLeft?.visible ?? false;
    const midFireRight = (chaser as any).fireRight?.visible ?? false;

    chaser.takeDamage(20);
    chaser.updateDamageVisuals();
    const severeFireLeft = (chaser as any).fireLeft?.visible ?? false;
    const severeFireRight = (chaser as any).fireRight?.visible ?? false;

    return {
      fireBehindSail,
      initialFireLeft,
      midFireLeft,
      midFireRight,
      severeFireLeft,
      severeFireRight,
    };
  });

  expect(damageVisuals).not.toBeNull();
  expect(damageVisuals!.fireBehindSail).toBe(true);
  expect(damageVisuals!.initialFireLeft).toBe(false);
  expect(damageVisuals!.midFireLeft).toBe(true);
  expect(damageVisuals!.severeFireLeft).toBe(true);
  expect(damageVisuals!.severeFireRight).toBe(true);
});

test('Castaways reach shore and stay on the coast without disappearing', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const shorePersistence = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const visual = engine.getVisualFeedback();
    const shorePoint = { x: 200, y: 150 };

    const initialCount = (visual as any).castaways.length;
    visual.spawnCastaways(205, 155, shorePoint, 1);
    const castaways = (visual as any).castaways;
    const swimmer = castaways[castaways.length - 1];

    visual.update(2.0);

    const reachedShore = swimmer.reachedShore;
    const alphaOnShore = swimmer.container.alpha;
    const hasActiveRipple = swimmer.rippleGraphic.geometry?.graphicsData?.length > 0;

    visual.update(5.0);
    const stillPresentAfterTime = castaways.includes(swimmer);
    const alphaAfterTime = swimmer.container.alpha;

    return {
      reachedShore,
      alphaOnShore,
      hasActiveRipple,
      stillPresentAfterTime,
      alphaAfterTime,
      swimmerX: swimmer.x,
      swimmerY: swimmer.y,
      targetX: swimmer.targetX,
      targetY: swimmer.targetY,
      dist: Math.hypot(swimmer.targetX - swimmer.x, swimmer.targetY - swimmer.y),
    };
  });

  expect(shorePersistence).not.toBeNull();
  expect(shorePersistence!.reachedShore).toBe(true);
  expect(shorePersistence!.alphaOnShore).toBe(1.0);
  expect(shorePersistence!.hasActiveRipple).toBe(false);
  expect(shorePersistence!.stillPresentAfterTime).toBe(true);
  expect(shorePersistence!.alphaAfterTime).toBe(1.0);
});

test('Wrecks render below living ships and are completely cleared on Play Again (restart)', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const layerAndRestartResult = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const gameStage = (engine as any).gameStage;
    const wreckLayer = (engine as any).wreckLayer;
    const shipLayer = (engine as any).shipLayer;

    const wreckLayerIndex = gameStage.children.indexOf(wreckLayer);
    const shipLayerIndex = gameStage.children.indexOf(shipLayer);
    const isWreckBelowLivingShips = wreckLayerIndex < shipLayerIndex;

    const enemy = engine.spawnEnemyForTesting('shooter', 400, 200);
    enemy.takeDamage(60);
    const enemyIndex = engine.getEnemies().indexOf(enemy);
    (engine as any).handleEnemyDestruction(enemy, enemyIndex);

    const wreckInWreckLayer = wreckLayer.children.includes(enemy.container);
    const wrecksCountBeforeRestart = engine.getWrecks().length;
    const wreckLayerChildrenBefore = wreckLayer.children.length;

    engine.restart();

    const wrecksCountAfterRestart = engine.getWrecks().length;
    const wreckLayerChildrenAfter = wreckLayer.children.length;
    const enemiesAfterRestart = engine.getEnemies().length;

    return {
      isWreckBelowLivingShips,
      wreckInWreckLayer,
      wrecksCountBeforeRestart,
      wreckLayerChildrenBefore,
      wrecksCountAfterRestart,
      wreckLayerChildrenAfter,
      enemiesAfterRestart,
    };
  });

  expect(layerAndRestartResult).not.toBeNull();
  expect(layerAndRestartResult!.isWreckBelowLivingShips).toBe(true);
  expect(layerAndRestartResult!.wreckInWreckLayer).toBe(true);
  expect(layerAndRestartResult!.wrecksCountBeforeRestart).toBe(1);
  expect(layerAndRestartResult!.wreckLayerChildrenBefore).toBe(1);
  expect(layerAndRestartResult!.wrecksCountAfterRestart).toBe(0);
  expect(layerAndRestartResult!.wreckLayerChildrenAfter).toBe(0);
  expect(layerAndRestartResult!.enemiesAfterRestart).toBe(0);
});

test('Ship destruction spawns a mix of swimmers and characters in dinghies/canoes', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const dinghyMix = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const visual = engine.getVisualFeedback();
    const shore = { x: 300, y: 150 };

    visual.spawnShipDestruction(320, 260, shore);
    const castaways = (visual as any).castaways;

    const withDinghy = castaways.filter((c: any) => c.hasDinghy);
    const withoutDinghy = castaways.filter((c: any) => !c.hasDinghy);

    return {
      totalCastaways: castaways.length,
      dinghyCount: withDinghy.length,
      swimmerCount: withoutDinghy.length,
      hasDinghySprite: Boolean(withDinghy[0]?.dinghySprite),
    };
  });

  expect(dinghyMix).not.toBeNull();
  expect(dinghyMix!.totalCastaways).toBeGreaterThanOrEqual(2);
  expect(dinghyMix!.dinghyCount).toBe(1);
  expect(dinghyMix!.swimmerCount).toBeGreaterThanOrEqual(1);
  expect(dinghyMix!.hasDinghySprite).toBe(true);
});

test('Capture visual screenshot of destruction choreography: wreck, fire, debris, and castaways with ripples', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return;

    const player = engine.getPlayer();
    if (player) {
      player.x = 420;
      player.y = 260;
      player.container.position.set(420, 260);
    }

    const shooter = engine.spawnEnemyForTesting('shooter', 410, 270);
    const chaser = engine.spawnEnemyForTesting('chaser', 530, 280);

    chaser.takeDamage(25);
    chaser.updateDamageVisuals();

    shooter.takeDamage(60);
    const shooterIndex = engine.getEnemies().indexOf(shooter);
    if (shooterIndex !== -1) {
      (engine as any).handleEnemyDestruction(shooter, shooterIndex);
    }

    const shore1 = (engine as any).tileMap?.getNearestShorePoint(400, 320) ?? { x: 400, y: 350 };
    engine.getVisualFeedback()?.spawnShipDestruction(460, 310, shore1);

    // Also spawn a dinghy heading to the bottom cape corner and top island corner (matching user's arrows)
    const capeShore = (engine as any).tileMap?.getNearestShorePoint(280, 360);
    if (capeShore) {
      engine.getVisualFeedback()?.spawnCastaways(280, 370, capeShore, 1, true);
    }
    const topShore = (engine as any).tileMap?.getNearestShorePoint(120, 270);
    if (topShore) {
      engine.getVisualFeedback()?.spawnCastaways(120, 265, topShore, 1, true);
    }

    // Advance 3 seconds so the cape and top dinghies reach the sand border
    engine.getVisualFeedback()?.update(3.0);
  });

  await page.waitForTimeout(300);

  await page.screenshot({
    path: 'C:/Users/thelu/.gemini/antigravity/brain/945bcbeb-1bdc-41ab-b9ce-93f949136a20/destruction_choreography.png',
  });
});

test('Nearest shore point projects accurately onto authentic sand coastline', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const testPoints = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const tileMap = engine.tileMap;
    if (!tileMap) return null;

    const p1 = tileMap.getNearestShorePoint(210, 330);
    const p2 = tileMap.getNearestShorePoint(100, 280);
    const p3 = tileMap.getNearestShorePoint(450, 310);
    const p4 = tileMap.getNearestShorePoint(750, 250);
    const p5 = tileMap.getNearestShorePoint(280, 350);

    return { p1, p2, p3, p4, p5 };
  });

  console.log('testPoints:', testPoints);
  expect(testPoints).not.toBeNull();
  expect(testPoints!.p2.y).toBeLessThanOrEqual(255);
  expect(testPoints!.p2.x).toBeGreaterThanOrEqual(130);
  expect(testPoints!.p3.y).toBeGreaterThanOrEqual(384);
  expect(testPoints!.p4.y).toBeGreaterThanOrEqual(318);
  expect(testPoints!.p5.y).toBeGreaterThanOrEqual(385);
  expect(testPoints!.p5.x).toBeGreaterThanOrEqual(270);
});

test('Ship bow wave pushes characters to the sides without dealing damage', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const result = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const player = engine.getPlayer();
    if (!player) return null;

    player.x = 350;
    player.y = 320;
    player.rotation = 0;
    player.currentSpeed = 160;
    player.container.position.set(350, 320);

    const initialHealth = player.health;

    const visual = engine.getVisualFeedback();
    if (!visual) return null;

    visual.spawnCastaways(350, 300, { x: 350, y: 220 }, 1, true);
    visual.spawnCastaways(350, 300, { x: 350, y: 220 }, 1, false);

    const castaways = (visual as any).castaways;
    const dinghy = castaways[castaways.length - 2];
    const swimmer = castaways[castaways.length - 1];

    // Set precise left and right positions relative to player center at (350, 320)
    dinghy.x = 362;
    dinghy.y = 300;
    swimmer.x = 338;
    swimmer.y = 300;

    const initialDinghyX = dinghy.x;
    const initialSwimmerX = swimmer.x;

    for (let frame = 0; frame < 15; frame++) {
      engine.update(0.016);
    }

    const finalDinghyX = dinghy.x;
    const finalSwimmerX = swimmer.x;
    const finalHealth = player.health;

    return {
      initialDinghyX,
      finalDinghyX,
      initialSwimmerX,
      finalSwimmerX,
      initialHealth,
      finalHealth,
      dinghyPushedRight: finalDinghyX > initialDinghyX,
      swimmerPushedLeft: finalSwimmerX < initialSwimmerX,
      dinghyDiff: finalDinghyX - initialDinghyX,
      swimmerDiff: finalSwimmerX - initialSwimmerX,
      dinghyStillAlive: castaways.includes(dinghy),
      swimmerStillAlive: castaways.includes(swimmer),
    };
  });

  console.log('Wake push result:', result);

  expect(result).not.toBeNull();
  expect(result!.finalHealth).toBe(result!.initialHealth);
  expect(result!.dinghyPushedRight).toBe(true);
  expect(result!.swimmerPushedLeft).toBe(true);
  expect(result!.dinghyDiff).toBeGreaterThan(5);
  expect(result!.swimmerDiff).toBeLessThan(-5);
  expect(result!.dinghyStillAlive).toBe(true);
  expect(result!.swimmerStillAlive).toBe(true);

  await page.screenshot({
    path: 'C:/Users/thelu/.gemini/antigravity/brain/945bcbeb-1bdc-41ab-b9ce-93f949136a20/bow_wave_push.png',
  });
});

test('Castaways that reached the shore remain static and are not pushed into the island', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const result = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const player = engine.getPlayer();
    if (!player) return null;

    const visual = engine.getVisualFeedback();
    if (!visual) return null;

    const shore = { x: 300, y: 390 };
    visual.spawnCastaways(shore.x, shore.y, shore, 1, true);

    const castaways = (visual as any).castaways;
    const beached = castaways[castaways.length - 1];
    beached.reachedShore = true;
    beached.x = shore.x;
    beached.y = shore.y;

    player.x = shore.x;
    player.y = shore.y + 20;
    player.rotation = 0;
    player.currentSpeed = 100;

    const initialX = beached.x;
    const initialY = beached.y;

    for (let frame = 0; frame < 15; frame++) {
      engine.update(0.016);
    }

    const wasDisplaced = beached.x !== initialX || beached.y !== initialY;

    return {
      finalX: beached.x,
      finalY: beached.y,
      wasDisplaced,
      isStillAlive: castaways.includes(beached),
    };
  });

  expect(result).not.toBeNull();
  expect(result!.wasDisplaced).toBe(false);
  expect(result!.isStillAlive).toBe(true);
});

test('Swimming castaways in water are strictly clamped out of solid island interior even under high wave push', async ({ page }) => {
  await page.goto('/');

  const playBtn = page.locator('[data-testid="menu-btn-play"]');
  await expect(playBtn).toBeVisible({ timeout: 10000 });
  await playBtn.click();
  await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });

  const result = await page.evaluate(() => {
    const engine = (window as any).__gameEngine;
    if (!engine) return null;

    const player = engine.getPlayer();
    if (!player) return null;

    const visual = engine.getVisualFeedback();
    if (!visual) return null;

    const beachPoint = { x: 350, y: 388 };
    visual.spawnCastaways(beachPoint.x, 370, beachPoint, 1, false);

    const castaways = (visual as any).castaways;
    const swimmer = castaways[castaways.length - 1];
    swimmer.reachedShore = false;
    swimmer.x = 350;
    swimmer.y = 370;

    player.x = 350;
    player.y = 350;
    player.rotation = Math.PI;
    player.currentSpeed = 220;

    let maxPenetrationY = 0;
    for (let frame = 0; frame < 25; frame++) {
      engine.update(0.016);
      if (swimmer.y > maxPenetrationY) {
        maxPenetrationY = swimmer.y;
      }
    }

    return {
      finalX: swimmer.x,
      finalY: swimmer.y,
      maxPenetrationY,
      stayedOutsideIslandInterior: maxPenetrationY <= 396,
      slidLaterally: Math.abs(swimmer.x - 350) > 5,
    };
  });

  expect(result).not.toBeNull();
  expect(result!.stayedOutsideIslandInterior).toBe(true);
  expect(result!.slidLaterally).toBe(true);
});

