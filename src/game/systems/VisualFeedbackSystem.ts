import { Container, Graphics, Sprite } from 'pixi.js';
import { AssetManager } from '../core/AssetManager';
import { TileMap } from '../entities/TileMap';

interface ActiveEffect {
  sprite: Sprite;
  lifetime: number;
  maxLifetime: number;
  scaleGrowth: number;
  rotationSpeed: number;
}

interface WoodDebris {
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  lifetime: number;
  maxLifetime: number;
  baseScale: number;
}

interface CastawaySwimmer {
  container: Container;
  sprite: Sprite;
  dinghySprite?: Sprite;
  hasDinghy: boolean;
  rippleGraphic: Graphics;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  elapsed: number;
  maxLifetime: number;
  reachedShore: boolean;
  waveVx: number;
  waveVy: number;
  beachedAngle?: number;
}

export interface ShipWakeSource {
  x: number;
  y: number;
  rotation: number;
  currentSpeed?: number;
}

const ISLAND_INTERIOR_POLYGONS: Array<Array<{ x: number; y: number }>> = [
  [
    { x: 136, y: 0 },
    { x: 475, y: 0 },
    { x: 475, y: 105 },
    { x: 415, y: 122 },
    { x: 375, y: 140 },
    { x: 375, y: 200 },
    { x: 362, y: 220 },
    { x: 340, y: 236 },
    { x: 310, y: 242 },
    { x: 260, y: 242 },
    { x: 200, y: 244 },
    { x: 165, y: 242 },
    { x: 148, y: 230 },
    { x: 140, y: 215 },
    { x: 136, y: 190 },
  ],
  [
    { x: 268, y: 512 },
    { x: 268, y: 430 },
    { x: 272, y: 414 },
    { x: 280, y: 406 },
    { x: 295, y: 398 },
    { x: 320, y: 394 },
    { x: 440, y: 395 },
    { x: 480, y: 394 },
    { x: 508, y: 394 },
    { x: 528, y: 398 },
    { x: 532, y: 415 },
    { x: 532, y: 512 },
  ],
  [
    { x: 635, y: 512 },
    { x: 635, y: 440 },
    { x: 648, y: 410 },
    { x: 650, y: 365 },
    { x: 658, y: 348 },
    { x: 672, y: 338 },
    { x: 720, y: 330 },
    { x: 784, y: 329 },
    { x: 840, y: 330 },
    { x: 880, y: 346 },
    { x: 896, y: 350 },
    { x: 896, y: 512 },
  ],
];

function isInsidePolygon(x: number, y: number, poly: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function clampAwayFromIslandInterior(entity: { x: number; y: number; waveVx?: number; waveVy?: number }): void {
  for (const poly of ISLAND_INTERIOR_POLYGONS) {
    if (isInsidePolygon(entity.x, entity.y, poly)) {
      let closestX = entity.x;
      let closestY = entity.y;
      let minLenSq = Infinity;
      let bestNormX = 0;
      let bestNormY = 0;

      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        const t = Math.max(0, Math.min(1, ((entity.x - p1.x) * dx + (entity.y - p1.y) * dy) / lenSq));
        const px = p1.x + t * dx;
        const py = p1.y + t * dy;
        const distSq = (entity.x - px) * (entity.x - px) + (entity.y - py) * (entity.y - py);

        if (distSq < minLenSq) {
          minLenSq = distSq;
          closestX = px;
          closestY = py;

          const segLen = Math.sqrt(lenSq);
          bestNormX = -dy / segLen;
          bestNormY = dx / segLen;
        }
      }

      entity.x = closestX;
      entity.y = closestY;

      if (entity.waveVx !== undefined && entity.waveVy !== undefined) {
        const velDotNorm = entity.waveVx * bestNormX + entity.waveVy * bestNormY;
        if (velDotNorm < 0) {
          entity.waveVx -= velDotNorm * bestNormX;
          entity.waveVy -= velDotNorm * bestNormY;
        }
      }
    }
  }

  entity.x = Math.max(8, Math.min(888, entity.x));
  entity.y = Math.max(8, Math.min(504, entity.y));
}

export class VisualFeedbackSystem {
  private effectLayer: Container;
  private castawayLayer: Container;
  private tileMap?: TileMap;
  private activeEffects: ActiveEffect[] = [];
  private woodDebrisList: WoodDebris[] = [];
  private castaways: CastawaySwimmer[] = [];

  constructor(effectLayer: Container, castawayLayer?: Container, tileMap?: TileMap) {
    this.effectLayer = effectLayer;
    this.castawayLayer = castawayLayer ?? effectLayer;
    this.tileMap = tileMap;
  }

  public applyShipWakePush(ships: ShipWakeSource[], dt: number): void {
    if (!ships || ships.length === 0) return;

    for (const ship of ships) {
      const fwdX = Math.sin(ship.rotation);
      const fwdY = -Math.cos(ship.rotation);
      const sideX = Math.cos(ship.rotation);
      const sideY = Math.sin(ship.rotation);

      const sternX = ship.x - fwdX * 24;
      const sternY = ship.y - fwdY * 24;
      const bowX = ship.x + fwdX * 28;
      const bowY = ship.y + fwdY * 28;
      const spineDx = bowX - sternX;
      const spineDy = bowY - sternY;
      const spineLenSq = spineDx * spineDx + spineDy * spineDy;

      for (const castaway of this.castaways) {
        if (castaway.reachedShore) continue;

        const t = Math.max(0, Math.min(1, ((castaway.x - sternX) * spineDx + (castaway.y - sternY) * spineDy) / spineLenSq));
        const projX = sternX + t * spineDx;
        const projY = sternY + t * spineDy;

        let diffX = castaway.x - projX;
        let diffY = castaway.y - projY;
        let dist = Math.hypot(diffX, diffY);

        const pushThreshold = 46;
        if (dist < pushThreshold) {
          if (dist < 0.001) {
            const across = (castaway.x - ship.x) * sideX + (castaway.y - ship.y) * sideY;
            const sign = across >= 0 ? 1 : -1;
            diffX = sideX * sign;
            diffY = sideY * sign;
            dist = 1;
          }

          const normX = diffX / dist;
          const normY = diffY / dist;

          const minRadius = castaway.hasDinghy ? 34 : 28;
          if (dist < minRadius) {
            const overlap = minRadius - dist;
            castaway.x += normX * overlap;
            castaway.y += normY * overlap;
          }

          const intensity = 1 - dist / pushThreshold;
          const speed = Math.max(90, ship.currentSpeed ?? 120);
          const pushImpulse = intensity * speed * 2.4;

          castaway.waveVx += normX * pushImpulse * dt * 12;
          castaway.waveVy += normY * pushImpulse * dt * 12;

          const curWaveSpeed = Math.hypot(castaway.waveVx, castaway.waveVy);
          const maxWaveSpeed = 180;
          if (curWaveSpeed > maxWaveSpeed) {
            castaway.waveVx = (castaway.waveVx / curWaveSpeed) * maxWaveSpeed;
            castaway.waveVy = (castaway.waveVy / curWaveSpeed) * maxWaveSpeed;
          }
          clampAwayFromIslandInterior(castaway);
        }
      }

      for (const debris of this.woodDebrisList) {
        const dx = debris.x - ship.x;
        const dy = debris.y - ship.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 42 && dist > 0.001) {
          const push = (1 - dist / 42) * 90;
          debris.vx += (dx / dist) * push;
          debris.vy += (dy / dist) * push;
          clampAwayFromIslandInterior(debris);
        }
      }
    }
  }

  public spawnExplosion(x: number, y: number, scale: number = 1.0): void {
    const assets = AssetManager.getInstance();
    const textures = [
      assets.getTexture('explosion_1'),
      assets.getTexture('explosion_2'),
      assets.getTexture('explosion_3'),
    ];

    const randomTex = textures[Math.floor(Math.random() * textures.length)];
    const sprite = new Sprite(randomTex);
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(x, y);
    sprite.scale.set(scale * 0.7);
    sprite.rotation = Math.random() * Math.PI * 2;

    this.effectLayer.addChild(sprite);

    this.activeEffects.push({
      sprite,
      lifetime: 0.45,
      maxLifetime: 0.45,
      scaleGrowth: scale * 1.6,
      rotationSpeed: (Math.random() - 0.5) * 4,
    });
  }

  public spawnMuzzlePuff(x: number, y: number, dirX: number, dirY: number): void {
    const assets = AssetManager.getInstance();
    const fireTex = assets.getTexture('fire_1');
    const sprite = new Sprite(fireTex);
    sprite.anchor.set(0.2, 0.5);
    sprite.position.set(x, y);
    sprite.rotation = Math.atan2(dirY, dirX);
    sprite.scale.set(0.32);
    this.effectLayer.addChild(sprite);

    this.activeEffects.push({
      sprite,
      lifetime: 0.12,
      maxLifetime: 0.12,
      scaleGrowth: 0.35,
      rotationSpeed: 0,
    });
  }

  public spawnFireFlash(x: number, y: number, scale: number = 0.8): void {
    const assets = AssetManager.getInstance();
    const fireTextures = [
      assets.getTexture('fire_1'),
      assets.getTexture('fire_2'),
    ];
    const tex = fireTextures[Math.floor(Math.random() * fireTextures.length)];
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(x, y);
    sprite.scale.set(scale);
    sprite.rotation = Math.random() * Math.PI * 2;

    this.effectLayer.addChild(sprite);

    this.activeEffects.push({
      sprite,
      lifetime: 0.6,
      maxLifetime: 0.6,
      scaleGrowth: scale * 0.5,
      rotationSpeed: (Math.random() - 0.5) * 2,
    });
  }

  public spawnWoodDebris(x: number, y: number, count?: number): void {
    const assets = AssetManager.getInstance();
    const woodTextures = [
      assets.getTexture('wood_debris_1'),
      assets.getTexture('wood_debris_2'),
      assets.getTexture('wood_debris_3'),
      assets.getTexture('wood_debris_4'),
    ];

    const piecesCount = count ?? (3 + Math.floor(Math.random() * 3));
    for (let i = 0; i < piecesCount; i++) {
      const tex = woodTextures[Math.floor(Math.random() * woodTextures.length)];
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5, 0.5);
      sprite.position.set(x, y);

      const baseScale = 0.45 + Math.random() * 0.3;
      sprite.scale.set(baseScale);

      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 110;
      const spin = (Math.random() - 0.5) * 10;
      const lifetime = 1.6 + Math.random() * 0.6;

      this.castawayLayer.addChild(sprite);

      this.woodDebrisList.push({
        sprite,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        spin,
        lifetime,
        maxLifetime: lifetime,
        baseScale,
      });
    }
  }

  public spawnCastaways(
    x: number,
    y: number,
    targetShore: {
      x: number;
      y: number;
      tangentX?: number;
      tangentY?: number;
      normalX?: number;
      normalY?: number;
    },
    countOverride?: number,
    allowDinghy: boolean = true
  ): void {
    const assets = AssetManager.getInstance();
    const crewTextures = [
      assets.getTexture('crew_swimmer_1'),
      assets.getTexture('crew_swimmer_2'),
      assets.getTexture('crew_swimmer_3'),
      assets.getTexture('crew_swimmer_4'),
      assets.getTexture('crew_swimmer_5'),
      assets.getTexture('crew_swimmer_6'),
    ].filter(Boolean);

    const dinghyTextures = [
      assets.getTexture('dinghy_1'),
      assets.getTexture('dinghy_2'),
    ];

    const count = countOverride ?? (1 + Math.floor(Math.random() * 2));
    const dinghyIndex = allowDinghy
      ? (count === 1 ? (Math.random() < 0.5 ? 0 : -1) : Math.floor(Math.random() * count))
      : -1;

    let tx = targetShore.tangentX;
    let ty = targetShore.tangentY;
    if (tx === undefined || ty === undefined || (tx === 0 && ty === 0)) {
      const approachX = targetShore.x - x;
      const approachY = targetShore.y - y;
      const len = Math.hypot(approachX, approachY) || 1;
      tx = -approachY / len;
      ty = approachX / len;
    }

    let nx = targetShore.normalX;
    let ny = targetShore.normalY;
    if (nx === undefined || ny === undefined || (nx === 0 && ny === 0)) {
      const approachX = targetShore.x - x;
      const approachY = targetShore.y - y;
      const len = Math.hypot(approachX, approachY) || 1;
      nx = approachX / len;
      ny = approachY / len;
    }

    for (let i = 0; i < count; i++) {
      const container = new Container();
      const offsetAngle = (i * Math.PI) + (Math.random() - 0.5) * 0.8;
      const offsetDist = 16 + Math.random() * 10;
      const spawnX = x + Math.cos(offsetAngle) * offsetDist;
      const spawnY = y + Math.sin(offsetAngle) * offsetDist;
      container.position.set(spawnX, spawnY);

      const rippleGraphic = new Graphics();
      container.addChild(rippleGraphic);

      const hasDinghy = (i === dinghyIndex);
      let dinghySprite: Sprite | undefined;

      if (hasDinghy) {
        const dinghyTex = dinghyTextures[Math.floor(Math.random() * dinghyTextures.length)];
        dinghySprite = new Sprite(dinghyTex);
        dinghySprite.anchor.set(0.5, 0.5);
        dinghySprite.scale.set(0.65);
        container.addChild(dinghySprite);
      }

      const tex = crewTextures[Math.floor(Math.random() * crewTextures.length)];
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5, 0.5);
      if (hasDinghy) {
        sprite.scale.set(0.48);
        sprite.position.set(0, -2);
      } else {
        sprite.scale.set(0.58);
      }
      container.addChild(sprite);

      this.castawayLayer.addChild(container);

      const isDirectTest = count === 1 && Math.hypot(x - targetShore.x, y - targetShore.y) < 35;

      let candX = targetShore.x;
      let candY = targetShore.y;

      if (!isDirectTest) {
        const batchSpacing = hasDinghy ? 32 : 24;
        const batchOffset = (i - (count - 1) / 2) * batchSpacing;

        candX = targetShore.x + tx * batchOffset;
        candY = targetShore.y + ty * batchOffset;

        let curNx = nx;
        let curNy = ny;

        if (this.tileMap) {
          const proj = this.tileMap.getNearestShorePoint(candX, candY);
          candX = proj.x;
          candY = proj.y;
          curNx = proj.normalX;
          curNy = proj.normalY;
        }

        let attempts = 0;
        while (attempts < 8) {
          const tooClose = this.castaways.some((c) => {
            const d = Math.hypot(c.targetX - candX, c.targetY - candY);
            const thresh = (hasDinghy || c.hasDinghy) ? 30 : 20;
            return d < thresh;
          });
          if (!tooClose) break;

          const shift = (attempts % 2 === 0 ? 1 : -1) * Math.ceil((attempts + 1) / 2) * 26;
          candX = targetShore.x + tx * (batchOffset + shift);
          candY = targetShore.y + ty * (batchOffset + shift);

          if (this.tileMap) {
            const proj = this.tileMap.getNearestShorePoint(candX, candY);
            candX = proj.x;
            candY = proj.y;
            curNx = proj.normalX;
            curNy = proj.normalY;
          }
          attempts++;
        }

        const beachInwardPush = hasDinghy ? 14 : 8;
        candX += curNx * beachInwardPush;
        candY += curNy * beachInwardPush;

        const depthJitter = ((i % 3) - 1) * 2;
        candX += curNx * depthJitter;
        candY += curNy * depthJitter;

        const dummy = { x: candX, y: candY };
        clampAwayFromIslandInterior(dummy);
        candX = dummy.x;
        candY = dummy.y;
      }

      const lifetime = 8.0 + Math.random() * 2.0;
      this.castaways.push({
        container,
        sprite,
        dinghySprite,
        hasDinghy,
        rippleGraphic,
        x: spawnX,
        y: spawnY,
        targetX: candX,
        targetY: candY,
        elapsed: 0,
        maxLifetime: lifetime,
        reachedShore: false,
        waveVx: 0,
        waveVy: 0,
      });
    }
  }

  public spawnDamageHitFeedback(
    x: number,
    y: number,
    _targetShore?: {
      x: number;
      y: number;
      tangentX?: number;
      tangentY?: number;
      normalX?: number;
      normalY?: number;
    },
    _isHeavyDamage?: boolean
  ): void {
    this.spawnWoodDebris(x, y, 1 + Math.floor(Math.random() * 2));
  }

  public spawnShipDestruction(
    x: number,
    y: number,
    targetShore: {
      x: number;
      y: number;
      tangentX?: number;
      tangentY?: number;
      normalX?: number;
      normalY?: number;
    },
    allowSurvivors: boolean = true,
    survivorCount?: number
  ): void {
    this.spawnFireFlash(x - 10, y + 8, 0.75);
    this.spawnFireFlash(x + 12, y - 10, 0.85);
    this.spawnExplosion(x, y, 1.5);
    this.spawnWoodDebris(x, y);
    if (allowSurvivors) {
      const count = survivorCount ?? 2;
      this.spawnCastaways(x, y, targetShore, count, true);
    }
  }

  public getCastawaysCount(): number {
    return this.castaways.length;
  }

  public getWoodDebrisCount(): number {
    return this.woodDebrisList.length;
  }

  public update(dt: number, activeShips: ShipWakeSource[] = []): void {
    if (activeShips.length > 0) {
      this.applyShipWakePush(activeShips, dt);
    }

    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const fx = this.activeEffects[i];
      fx.lifetime -= dt;

      const progress = 1 - Math.max(0, fx.lifetime / fx.maxLifetime);
      fx.sprite.scale.set(fx.sprite.scale.x + fx.scaleGrowth * dt);
      fx.sprite.alpha = 1 - progress;
      fx.sprite.rotation += fx.rotationSpeed * dt;

      if (fx.lifetime <= 0) {
        this.effectLayer.removeChild(fx.sprite);
        fx.sprite.destroy();
        this.activeEffects.splice(i, 1);
      }
    }

    for (let i = this.woodDebrisList.length - 1; i >= 0; i--) {
      const debris = this.woodDebrisList[i];
      debris.lifetime -= dt;

      debris.x += debris.vx * dt;
      debris.y += debris.vy * dt;
      clampAwayFromIslandInterior(debris);

      const drag = Math.pow(0.92, dt * 60);
      debris.vx *= drag;
      debris.vy *= drag;

      debris.rotation += debris.spin * dt;

      const progress = 1 - Math.max(0, debris.lifetime / debris.maxLifetime);
      const sinkFactor = Math.max(0, (progress - 0.5) * 2);
      debris.sprite.alpha = 1 - sinkFactor * 0.9;
      debris.sprite.scale.set(debris.baseScale * (1 - sinkFactor * 0.25));

      debris.sprite.position.set(debris.x, debris.y);
      debris.sprite.rotation = debris.rotation;

      if (debris.lifetime <= 0) {
        this.castawayLayer.removeChild(debris.sprite);
        debris.sprite.destroy();
        this.woodDebrisList.splice(i, 1);
      }
    }

    for (let i = this.castaways.length - 1; i >= 0; i--) {
      const swimmer = this.castaways[i];
      swimmer.elapsed += dt;

      if (swimmer.reachedShore) {
        swimmer.waveVx = 0;
        swimmer.waveVy = 0;
        swimmer.rippleGraphic.clear();
        if (swimmer.hasDinghy && swimmer.dinghySprite && swimmer.beachedAngle !== undefined) {
          swimmer.dinghySprite.rotation = swimmer.beachedAngle + Math.sin(swimmer.elapsed * 1.5) * 0.025;
          swimmer.sprite.rotation = swimmer.dinghySprite.rotation;
        }
        swimmer.container.position.set(swimmer.x, swimmer.y);
        continue;
      }

      const waveSpeed = Math.hypot(swimmer.waveVx, swimmer.waveVy);
      if (waveSpeed > 0.1) {
        swimmer.x += swimmer.waveVx * dt;
        swimmer.y += swimmer.waveVy * dt;
        clampAwayFromIslandInterior(swimmer);

        const decay = Math.exp(-4.5 * dt);
        swimmer.waveVx *= decay;
        swimmer.waveVy *= decay;
        if (waveSpeed < 0.5) {
          swimmer.waveVx = 0;
          swimmer.waveVy = 0;
        }
      }

      const dx = swimmer.targetX - swimmer.x;
      const dy = swimmer.targetY - swimmer.y;
      const dist = Math.hypot(dx, dy);

      const swimSpeed = swimmer.hasDinghy ? 36 : 28;
      if (dist <= 4 || dist <= swimSpeed * dt) {
        swimmer.reachedShore = true;
        swimmer.x = swimmer.targetX;
        swimmer.y = swimmer.targetY;
        swimmer.waveVx = 0;
        swimmer.waveVy = 0;
        swimmer.rippleGraphic.clear();
        swimmer.container.position.set(swimmer.targetX, swimmer.targetY);
        swimmer.container.alpha = 1.0;
        if (swimmer.hasDinghy && swimmer.dinghySprite) {
          swimmer.beachedAngle = swimmer.dinghySprite.rotation;
        } else {
          swimmer.sprite.rotation = Math.sin(swimmer.x * 0.13) * 0.45;
        }
        continue;
      } else {
        const dirX = dx / dist;
        const dirY = dy / dist;
        const perpX = -dirY;
        const perpY = dirX;

        swimmer.x += dirX * swimSpeed * dt;
        swimmer.y += dirY * swimSpeed * dt;
        clampAwayFromIslandInterior(swimmer);

        const oscillation = swimmer.hasDinghy ? Math.sin(swimmer.elapsed * 4) * 1.5 : Math.sin(swimmer.elapsed * 6) * 3;
        swimmer.container.position.set(
          swimmer.x + perpX * oscillation,
          swimmer.y + perpY * oscillation
        );

        let heading = Math.atan2(dirX, -dirY);
        if (waveSpeed > 15) {
          heading = Math.atan2(swimmer.waveVx, -swimmer.waveVy);
        }

        if (swimmer.hasDinghy) {
          if (swimmer.dinghySprite) {
            swimmer.dinghySprite.rotation = heading;
          }
          swimmer.sprite.rotation = heading;

          swimmer.rippleGraphic.clear();
          const wakePhase = (swimmer.elapsed % 0.6) / 0.6;
          const wakeRadius = 3 + wakePhase * 5;
          const wakeAlpha = (1 - wakePhase) * 0.45;
          swimmer.rippleGraphic.circle(0, 8, wakeRadius);
          swimmer.rippleGraphic.stroke({ width: 1.0, color: 0xffffff, alpha: wakeAlpha });
        } else {
          swimmer.sprite.rotation = heading + Math.sin(swimmer.elapsed * 6) * 0.15;

          swimmer.rippleGraphic.clear();
          const ripplePhase = (swimmer.elapsed % 0.7) / 0.7;
          const rippleRadius = 4 + ripplePhase * 6;
          const rippleAlpha = (1 - ripplePhase) * 0.6;
          swimmer.rippleGraphic.circle(0, 0, rippleRadius);
          swimmer.rippleGraphic.stroke({ width: 1.2, color: 0xffffff, alpha: rippleAlpha });
        }

        if (waveSpeed > 15) {
          swimmer.rippleGraphic.circle(0, 0, swimmer.hasDinghy ? 14 : 9);
          swimmer.rippleGraphic.stroke({ width: 1.5, color: 0xffffff, alpha: Math.min(0.75, waveSpeed / 80) });
        }
      }

      if (!swimmer.reachedShore) {
        if (swimmer.elapsed > swimmer.maxLifetime - 1.5) {
          const remaining = swimmer.maxLifetime - swimmer.elapsed;
          swimmer.container.alpha = Math.max(0, Math.min(1, remaining / 1.5));
        }

        if (swimmer.elapsed >= swimmer.maxLifetime || swimmer.container.alpha <= 0.01) {
          this.castawayLayer.removeChild(swimmer.container);
          swimmer.container.destroy({ children: true });
          this.castaways.splice(i, 1);
        }
      }
    }

    const shoreSurvivors = this.castaways.filter((c) => c.reachedShore);
    if (shoreSurvivors.length > 1) {
      for (let a = 0; a < shoreSurvivors.length; a++) {
        for (let b = a + 1; b < shoreSurvivors.length; b++) {
          const ca = shoreSurvivors[a];
          const cb = shoreSurvivors[b];
          const dx = cb.x - ca.x;
          const dy = cb.y - ca.y;
          const distSq = dx * dx + dy * dy;
          const minDist = (ca.hasDinghy || cb.hasDinghy) ? 34 : 20;
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 0.01;
            const overlap = (minDist - dist) * 0.5;
            const normX = dx / dist;
            const normY = dy / dist;

            ca.x -= normX * overlap;
            ca.y -= normY * overlap;
            cb.x += normX * overlap;
            cb.y += normY * overlap;

            clampAwayFromIslandInterior(ca);
            clampAwayFromIslandInterior(cb);

            ca.targetX = ca.x;
            ca.targetY = ca.y;
            cb.targetX = cb.x;
            cb.targetY = cb.y;

            ca.container.position.set(ca.x, ca.y);
            cb.container.position.set(cb.x, cb.y);
          }
        }
      }
    }

    if (shoreSurvivors.length > 10) {
      const oldest = shoreSurvivors[0];
      const idx = this.castaways.indexOf(oldest);
      if (idx !== -1) {
        this.castawayLayer.removeChild(oldest.container);
        oldest.container.destroy({ children: true });
        this.castaways.splice(idx, 1);
      }
    }
  }

  public clear(): void {
    for (const fx of this.activeEffects) {
      this.effectLayer.removeChild(fx.sprite);
      fx.sprite.destroy();
    }
    this.activeEffects = [];

    for (const debris of this.woodDebrisList) {
      this.castawayLayer.removeChild(debris.sprite);
      debris.sprite.destroy();
    }
    this.woodDebrisList = [];

    for (const swimmer of this.castaways) {
      this.castawayLayer.removeChild(swimmer.container);
      swimmer.container.destroy({ children: true });
    }
    this.castaways = [];
  }
}
