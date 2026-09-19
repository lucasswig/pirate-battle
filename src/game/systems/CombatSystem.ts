import { GameplayConfig } from '../config/gameConfig';
import { ProjectilePool } from './ProjectilePool';
import { PlayerShip } from '../entities/PlayerShip';
import { InputState } from './InputManager';
import { Island } from '../entities/Island';
import { Projectile, Faction } from '../entities/Projectile';
import { SoundManager } from '../../services/soundManager';
import { VisualFeedbackSystem } from './VisualFeedbackSystem';

interface ScheduledShot {
  delay: number;
  gunGetter: () => { x: number; y: number; dirX: number; dirY: number } | null;
  angleOffset: number;
  speedMultiplier: number;
  damage: number;
  lifetime: number;
  radius: number;
  faction: Faction;
}

export class CombatSystem {
  private config: GameplayConfig;
  private projectilePool: ProjectilePool;
  private islands: Island[];
  private visualFeedback?: VisualFeedbackSystem;
  private scheduledShots: ScheduledShot[] = [];

  constructor(
    config: GameplayConfig,
    projectilePool: ProjectilePool,
    islands: Island[],
    visualFeedback?: VisualFeedbackSystem
  ) {
    this.config = config;
    this.projectilePool = projectilePool;
    this.islands = islands;
    this.visualFeedback = visualFeedback;
  }

  public setVisualFeedback(visualFeedback: VisualFeedbackSystem): void {
    this.visualFeedback = visualFeedback;
  }

  public handlePlayerCombat(player: PlayerShip, input: InputState): void {
    if (player.isDead) return;

    if (input.fireFront && player.frontCannonCooldownRemaining <= 0) {
      this.fireBowCannon(player);
    }

    if (input.fireBroadsideLeft && player.broadsideLeftCooldownRemaining <= 0) {
      this.firePortBroadside(player);
    }

    if (input.fireBroadsideRight && player.broadsideRightCooldownRemaining <= 0) {
      this.fireStarboardBroadside(player);
    }
  }

  private executeShot(shot: Omit<ScheduledShot, 'delay'>): void {
    const pos = shot.gunGetter();
    if (!pos) return;

    const cosA = Math.cos(shot.angleOffset);
    const sinA = Math.sin(shot.angleOffset);
    const finalDirX = pos.dirX * cosA - pos.dirY * sinA;
    const finalDirY = pos.dirX * sinA + pos.dirY * cosA;

    const finalSpeed = this.config.projectileSpeed * shot.speedMultiplier;
    const proj = this.projectilePool.acquire();

    proj.spawn(
      pos.x,
      pos.y,
      finalDirX,
      finalDirY,
      finalSpeed,
      shot.damage,
      shot.lifetime,
      shot.radius,
      shot.faction
    );

    this.visualFeedback?.spawnMuzzlePuff(pos.x, pos.y, finalDirX, finalDirY);
  }

  private fireBowCannon(player: PlayerShip): void {
    const bow = player.getBowPosition();
    const proj = this.projectilePool.acquire();

    proj.spawn(
      bow.x,
      bow.y,
      bow.dirX,
      bow.dirY,
      this.config.projectileSpeed,
      this.config.projectileDamage,
      this.config.projectileLifetime,
      this.config.projectileCollisionRadius,
      'PLAYER'
    );

    this.visualFeedback?.spawnMuzzlePuff(bow.x, bow.y, bow.dirX, bow.dirY);
    player.frontCannonCooldownRemaining = this.config.frontCannonCooldown;
    SoundManager.playCannonFire();
  }

  private firePortBroadside(player: PlayerShip): void {
    const salvoConfigs = [
      { gunIndex: 2, delay: 0.000, angleOffset: 0.024, speedMult: 1.03 },
      { gunIndex: 1, delay: 0.040, angleOffset: 0.000, speedMult: 0.99 },
      { gunIndex: 0, delay: 0.080, angleOffset: -0.024, speedMult: 0.95 },
    ];

    for (const cfg of salvoConfigs) {
      const shot = {
        delay: cfg.delay,
        gunGetter: () => (player.isDead ? null : player.getPortGun(cfg.gunIndex)),
        angleOffset: cfg.angleOffset + (Math.random() - 0.5) * 0.008,
        speedMultiplier: cfg.speedMult + (Math.random() - 0.5) * 0.02,
        damage: this.config.projectileDamage,
        lifetime: this.config.projectileLifetime,
        radius: this.config.projectileCollisionRadius,
        faction: 'PLAYER' as Faction,
      };

      if (cfg.delay === 0) {
        this.executeShot(shot);
      } else {
        this.scheduledShots.push(shot);
      }
    }

    player.broadsideLeftCooldownRemaining = this.config.broadsideCannonCooldown;
    SoundManager.playBroadside();
  }

  private fireStarboardBroadside(player: PlayerShip): void {
    const salvoConfigs = [
      { gunIndex: 2, delay: 0.000, angleOffset: -0.024, speedMult: 1.03 },
      { gunIndex: 1, delay: 0.040, angleOffset: 0.000, speedMult: 0.99 },
      { gunIndex: 0, delay: 0.080, angleOffset: 0.024, speedMult: 0.95 },
    ];

    for (const cfg of salvoConfigs) {
      const shot = {
        delay: cfg.delay,
        gunGetter: () => (player.isDead ? null : player.getStarboardGun(cfg.gunIndex)),
        angleOffset: cfg.angleOffset + (Math.random() - 0.5) * 0.008,
        speedMultiplier: cfg.speedMult + (Math.random() - 0.5) * 0.02,
        damage: this.config.projectileDamage,
        lifetime: this.config.projectileLifetime,
        radius: this.config.projectileCollisionRadius,
        faction: 'PLAYER' as Faction,
      };

      if (cfg.delay === 0) {
        this.executeShot(shot);
      } else {
        this.scheduledShots.push(shot);
      }
    }

    player.broadsideRightCooldownRemaining = this.config.broadsideCannonCooldown;
    SoundManager.playBroadside();
  }

  public fireEnemyCannon(x: number, y: number, dirX: number, dirY: number): void {
    const proj = this.projectilePool.acquire();
    proj.spawn(
      x,
      y,
      dirX,
      dirY,
      this.config.projectileSpeed * 0.85,
      20,
      2.5,
      this.config.projectileCollisionRadius,
      'ENEMY'
    );
    this.visualFeedback?.spawnMuzzlePuff(x, y, dirX, dirY);
    SoundManager.playCannonFire();
  }

  public updateProjectiles(dt: number): void {
    if (this.scheduledShots.length > 0) {
      for (let i = this.scheduledShots.length - 1; i >= 0; i--) {
        const shot = this.scheduledShots[i];
        shot.delay -= dt;
        if (shot.delay <= 0) {
          this.scheduledShots.splice(i, 1);
          this.executeShot(shot);
          SoundManager.playCannonFire();
        }
      }
    }

    const activeProjectiles = this.projectilePool.getActiveProjectiles();

    for (const proj of activeProjectiles) {
      const stillActive = proj.update(dt);
      if (!stillActive) continue;

      if (
        proj.x < -20 ||
        proj.x > this.config.arenaWidth + 20 ||
        proj.y < -20 ||
        proj.y > this.config.arenaHeight + 20
      ) {
        proj.deactivate();
        continue;
      }

      for (const island of this.islands) {
        if (island.collidesWithCircle(proj.x, proj.y, proj.collisionRadius)) {
          proj.deactivate();
          SoundManager.playWaterHit();
          break;
        }
      }
    }
  }

  public clear(): void {
    this.scheduledShots = [];
  }

  public getActiveProjectiles(): Projectile[] {
    return this.projectilePool.getActiveProjectiles();
  }
}
