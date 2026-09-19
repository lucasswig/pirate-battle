import { Application, Container, TilingSprite } from 'pixi.js';
import { GameplayConfig, DEFAULT_GAME_CONFIG } from '../config/gameConfig';
import { TILEMAP_THEMES } from '../config/themeConfig';
import { AssetManager } from './AssetManager';
import { Island } from '../entities/Island';
import { TileMap } from '../entities/TileMap';
import { PlayerShip } from '../entities/PlayerShip';
import { InputManager } from '../systems/InputManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ProjectilePool } from '../systems/ProjectilePool';
import { CombatSystem } from '../systems/CombatSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { VisualFeedbackSystem } from '../systems/VisualFeedbackSystem';
import { EnemyChaser } from '../entities/EnemyChaser';
import { EnemyShooter } from '../entities/EnemyShooter';
import { Ship } from '../entities/Ship';
import { GameEventEmitter, MatchEndPayload } from './GameEvents';
import { SoundManager } from '../../services/soundManager';

export class GameEngine {
  private app: Application | null = null;
  private canvas: HTMLCanvasElement;
  private config: GameplayConfig;
  private isDestroyed = false;
  private isPaused = false;
  private isMatchOver = false;
  public isInitialized = false;

  private gameStage: Container = new Container();
  private backgroundLayer: Container = new Container();
  private islandLayer: Container = new Container();
  private wreckLayer: Container = new Container();
  private castawayLayer: Container = new Container();
  private shipLayer: Container = new Container();
  private bulletLayer: Container = new Container();
  private effectLayer: Container = new Container();
  private uiLayer: Container = new Container();

  private waterTilingSprite: TilingSprite | null = null;
  private tileMap: TileMap | null = null;
  private islands: Island[] = [];
  private player: PlayerShip | null = null;
  private enemies: Ship[] = [];
  private wrecks: Ship[] = [];

  private inputManager: InputManager = new InputManager();
  private collisionSystem: CollisionSystem | null = null;
  private projectilePool: ProjectilePool | null = null;
  private combatSystem: CombatSystem | null = null;
  private spawnSystem: SpawnSystem | null = null;
  private visualFeedback: VisualFeedbackSystem | null = null;

  public readonly events: GameEventEmitter = new GameEventEmitter();

  private score = 0;
  private remainingTime = 90;
  private durationPlayed = 0;
  private lastSecondReported = -1;
  private waterTime = 0;
  private resizeObserver: ResizeObserver | null = null;
  private frameTimes: number[] = [];

  private currentZoom = 1.0;
  private targetZoom = 1.0;
  private minZoom = 0.5;
  private maxZoom = 2.5;
  private baseFitScale = 1.0;
  private baseFillScale = 1.0;

  private onVisibilityChangeBound = this.handleVisibilityChange.bind(this);
  private onWindowBlurBound = this.handleWindowBlur.bind(this);
  private onWindowResizeBound = this.handleResize.bind(this);

  constructor(canvas: HTMLCanvasElement, config: GameplayConfig = DEFAULT_GAME_CONFIG) {
    this.canvas = canvas;
    this.config = config;
    this.remainingTime = config.sessionDurationSeconds;
  }

  public async init(onProgress?: (progress: number) => void): Promise<void> {
    const assets = AssetManager.getInstance();
    await assets.loadAssets(onProgress, this.config.tilesetTheme);

    if (this.isDestroyed) return;

    const parent = this.canvas.parentElement;
    const initialWidth = parent ? parent.clientWidth : window.innerWidth;
    const initialHeight = parent ? parent.clientHeight : window.innerHeight;

    const themeConfig = TILEMAP_THEMES[this.config.tilesetTheme] || TILEMAP_THEMES.assets_1;
    const initialBgColor = themeConfig.waterColor;
    this.app = new Application();
    await this.app.init({
      canvas: this.canvas,
      width: initialWidth,
      height: initialHeight,
      background: initialBgColor,
      roundPixels: true,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });

    if (this.isDestroyed) {
      this.app.destroy({ releaseGlobalResources: true }, { children: true });
      return;
    }

    this.setupSceneHierarchy();
    this.setupWaterBackground();
    await this.setupIslands();
    this.setupSystems();
    this.setupPlayer();
    this.setupResizeHandling();
    this.setupLifecycleListeners();

    this.updateZoomBounds(initialWidth, initialHeight);
    this.targetZoom = this.baseFillScale;
    this.currentZoom = this.baseFillScale;
    this.gameStage.scale.set(this.baseFillScale);

    SoundManager.startOceanAmbience();

    this.app.ticker.add((ticker) => {
      if (this.isPaused || this.isDestroyed || this.isMatchOver) return;
      this.frameTimes.push(ticker.deltaMS);
      if (this.frameTimes.length > 300) this.frameTimes.shift();
      const rawDt = ticker.deltaMS / 1000;
      const dt = Math.min(rawDt, 0.1);
      this.update(dt);
    });

    this.isInitialized = true;
  }

  private setupSceneHierarchy(): void {
    if (!this.app) return;

    this.app.stage.addChild(this.gameStage);
    this.gameStage.addChild(this.backgroundLayer);
    this.gameStage.addChild(this.islandLayer);
    this.gameStage.addChild(this.wreckLayer);
    this.gameStage.addChild(this.castawayLayer);
    this.gameStage.addChild(this.shipLayer);
    this.gameStage.addChild(this.bulletLayer);
    this.gameStage.addChild(this.effectLayer);
    this.gameStage.addChild(this.uiLayer);
  }

  private setupWaterBackground(): void {
    const assets = AssetManager.getInstance();
    const waterTexture = assets.getTexture('water_tile');

    this.waterTilingSprite = new TilingSprite({
      texture: waterTexture,
      width: 4000,
      height: 4000,
    });
    this.waterTilingSprite.position.set(-1500, -1500);
    this.waterTilingSprite.tileScale.set(1.5);
    this.waterTilingSprite.alpha = 0.85;

    this.backgroundLayer.addChild(this.waterTilingSprite);
  }

  private async setupIslands(): Promise<void> {
    this.tileMap = new TileMap(this.config.tilesetTheme);
    await this.tileMap.buildScene();
    this.islandLayer.addChild(this.tileMap.container);

    const island = new Island({
      id: 'tilemap_islands',
      type: 'NATURAL',
      tileColliders: this.tileMap.getIslandColliders(),
      solidGrid: this.tileMap.getIslandGrid(),
      cols: this.tileMap.cols,
      rows: this.tileMap.rows,
      tileSize: this.tileMap.tileWidth,
    });
    this.islands = [island];
  }

  private setupSystems(): void {
    this.collisionSystem = new CollisionSystem(this.config, this.islands);
    this.projectilePool = new ProjectilePool(this.bulletLayer, 120);
    this.combatSystem = new CombatSystem(this.config, this.projectilePool, this.islands);
    this.spawnSystem = new SpawnSystem(this.config, this.collisionSystem);
    this.visualFeedback = new VisualFeedbackSystem(this.effectLayer, this.castawayLayer, this.tileMap ?? undefined);
    this.combatSystem.setVisualFeedback(this.visualFeedback);
  }

  private setupPlayer(): void {
    const spawnX = 100;
    const spawnY = 410;

    this.player = new PlayerShip(spawnX, spawnY, this.config);
    this.player.rotation = 0.7;
    this.shipLayer.addChild(this.player.container);
  }

  private setupLifecycleListeners(): void {
    document.addEventListener('visibilitychange', this.onVisibilityChangeBound);
    window.addEventListener('blur', this.onWindowBlurBound);
  }

  private handleVisibilityChange(): void {
    if (document.hidden && !this.isPaused && !this.isMatchOver) {
      this.pause();
      this.events.emit('autoPaused', true);
    }
  }

  private handleWindowBlur(): void {
    if (!this.isPaused && !this.isMatchOver) {
      this.pause();
      this.events.emit('autoPaused', true);
    }
  }

  private setupResizeHandling(): void {
    this.handleResize();

    if (this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
    window.addEventListener('resize', this.onWindowResizeBound);
  }

  private handleResize(): void {
    if (!this.canvas || !this.app) return;

    const parent = this.canvas.parentElement;
    const containerWidth = parent ? parent.clientWidth : window.innerWidth;
    const containerHeight = parent ? parent.clientHeight : window.innerHeight;

    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.app.renderer.resize(containerWidth, containerHeight);

    this.updateZoomBounds(containerWidth, containerHeight);
  }

  private updateZoomBounds(viewWidth: number, viewHeight: number): void {
    const mapWidth = this.config.arenaWidth;
    const mapHeight = this.config.arenaHeight;

    const scaleX = viewWidth / mapWidth;
    const scaleY = viewHeight / mapHeight;

    this.baseFitScale = Math.min(scaleX, scaleY);
    this.baseFillScale = Math.max(scaleX, scaleY);

    this.minZoom = this.baseFitScale;
    this.maxZoom = Math.max(this.baseFillScale * 2.2, 3.5);

    this.targetZoom = this.baseFillScale;
    this.currentZoom = this.baseFillScale;
  }

  public getZoom(): number {
    return this.currentZoom;
  }

  public getMinZoom(): number {
    return this.minZoom;
  }

  public getMaxZoom(): number {
    return this.maxZoom;
  }

  public getBaseFillScale(): number {
    return this.baseFillScale;
  }

  public getBaseFitScale(): number {
    return this.baseFitScale;
  }

  private update(dt: number): void {
    this.durationPlayed += dt;
    this.remainingTime -= dt;

    const currentSecond = Math.ceil(Math.max(0, this.remainingTime));
    if (currentSecond !== this.lastSecondReported) {
      this.lastSecondReported = currentSecond;
      this.events.emit('timeUpdated', currentSecond);
    }

    if (this.remainingTime <= 0) {
      this.triggerMatchEnd('TIME_EXPIRED');
      return;
    }

    this.waterTime += dt;
    if (this.waterTilingSprite) {
      this.waterTilingSprite.tilePosition.x = Math.sin(this.waterTime * 0.4) * 8;
      this.waterTilingSprite.tilePosition.y = Math.cos(this.waterTime * 0.3) * 6;
    }

    if (this.player && !this.player.isDead) {
      const input = this.inputManager.getInputState();
      this.player.updateInput(input, dt);
      this.player.update(dt);
      this.collisionSystem?.resolveShipCollisions(this.player);

      this.combatSystem?.handlePlayerCombat(this.player, input);
      this.events.emit('playerCooldowns', {
        front: this.player.frontCannonCooldownRemaining,
        left: this.player.broadsideLeftCooldownRemaining,
        right: this.player.broadsideRightCooldownRemaining,
      });
    }

    this.spawnSystem?.update(dt, this.player!, this.enemies.length, (newEnemy) => {
      this.enemies.push(newEnemy);
      this.shipLayer.addChild(newEnemy.container);
    });

    this.updateEnemies(dt);
    if (this.player && !this.player.isDead) {
      this.collisionSystem?.resolveShipVsShipCollisions(this.player, this.enemies);
    }
    this.combatSystem?.updateProjectiles(dt);
    this.resolveCombatCollisions();
    const activeShips: Ship[] = [];
    if (this.player && !this.player.isDead) {
      activeShips.push(this.player);
    }
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        activeShips.push(enemy);
      }
    }
    this.visualFeedback?.update(dt, activeShips);

    this.updateCamera(dt);
  }

  private updateCamera(dt: number): void {
    if (!this.app) return;

    this.currentZoom += (this.targetZoom - this.currentZoom) * Math.min(1, dt * 10);
    this.gameStage.scale.set(this.currentZoom);

    const parent = this.canvas.parentElement;
    const viewWidth = parent ? parent.clientWidth : window.innerWidth;
    const viewHeight = parent ? parent.clientHeight : window.innerHeight;

    const mapW = this.config.arenaWidth;
    const mapH = this.config.arenaHeight;
    const scaledW = mapW * this.currentZoom;
    const scaledH = mapH * this.currentZoom;

    let camX: number;
    if (scaledW <= viewWidth) {
      camX = (viewWidth - scaledW) / 2;
    } else {
      const focusX = this.player ? this.player.x : mapW / 2;
      const desiredX = viewWidth / 2 - focusX * this.currentZoom;
      camX = Math.max(viewWidth - scaledW, Math.min(0, desiredX));
    }

    let camY: number;
    if (scaledH <= viewHeight) {
      camY = (viewHeight - scaledH) / 2;
    } else {
      const focusY = this.player ? this.player.y : mapH / 2;
      const desiredY = viewHeight / 2 - focusY * this.currentZoom;
      camY = Math.max(viewHeight - scaledH, Math.min(0, desiredY));
    }

    this.gameStage.position.set(Math.round(camX), Math.round(camY));
  }

  private updateEnemies(dt: number): void {
    if (!this.player || this.player.isDead) return;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy instanceof EnemyChaser) {
        enemy.updateAI(this.player, dt);
      } else if (enemy instanceof EnemyShooter) {
        enemy.updateAI(this.player, dt, (spawnX, spawnY, dirX, dirY) => {
          this.combatSystem?.fireEnemyCannon(spawnX, spawnY, dirX, dirY);
        });
      }

      enemy.update(dt);
      this.collisionSystem?.resolveShipCollisions(enemy);

      if (enemy instanceof EnemyChaser) {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < enemy.collisionRadius + this.player.collisionRadius) {
          this.player.takeDamage(this.config.chaserImpactDamage);
          this.events.emit('healthChanged', this.player.health);

          SoundManager.playShipCollision();
          this.handleEnemyDestruction(enemy, i, false);

          if (this.player.isDead) {
            this.triggerMatchEnd('PLAYER_DEFEATED');
            return;
          }
        }
      }
    }
  }

  private handleEnemyDestruction(
    enemy: Ship,
    index: number,
    allowSurvivors?: boolean,
    survivorCount: number = 1
  ): void {
    const assets = AssetManager.getInstance();
    const wreckTexture = assets.getTexture('ship_iron_wreck');

    enemy.turnIntoWreck(wreckTexture);
    this.enemies.splice(index, 1);

    this.shipLayer.removeChild(enemy.container);
    this.wreckLayer.addChild(enemy.container);

    this.wrecks.push(enemy);
    if (this.wrecks.length > 15) {
      const oldest = this.wrecks.shift();
      if (oldest) {
        this.wreckLayer.removeChild(oldest.container);
        oldest.destroy();
      }
    }

    const shorePoint = this.tileMap?.getNearestShorePoint(enemy.x, enemy.y) ?? { x: enemy.x, y: enemy.y };
    const survivorsAllowed = allowSurvivors ?? (enemy.hitCount > 1);
    this.visualFeedback?.spawnShipDestruction(enemy.x, enemy.y, shorePoint, survivorsAllowed, survivorCount);

    SoundManager.playShipExplosion();
  }

  private resolveCombatCollisions(): void {
    if (!this.combatSystem || !this.player) return;

    const projectiles = this.combatSystem.getActiveProjectiles();

    for (const proj of projectiles) {
      if (proj.faction === 'PLAYER') {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          if (enemy.isDead) continue;

          const dx = proj.x - enemy.x;
          const dy = proj.y - enemy.y;
          const distSq = dx * dx + dy * dy;
          const hitDist = enemy.collisionRadius + proj.collisionRadius;

          if (distSq < hitDist * hitDist) {
            proj.deactivate();
            const killed = enemy.takeDamage(proj.damage);
            SoundManager.playWoodHit();

            if (killed) {
              this.score += 1;
              this.events.emit('scoreChanged', this.score);
              SoundManager.playScorePoint();
              const isInstantVolley = enemy.hitCount <= 1 || (performance.now() - enemy.firstHitTime) < 300;
              const allowSurvivors = !isInstantVolley && Math.random() < 0.65;
              this.handleEnemyDestruction(enemy, i, allowSurvivors, 1);
            } else {
              const shorePoint = this.tileMap?.getNearestShorePoint(enemy.x, enemy.y) ?? { x: enemy.x, y: enemy.y };
              const isHeavyDamage = enemy.health / enemy.maxHealth < 0.5;
              this.visualFeedback?.spawnDamageHitFeedback(enemy.x, enemy.y, shorePoint, isHeavyDamage);
            }
            break;
          }
        }
      } else if (proj.faction === 'ENEMY' && !this.player.isDead) {
        const dx = proj.x - this.player.x;
        const dy = proj.y - this.player.y;
        const distSq = dx * dx + dy * dy;
        const hitDist = this.player.collisionRadius + proj.collisionRadius;

        if (distSq < hitDist * hitDist) {
          proj.deactivate();
          this.player.takeDamage(proj.damage);
          this.events.emit('healthChanged', this.player.health);
          SoundManager.playWoodHit();

          if (this.player.isDead) {
            this.visualFeedback?.spawnExplosion(this.player.x, this.player.y, 2.0);
            SoundManager.playShipExplosion();
            this.triggerMatchEnd('PLAYER_DEFEATED');
            return;
          } else {
            this.visualFeedback?.spawnWoodDebris(this.player.x, this.player.y, 1);
          }
        }
      }
    }
  }

  private triggerMatchEnd(reason: 'TIME_EXPIRED' | 'PLAYER_DEFEATED'): void {
    this.isMatchOver = true;
    this.inputManager.setEnabled(false);
    SoundManager.stopOceanAmbience();

    if (reason === 'TIME_EXPIRED' && this.score > 0) {
      SoundManager.play('game_complete');
    } else {
      SoundManager.play('game_over');
    }

    const payload: MatchEndPayload = {
      reason,
      score: this.score,
      durationPlayedSeconds: Math.floor(this.durationPlayed),
    };

    this.events.emit('matchEnded', payload);
  }

  public restart(): void {
    this.score = 0;
    this.remainingTime = this.config.sessionDurationSeconds;
    this.durationPlayed = 0;
    this.isMatchOver = false;
    this.isPaused = false;
    this.lastSecondReported = -1;

    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];

    for (const wreck of this.wrecks) {
      wreck.destroy();
    }
    this.wrecks = [];
    this.wreckLayer.removeChildren();

    this.projectilePool?.clearAll();
    this.combatSystem?.clear();
    this.visualFeedback?.clear();
    this.spawnSystem?.reset();

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.setupPlayer();

    this.inputManager.clear();
    this.inputManager.setEnabled(true);

    this.events.emit('scoreChanged', 0);
    this.events.emit('healthChanged', this.config.playerMaxHealth);
    this.events.emit('timeUpdated', this.config.sessionDurationSeconds);

    SoundManager.play('game_start');
    SoundManager.startOceanAmbience();
  }

  public getPlayer(): PlayerShip | null {
    return this.player;
  }

  public getInputManager(): InputManager {
    return this.inputManager;
  }

  public getScore(): number {
    return this.score;
  }

  public getRemainingTime(): number {
    return this.remainingTime;
  }

  public pause(): void {
    this.isPaused = true;
    this.inputManager.setEnabled(false);
    SoundManager.play('game_pause');
    SoundManager.pauseOceanAmbience();
  }

  public resume(): void {
    this.isPaused = false;
    this.inputManager.clear();
    this.inputManager.setEnabled(true);
    SoundManager.play('game_resume');
    SoundManager.resumeOceanAmbience();
  }

  public isGamePaused(): boolean {
    return this.isPaused;
  }

  public getCollisionSystem(): CollisionSystem | null {
    return this.collisionSystem;
  }

  public getEnemies(): Ship[] {
    return this.enemies;
  }

  public getWrecks(): Ship[] {
    return this.wrecks;
  }

  public getVisualFeedback(): VisualFeedbackSystem | null {
    return this.visualFeedback;
  }

  public spawnEnemyForTesting(type: 'chaser' | 'shooter', x: number, y: number): Ship {
    const enemy = type === 'shooter'
      ? new EnemyShooter(x, y, this.config)
      : new EnemyChaser(x, y, this.config);
    this.enemies.push(enemy);
    this.shipLayer.addChild(enemy.container);
    return enemy;
  }

  public getPerformanceMetrics(): {
    fps: number;
    p95FrameTimeMs: number;
    avgFrameTimeMs: number;
    activeEnemies: number;
    activeProjectiles: number;
    activeWrecks: number;
  } {
    const fps = this.app ? Math.round(this.app.ticker.FPS) : 60;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const p95Idx = Math.floor(sorted.length * 0.95);
    const p95 = sorted.length > 0 ? sorted[p95Idx] : 16.6;
    const avg = sorted.length > 0 ? sorted.reduce((sum, v) => sum + v, 0) / sorted.length : 16.6;
    return {
      fps,
      p95FrameTimeMs: Math.round(p95 * 100) / 100,
      avgFrameTimeMs: Math.round(avg * 100) / 100,
      activeEnemies: this.enemies.length,
      activeProjectiles: this.projectilePool?.getActiveProjectiles().length ?? 0,
      activeWrecks: this.wrecks.length,
    };
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.isInitialized = false;
    SoundManager.stopOceanAmbience();

    document.removeEventListener('visibilitychange', this.onVisibilityChangeBound);
    window.removeEventListener('blur', this.onWindowBlurBound);
    window.removeEventListener('resize', this.onWindowResizeBound);

    this.inputManager.detachListeners();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];

    for (const wreck of this.wrecks) {
      wreck.destroy();
    }
    this.wrecks = [];
    this.wreckLayer.removeChildren();

    this.projectilePool?.destroy();
    this.visualFeedback?.clear();

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    if (this.tileMap) {
      this.tileMap.destroy();
      this.tileMap = null;
    }

    if (this.app) {
      this.app.ticker.stop();
      this.app.destroy(
        { removeView: false, releaseGlobalResources: true },
        { children: true }
      );
      this.app = null;
    }

    this.events.clear();
    this.islands = [];
  }
}
