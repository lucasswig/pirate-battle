import { Ship } from './Ship';
import { GameplayConfig } from '../config/gameConfig';
import { AssetManager } from '../core/AssetManager';
import { PlayerShip } from './PlayerShip';

export class EnemyChaser extends Ship {
  private config: GameplayConfig;
  private isDamagedTexture: boolean = false;

  constructor(x: number, y: number, config: GameplayConfig) {
    const assets = AssetManager.getInstance();
    const texture = assets.getTexture('ship_chaser_intact');

    super(texture, x, y, config.chaserHealth, config.chaserCollisionRadius, true);
    this.config = config;
  }

  public override takeDamage(amount: number): boolean {
    const dead = super.takeDamage(amount);
    const isDamaged = this.health / this.maxHealth < 0.5;
    if (isDamaged !== this.isDamagedTexture) {
      this.isDamagedTexture = isDamaged;
      const assets = AssetManager.getInstance();
      this.setTexture(
        assets.getTexture(isDamaged ? 'ship_chaser_damaged' : 'ship_chaser_intact')
      );
    }
    return dead;
  }

  public updateAI(player: PlayerShip, dt: number): void {
    if (this.isDead || player.isDead) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const targetAngle = Math.atan2(dx, -dy);

    let angleDiff = targetAngle - this.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxTurn = this.config.chaserTurnSpeed * dt;
    this.rotation += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

    this.currentSpeed = this.config.chaserSpeed;
    const dirX = Math.sin(this.rotation);
    const dirY = -Math.cos(this.rotation);

    this.vx = dirX * this.currentSpeed;
    this.vy = dirY * this.currentSpeed;
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
