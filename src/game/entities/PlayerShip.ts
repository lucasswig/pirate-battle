import { Ship } from './Ship';
import { GameplayConfig } from '../config/gameConfig';
import { AssetManager } from '../core/AssetManager';
import { InputState } from '../systems/InputManager';

export class PlayerShip extends Ship {
  private config: GameplayConfig;
  private isDamagedTexture: boolean = false;

  public frontCannonCooldownRemaining: number = 0;
  public broadsideLeftCooldownRemaining: number = 0;
  public broadsideRightCooldownRemaining: number = 0;

  constructor(x: number, y: number, config: GameplayConfig) {
    const assets = AssetManager.getInstance();
    const texture = assets.getTexture('ship_player_intact');

    super(texture, x, y, config.playerMaxHealth, config.playerCollisionRadius, false);
    this.config = config;
    this.rotation = 0;
  }

  public updateInput(input: InputState, dt: number): void {
    if (this.isDead) return;

    if (input.turnLeft) {
      this.rotation -= this.config.playerTurnSpeed * dt;
    }
    if (input.turnRight) {
      this.rotation += this.config.playerTurnSpeed * dt;
    }

    const accel = 380;
    if (input.forward) {
      this.currentSpeed = Math.min(
        this.config.playerMoveSpeed,
        this.currentSpeed + accel * dt
      );
    } else {
      const dragFactor = Math.pow(this.config.playerDrag, dt * 60);
      this.currentSpeed = Math.max(0, this.currentSpeed * dragFactor);
      if (this.currentSpeed < 0.5) {
        this.currentSpeed = 0;
      }
    }

    this.frontCannonCooldownRemaining = Math.max(0, this.frontCannonCooldownRemaining - dt);
    this.broadsideLeftCooldownRemaining = Math.max(0, this.broadsideLeftCooldownRemaining - dt);
    this.broadsideRightCooldownRemaining = Math.max(0, this.broadsideRightCooldownRemaining - dt);
  }

  public update(dt: number): void {
    if (this.isDead) return;

    const dirX = Math.sin(this.rotation);
    const dirY = -Math.cos(this.rotation);

    this.vx = dirX * this.currentSpeed;
    this.vy = dirY * this.currentSpeed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.container.position.set(this.x, this.y);
    this.sprite.rotation = this.rotation;

    this.updateDamageVisuals();
  }

  public override takeDamage(amount: number): boolean {
    const dead = super.takeDamage(amount);
    this.checkDamageTexture();
    return dead;
  }

  private checkDamageTexture(): void {
    const isDamaged = this.health / this.maxHealth < 0.5;
    if (isDamaged !== this.isDamagedTexture) {
      this.isDamagedTexture = isDamaged;
      const assets = AssetManager.getInstance();
      this.setTexture(
        assets.getTexture(isDamaged ? 'ship_player_damaged' : 'ship_player_intact')
      );
    }
  }

  public getBowPosition(): { x: number; y: number; dirX: number; dirY: number } {
    const dirX = Math.sin(this.rotation);
    const dirY = -Math.cos(this.rotation);
    const bowDistance = this.collisionRadius + 14;
    return {
      x: this.x + dirX * bowDistance,
      y: this.y + dirY * bowDistance,
      dirX,
      dirY,
    };
  }

  public getPortPositions(): Array<{ x: number; y: number; dirX: number; dirY: number }> {
    return [0, 1, 2].map((i) => this.getPortGun(i));
  }

  public getPortGun(index: number): { x: number; y: number; dirX: number; dirY: number } {
    const normalX = -Math.cos(this.rotation);
    const normalY = -Math.sin(this.rotation);
    const forwardX = Math.sin(this.rotation);
    const forwardY = -Math.cos(this.rotation);
    const offsets = [-14, 0, 14];
    const offset = offsets[index] ?? 0;
    return {
      x: this.x + normalX * (this.collisionRadius + 8) + forwardX * offset,
      y: this.y + normalY * (this.collisionRadius + 8) + forwardY * offset,
      dirX: normalX,
      dirY: normalY,
    };
  }

  public getStarboardPositions(): Array<{ x: number; y: number; dirX: number; dirY: number }> {
    return [0, 1, 2].map((i) => this.getStarboardGun(i));
  }

  public getStarboardGun(index: number): { x: number; y: number; dirX: number; dirY: number } {
    const normalX = Math.cos(this.rotation);
    const normalY = Math.sin(this.rotation);
    const forwardX = Math.sin(this.rotation);
    const forwardY = -Math.cos(this.rotation);
    const offsets = [-14, 0, 14];
    const offset = offsets[index] ?? 0;
    return {
      x: this.x + normalX * (this.collisionRadius + 8) + forwardX * offset,
      y: this.y + normalY * (this.collisionRadius + 8) + forwardY * offset,
      dirX: normalX,
      dirY: normalY,
    };
  }
}
