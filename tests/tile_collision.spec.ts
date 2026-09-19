import { test, expect } from '@playwright/test';

test.describe('TileMap Islands Collision Verification', () => {
  test('Player ship can navigate freely through central water channel and is blocked by island tiles', async ({ page }) => {
    await page.goto('/');

    const playBtn = page.locator('[data-testid="menu-btn-play"]');
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();

    await page.waitForSelector('text=Loading assets:', { state: 'detached', timeout: 15000 });
    await page.waitForTimeout(500);

    // Initial player state
    const initialPos = await page.evaluate(() => {
      const engine = (window as any).__gameEngine;
      const player = engine?.getPlayer();
      return player ? { x: player.x, y: player.y } : null;
    });

    // Verify player spawns in open water (spawnX ~100, spawnY ~410)
    expect(initialPos).not.toBeNull();
    expect(initialPos!.x).toBeGreaterThan(50);
    expect(initialPos!.y).toBeGreaterThan(350);

    // Test Island collision query directly in engine
    const collisionCheck = await page.evaluate(() => {
      const engine = (window as any).__gameEngine;
      const collisionSystem = engine?.getCollisionSystem?.() || engine?.collisionSystem;

      // Point in central water channel (x = 500, y = 280) should NOT collide
      const waterCollides = collisionSystem?.isPointCollidingWithIslands(500, 280, 20) ?? false;

      // Point on the Fortress Peninsula Island (x = 250, y = 100) MUST collide
      const fortressCollides = collisionSystem?.isPointCollidingWithIslands(250, 100, 20) ?? false;

      // Point on Southeast Island (x = 750, y = 480) MUST collide
      const southeastCollides = collisionSystem?.isPointCollidingWithIslands(750, 480, 20) ?? false;

      // Curved corner (Tile 54 at row 3, col 2 -> bounds [128..192, 192..256])
      // 1. In empty water at the bottom-left corner of the tile (x = 118, y = 248): MUST NOT collide!
      const cornerWaterCollides = collisionSystem?.isPointCollidingWithIslands(118, 248, 20) ?? true;

      // 2. Deep on the sand land of that tile (x = 160, y = 210): MUST collide!
      const cornerLandCollides = collisionSystem?.isPointCollidingWithIslands(160, 210, 20) ?? false;

      return { waterCollides, fortressCollides, southeastCollides, cornerWaterCollides, cornerLandCollides };
    });

    // In open water channel there should be zero collision
    expect(collisionCheck.waterCollides).toBe(false);

    // On constructed island tiles there must be collision
    expect(collisionCheck.fortressCollides).toBe(true);
    expect(collisionCheck.southeastCollides).toBe(true);

    // Curved corner empty water must be completely navigable
    expect(collisionCheck.cornerWaterCollides).toBe(false);
    expect(collisionCheck.cornerLandCollides).toBe(true);
  });
});

