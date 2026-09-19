import { Container, Graphics, Sprite } from 'pixi.js';
import { AssetManager } from '../core/AssetManager';

export type Faction = 'PLAYER' | 'ENEMY';

export class Projectile {
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public dirX: number = 0;
  public dirY: number = 0;
  public distanceTraveled: number = 0;
  public damage: number = 0;
  public collisionRadius: number = 6;
  public faction: Faction = 'PLAYER';
  public lifetimeRemaining: number = 0;
  public isActive: boolean = false;

  public readonly container: Container;
  private trailGraphic: Graphics;
  private sprite: Sprite;

  constructor() {
    const assets = AssetManager.getInstance();
    const texture = assets.getTexture('cannon_ball');

    this.container = new Container();
    this.container.visible = false;

    this.trailGraphic = new Graphics();
    this.container.addChild(this.trailGraphic);

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(1.0);
    this.container.addChild(this.sprite);
  }

  public spawn(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    speed: number,
    damage: number,
    lifetime: number,
    radius: number,
    faction: Faction
  ): void {
    this.x = x;
    this.y = y;
    this.dirX = dirX;
    this.dirY = dirY;
    this.vx = dirX * speed;
    this.vy = dirY * speed;
    this.damage = damage;
    this.collisionRadius = radius;
    this.lifetimeRemaining = lifetime;
    this.faction = faction;
    this.distanceTraveled = 0;
    this.isActive = true;

    this.container.position.set(this.x, this.y);
    this.container.visible = true;
    this.updateTrail();
  }

  private updateTrail(): void {
    this.trailGraphic.clear();
    const trailLen = Math.min(this.distanceTraveled, 220);
    if (trailLen < 5) return;

    const bx = -this.dirX * trailLen;
    const by = -this.dirY * trailLen;
    const nx = -this.dirY;
    const ny = this.dirX;

    const outerFront = 7.5;
    const outerBack = 1.8;
    this.trailGraphic.poly([
      nx * outerFront,
      ny * outerFront,
      bx + nx * outerBack,
      by + ny * outerBack,
      bx - nx * outerBack,
      by - ny * outerBack,
      -nx * outerFront,
      -ny * outerFront,
    ]);
    this.trailGraphic.fill({ color: 0xcbeeff, alpha: 0.30 });

    const coreFront = 3.2;
    const coreBack = 1.0;
    this.trailGraphic.poly([
      nx * coreFront,
      ny * coreFront,
      bx + nx * coreBack,
      by + ny * coreBack,
      bx - nx * coreBack,
      by - ny * coreBack,
      -nx * coreFront,
      -ny * coreFront,
    ]);
    this.trailGraphic.fill({ color: 0xffffff, alpha: 0.92 });

    this.trailGraphic.circle(0, 0, 7.5);
    this.trailGraphic.fill({ color: 0xffffff, alpha: 0.45 });
    this.trailGraphic.circle(0, 0, 11);
    this.trailGraphic.fill({ color: 0xb2ebf2, alpha: 0.20 });
  }

  public update(dt: number): boolean {
    if (!this.isActive) return false;

    this.lifetimeRemaining -= dt;
    if (this.lifetimeRemaining <= 0) {
      this.deactivate();
      return false;
    }

    const stepX = this.vx * dt;
    const stepY = this.vy * dt;
    this.x += stepX;
    this.y += stepY;
    this.distanceTraveled += Math.hypot(stepX, stepY);

    this.container.position.set(this.x, this.y);
    this.updateTrail();

    return true;
  }

  public deactivate(): void {
    this.isActive = false;
    this.container.visible = false;
    this.trailGraphic.clear();
  }

  public destroy(): void {
    this.deactivate();
    this.container.destroy({ children: true });
  }
}
