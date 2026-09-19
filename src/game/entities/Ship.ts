import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { AssetManager } from '../core/AssetManager';

export abstract class Ship {
  public x: number;
  public y: number;
  public rotation: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public currentSpeed: number = 0;

  public health: number;
  public readonly maxHealth: number;
  public readonly collisionRadius: number;
  public isDead: boolean = false;
  public hitCount: number = 0;
  public firstHitTime: number = 0;

  public readonly container: Container;
  protected sprite: Sprite;
  protected healthBarGraphic: Graphics | null = null;
  protected showHealthBar: boolean;

  protected fireContainer: Container;
  protected fireLeft: Sprite | null = null;
  protected fireRight: Sprite | null = null;
  protected fireCenter: Sprite | null = null;

  constructor(
    texture: Texture,
    x: number,
    y: number,
    maxHealth: number,
    collisionRadius: number,
    showHealthBar: boolean = true
  ) {
    this.x = x;
    this.y = y;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.collisionRadius = collisionRadius;
    this.showHealthBar = showHealthBar;

    this.container = new Container();
    this.container.position.set(this.x, this.y);

    this.fireContainer = new Container();
    this.container.addChildAt(this.fireContainer, 0);
    this.setupDamageVisuals();

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.scale.set(0.65);
    this.container.addChild(this.sprite);

    if (this.showHealthBar) {
      this.healthBarGraphic = new Graphics();
      this.healthBarGraphic.position.set(0, -this.collisionRadius - 16);
      this.container.addChild(this.healthBarGraphic);
      this.updateHealthBar();
    }
  }

  protected setupDamageVisuals(): void {
    const assets = AssetManager.getInstance();

    this.fireLeft = new Sprite(assets.getTexture('fire_1'));
    this.fireLeft.anchor.set(0.5, 0.85);
    this.fireLeft.position.set(-14, -10);
    this.fireLeft.scale.set(0.75);
    this.fireLeft.visible = false;
    this.fireContainer.addChild(this.fireLeft);

    this.fireRight = new Sprite(assets.getTexture('fire_2'));
    this.fireRight.anchor.set(0.5, 0.85);
    this.fireRight.position.set(13, -16);
    this.fireRight.scale.set(0.65);
    this.fireRight.visible = false;
    this.fireContainer.addChild(this.fireRight);

    this.fireCenter = new Sprite(assets.getTexture('fire_1'));
    this.fireCenter.anchor.set(0.5, 0.9);
    this.fireCenter.position.set(-2, -22);
    this.fireCenter.scale.set(0.85);
    this.fireCenter.visible = false;
    this.fireContainer.addChild(this.fireCenter);
  }

  public updateDamageVisuals(): void {
    if (this.isDead) {
      this.fireContainer.visible = false;
      return;
    }

    this.fireContainer.rotation = this.rotation;

    const hpPercent = this.health / this.maxHealth;
    const now = Date.now();

    if (this.fireLeft) {
      this.fireLeft.visible = hpPercent < 0.65;
      if (this.fireLeft.visible) {
        const pulse = Math.sin(now * 0.011) * 0.15;
        this.fireLeft.scale.set(0.7 + pulse, 0.75 + pulse * 1.2);
        this.fireLeft.rotation = Math.sin(now * 0.008) * 0.2 - 0.2;
      }
    }

    if (this.fireRight) {
      this.fireRight.visible = hpPercent < 0.45;
      if (this.fireRight.visible) {
        const pulse = Math.cos(now * 0.013) * 0.15;
        this.fireRight.scale.set(0.6 + pulse, 0.65 + pulse * 1.2);
        this.fireRight.rotation = Math.cos(now * 0.009) * 0.2 + 0.2;
      }
    }

    if (this.fireCenter) {
      this.fireCenter.visible = hpPercent < 0.25;
      if (this.fireCenter.visible) {
        const pulse = Math.sin(now * 0.015) * 0.2;
        this.fireCenter.scale.set(0.8 + pulse, 0.9 + pulse * 1.3);
        this.fireCenter.rotation = Math.sin(now * 0.01) * 0.15;
      }
    }
  }

  public setTexture(texture: Texture): void {
    this.sprite.texture = texture;
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return true;

    if (this.hitCount === 0) {
      this.firstHitTime = performance.now();
    }
    this.hitCount++;
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();

    this.flashDamage();

    if (this.health <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  private flashDamage(): void {
    this.sprite.tint = 0xff5555;
    setTimeout(() => {
      if (!this.isDead) {
        this.sprite.tint = 0xffffff;
      }
    }, 100);
  }

  protected updateHealthBar(): void {
    if (!this.healthBarGraphic || !this.showHealthBar) return;

    this.healthBarGraphic.clear();

    const barWidth = 40;
    const barHeight = 8;
    const halfWidth = barWidth / 2;

    this.healthBarGraphic.roundRect(-halfWidth - 2, -barHeight / 2 - 2, barWidth + 4, barHeight + 4, 5);
    this.healthBarGraphic.fill({ color: 0x2b1700 });
    this.healthBarGraphic.stroke({ width: 2, color: 0xc8963e });

    this.healthBarGraphic.roundRect(-halfWidth, -barHeight / 2, barWidth, barHeight, 3);
    this.healthBarGraphic.fill({ color: 0x141414 });

    const pct = Math.max(0, Math.min(1, this.health / this.maxHealth));
    const innerWidth = (barWidth - 4) * pct;

    if (pct > 0) {
      this.healthBarGraphic.roundRect(-halfWidth + 2, -barHeight / 2 + 2, innerWidth, barHeight - 4, 2);
      this.healthBarGraphic.fill({ color: 0xd90429 });
    }
  }

  public turnIntoWreck(wreckTexture: Texture): void {
    this.isDead = true;
    this.vx = 0;
    this.vy = 0;
    this.currentSpeed = 0;

    if (this.healthBarGraphic) {
      this.container.removeChild(this.healthBarGraphic);
      this.healthBarGraphic.destroy();
      this.healthBarGraphic = null;
    }

    if (this.fireContainer) {
      this.fireContainer.visible = false;
      this.fireContainer.removeChildren();
    }

    this.sprite.texture = wreckTexture;
    this.sprite.tint = 0x707070;
    this.sprite.alpha = 0.75;
    this.sprite.scale.set(0.55);
  }

  public abstract update(dt: number): void;

  public destroy(): void {
    this.isDead = true;
    this.container.destroy({ children: true });
  }
}
