import React, { useEffect, useRef, useState } from 'react';
import { Application, Container, Sprite, TilingSprite } from 'pixi.js';
import { AssetManager } from '../../game/core/AssetManager';
import { TileMap } from '../../game/entities/TileMap';
import { TILEMAP_THEMES } from '../../game/config/themeConfig';
import { loadGameSettings } from '../../services/settingsStorage';
import { SoundManager } from '../../services/soundManager';

export const LiveGameBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SoundManager.stopOceanAmbience();
    let isMounted = true;
    let app: Application | null = null;
    let resizeObserver: ResizeObserver | null = null;

    async function initLiveScene() {
      if (!canvasRef.current) return;

      const settings = loadGameSettings();
      const theme = settings.tilesetTheme;
      const assets = AssetManager.getInstance();

      await assets.loadAssets(undefined, theme);
      if (!isMounted || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const initialWidth = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      const initialHeight = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      const themeConfig = TILEMAP_THEMES[theme] || TILEMAP_THEMES.assets_1;
      const initialBgColor = themeConfig.waterColor;

      app = new Application();
      await app.init({
        canvas,
        width: initialWidth,
        height: initialHeight,
        background: initialBgColor,
        roundPixels: true,
        antialias: false,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (!isMounted || !app.stage) {
        app.destroy({ releaseGlobalResources: false }, { children: true });
        return;
      }

      const worldContainer = new Container();
      const backgroundLayer = new Container();
      const islandLayer = new Container();
      const shipLayer = new Container();

      app.stage.addChild(worldContainer);
      worldContainer.addChild(backgroundLayer);
      worldContainer.addChild(islandLayer);
      worldContainer.addChild(shipLayer);

      const waterTexture = assets.getTexture('water_tile');
      const waterTilingSprite = new TilingSprite({
        texture: waterTexture,
        width: 4000,
        height: 4000,
      });
      waterTilingSprite.position.set(-1500, -1500);
      waterTilingSprite.tileScale.set(1.5);
      waterTilingSprite.alpha = 0.88;
      backgroundLayer.addChild(waterTilingSprite);

      const tileMap = new TileMap(theme);
      await tileMap.buildScene();
      if (!isMounted) {
        app.destroy({ releaseGlobalResources: false }, { children: true });
        return;
      }
      islandLayer.addChild(tileMap.container);

      const shipTexture = assets.getTexture('ship_player_intact');
      const playerShip = new Sprite(shipTexture);
      playerShip.anchor.set(0.5, 0.5);
      playerShip.scale.set(0.65);
      playerShip.position.set(180, 390);
      playerShip.rotation = 0.75;
      shipLayer.addChild(playerShip);

      const enemyTexture = assets.getTexture('ship_shooter_intact');
      const patrolShip = new Sprite(enemyTexture);
      patrolShip.anchor.set(0.5, 0.5);
      patrolShip.scale.set(0.55);
      patrolShip.position.set(640, 180);
      patrolShip.rotation = -1.2;
      shipLayer.addChild(patrolShip);

      const mapWidth = tileMap.mapWidth;
      const mapHeight = tileMap.mapHeight;

      const handleResize = () => {
        if (!canvas || !app || !app.renderer) return;
        const parent = canvas.parentElement;
        const w = parent ? parent.clientWidth : window.innerWidth;
        const h = parent ? parent.clientHeight : window.innerHeight;

        canvas.style.width = '100%';
        canvas.style.height = '100%';
        app.renderer.resize(w, h);

        const scale = Math.max(w / mapWidth, h / mapHeight) * 1.08;
        worldContainer.scale.set(scale);

        const offsetX = (w - mapWidth * scale) / 2;
        const offsetY = (h - mapHeight * scale) / 2;
        worldContainer.position.set(offsetX, offsetY);
      };

      handleResize();

      if (canvas.parentElement) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvas.parentElement);
      }
      window.addEventListener('resize', handleResize);

      let waterTime = 0;
      let patrolT = 0;

      app.ticker.add((ticker) => {
        if (!isMounted) return;
        const dt = Math.min(ticker.deltaMS / 1000, 0.1);
        waterTime += dt;
        patrolT += dt * 0.4;

        waterTilingSprite.tilePosition.x = Math.sin(waterTime * 0.35) * 8;
        waterTilingSprite.tilePosition.y = Math.cos(waterTime * 0.28) * 6;

        playerShip.rotation = 0.75 + Math.sin(waterTime * 1.5) * 0.035;
        playerShip.y = 390 + Math.cos(waterTime * 1.2) * 2.5;

        patrolShip.x = 640 + Math.sin(patrolT) * 70;
        patrolShip.y = 180 + Math.cos(patrolT * 0.7) * 30;
        patrolShip.rotation = -1.2 + Math.cos(patrolT) * 0.15;
      });

      if (isMounted) {
        setIsReady(true);
      }
    }

    initLiveScene().catch((err) => {
      console.warn('Live background initialization skipped:', err);
    });

    return () => {
      isMounted = false;
      SoundManager.stopOceanAmbience();
      window.removeEventListener('resize', () => {});
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (app) {
        try {
          app.destroy({ releaseGlobalResources: false }, { children: true });
        } catch {}
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/ui_scene_background.png')` }}
      />
      <canvas
        ref={canvasRef}
        className={`relative w-full h-full block transition-opacity duration-700 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
