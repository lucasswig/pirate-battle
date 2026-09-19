import { GameplayConfig } from '../config/gameConfig';
import { CollisionSystem } from './CollisionSystem';
import { PlayerShip } from '../entities/PlayerShip';
import { EnemyChaser } from '../entities/EnemyChaser';
import { EnemyShooter } from '../entities/EnemyShooter';
import { Ship } from '../entities/Ship';

export class SpawnSystem {
  private config: GameplayConfig;
  private collisionSystem: CollisionSystem;
  private timer: number = 0;
  private spawnCounter: number = 0;

  constructor(config: GameplayConfig, collisionSystem: CollisionSystem) {
    this.config = config;
    this.collisionSystem = collisionSystem;
    this.timer = 1.0;
  }

  public update(
    dt: number,
    player: PlayerShip,
    currentEnemiesCount: number,
    onSpawn: (enemy: Ship) => void
  ): void {
    if (player.isDead) return;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.config.enemySpawnIntervalSeconds;

      if (currentEnemiesCount < 12) {
        const enemy = this.createRandomEnemy(player);
        if (enemy) {
          onSpawn(enemy);
        }
      }
    }
  }

  private createRandomEnemy(player: PlayerShip): Ship | null {
    const coords = this.findValidSpawnCoords(player);
    if (!coords) return null;

    this.spawnCounter++;
    const isChaser = this.spawnCounter % 2 === 1;

    if (isChaser) {
      return new EnemyChaser(coords.x, coords.y, this.config);
    } else {
      return new EnemyShooter(coords.x, coords.y, this.config);
    }
  }

  private findValidSpawnCoords(player: PlayerShip): { x: number; y: number } | null {
    const minDistanceFromPlayer = 220;
    const margin = 35;

    for (let attempt = 0; attempt < 35; attempt++) {
      const x = margin + Math.random() * (this.config.arenaWidth - margin * 2);
      const y = margin + Math.random() * (this.config.arenaHeight - margin * 2);

      const dx = x - player.x;
      const dy = y - player.y;
      const distToPlayer = Math.hypot(dx, dy);

      if (distToPlayer < minDistanceFromPlayer) {
        continue;
      }

      if (this.collisionSystem.isPointCollidingWithIslands(x, y, 25)) {
        continue;
      }

      return { x, y };
    }

    return null;
  }

  public reset(): void {
    this.timer = 1.5;
    this.spawnCounter = 0;
  }
}
