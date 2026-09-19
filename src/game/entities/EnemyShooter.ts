import { Ship } from './Ship';
import { GameplayConfig } from '../config/gameConfig';
import { AssetManager } from '../core/AssetManager';
import { PlayerShip } from './PlayerShip';

export class EnemyShooter extends Ship {
  private config: GameplayConfig;
  private isDamagedTexture: boolean = false;
  public fireCooldownRemaining: number = 0;

  constructor(x: number, y: number, config: GameplayConfig) {
    const assets = AssetManager.getInstance();
    const texture = assets.getTexture('ship_shooter_intact');

    super(texture, x, y, config.shooterHealth, config.shooterCollisionRadius, true);
    this.config = config;
    this.fireCooldownRemaining = 1.0;
  }

  public override takeDamage(amount: number): boolean {
    const dead = super.takeDamage(amount);
    const isDamaged = this.health / this.maxHealth < 0.5;
    if (isDamaged !== this.isDamagedTexture) {
      this.isDamagedTexture = isDamaged;
      const assets = AssetManager.getInstance();
      this.setTexture(
        assets.getTexture(isDamaged ? 'ship_shooter_damaged' : 'ship_shooter_intact')
      );
    }
    return dead;
  }

  public updateAI(
    player: PlayerShip,
    dt: number,
    onFire: (x: number, y: number, dirX: number, dirY: number) => void
  ): void {
    if (this.isDead || player.isDead) return;

    this.fireCooldownRemaining = Math.max(0, this.fireCooldownRemaining - dt);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    const targetAngle = Math.atan2(dx, -dy);

    let angleDiff = targetAngle - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxTurn = this.config.shooterTurnSpeed * dt;
    this.rotation += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

    if (distance > this.config.shooterPreferredDistance + 30) {
      this.currentSpeed = this.config.shooterSpeed;
    } else if (distance > this.config.shooterPreferredDistance) {
      const ratio = (distance - this.config.shooterPreferredDistance) / 30;
      this.currentSpeed = this.config.shooterSpeed * ratio;
    } else {
      this.currentSpeed = 0;
    }
    this.currentSpeed = Math.max(0, this.currentSpeed);

    const dirX = Math.sin(this.rotation);
    const dirY = -Math.cos(this.rotation);

    this.vx = dirX * this.currentSpeed;
    this.vy = dirY * this.currentSpeed;

    if (
      this.fireCooldownRemaining <= 0 &&
      distance <= this.config.shooterAttackRange &&
      Math.abs(angleDiff) < 0.35
    ) {
      const bowDistance = this.collisionRadius + 22;
      const spawnX = this.x + dirX * bowDistance;
      const spawnY = this.y + dirY * bowDistance;

      onFire(spawnX, spawnY, dirX, dirY);
      this.fireCooldownRemaining = this.config.shooterFireCooldown;
    }
  }

  public update(dt: number): void {
    if (this.isDead) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.container.position.set(this.x, this.y);
    this.sprite.rotation = this.rotation;
    this.updateDamageVisuals();
  }
}
