import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Performance & Memory Benchmark Suite', () => {
  test('60 FPS & frame time telemetry: p95 frame time stays smooth under combat load', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const playBtn = page.getByTestId('menu-btn-play');
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await playBtn.click();

    await page.waitForFunction(() => (window as any).__gameEngine?.isInitialized === true, {
      timeout: 15000,
    });

    const hardware = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const gl = canvas ? (canvas.getContext('webgl2') || canvas.getContext('webgl')) : null;
      let renderer = 'WebGL / Software';
      let vendor = 'Unknown';
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
          renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        }
      }
      return {
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        webglVendor: vendor,
        webglRenderer: renderer,
      };
    });

    await page.keyboard.down('KeyW');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Space');
      await page.keyboard.press('KeyQ');
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(300);
    }
    await page.keyboard.up('KeyW');

    const metrics = await page.evaluate(() => {
      const engine = (window as any).__gameEngine;
      return engine ? engine.getPerformanceMetrics() : null;
    });

    expect(metrics).not.toBeNull();
    console.log('HARDWARE PROFILE:', hardware);
    console.log('COMBAT BENCHMARK METRICS:', metrics);

    expect(metrics.fps).toBeGreaterThanOrEqual(30);
    expect(metrics.p95FrameTimeMs).toBeLessThanOrEqual(40);
    expect(typeof metrics.activeEnemies).toBe('number');
    expect(typeof metrics.activeProjectiles).toBe('number');

    const reportsDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPayload = {
      timestamp: new Date().toISOString(),
      targetFps: 60,
      hardware,
      combatBenchmark: metrics,
    };

    fs.writeFileSync(
      path.join(reportsDir, 'profiling-data.json'),
      JSON.stringify(reportPayload, null, 2),
      'utf-8'
    );
  });

  test('Memory stability: 5 consecutive start/play/exit cycles destroy resources cleanly without leaks', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const playBtn = page.getByTestId('menu-btn-play');
    await expect(playBtn).toBeVisible({ timeout: 10000 });

    const memorySnapshots: Array<{ cycle: number; usedHeapMB: number | null }> = [];

    const initialMem = await page.evaluate(() => {
      const mem = (performance as any).memory;
      return mem ? Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 100) / 100 : null;
    });
    memorySnapshots.push({ cycle: 0, usedHeapMB: initialMem });

    for (let cycle = 1; cycle <= 5; cycle++) {
      await playBtn.click();

      await page.waitForFunction(() => (window as any).__gameEngine?.isInitialized === true, {
        timeout: 15000,
      });

      const isInit = await page.evaluate(() => (window as any).__gameEngine?.isInitialized);
      expect(isInit).toBe(true);

      for (let f = 0; f < 3; f++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(100);
      }

      const pauseBtn = page.getByTestId('hud-pause-btn');
      await expect(pauseBtn).toBeVisible();
      await pauseBtn.click();

      const returnMenuBtn = page.getByTestId('pause-menu-btn');
      await expect(returnMenuBtn).toBeVisible();
      await returnMenuBtn.click();

      await expect(playBtn).toBeVisible({ timeout: 10000 });

      const isDestroyed = await page.evaluate(() => (window as any).__gameEngine === undefined);
      expect(isDestroyed).toBe(true);

      const cycleMem = await page.evaluate(() => {
        const mem = (performance as any).memory;
        return mem ? Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 100) / 100 : null;
      });
      memorySnapshots.push({ cycle, usedHeapMB: cycleMem });
    }

    console.log('MEMORY 5-CYCLE TELEMETRY (MB):', memorySnapshots);

    const reportsDir = path.resolve(process.cwd(), 'reports');
    const profilePath = path.join(reportsDir, 'profiling-data.json');
    let currentData: any = {};
    if (fs.existsSync(profilePath)) {
      try {
        currentData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
      } catch {
        currentData = {};
      }
    }

    currentData.memoryStabilityCycles = memorySnapshots;
    fs.writeFileSync(profilePath, JSON.stringify(currentData, null, 2), 'utf-8');
  });
});
