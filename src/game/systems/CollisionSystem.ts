import { Island } from '../entities/Island';
import { Ship } from '../entities/Ship';
import { GameplayConfig } from '../config/gameConfig';

export class CollisionSystem {
  private config: GameplayConfig;
  private islands: Island[];

  constructor(config: GameplayConfig, islands: Island[]) {
    this.config = config;
    this.islands = islands;
  }

  public resolveShipCollisions(ship: Ship): void {
    if (ship.isDead) return;

    this.clampToArenaBounds(ship);

    for (let iter = 0; iter < 3; iter++) {
      let collided = false;
      for (const island of this.islands) {
        const penetration = island.getPenetration(ship.x, ship.y, ship.collisionRadius);
        if (penetration && penetration.depth > 0.001) {
          collided = true;
          ship.x += penetration.normalX * penetration.depth;
          ship.y += penetration.normalY * penetration.depth;

          const velDotNormal = ship.vx * penetration.normalX + ship.vy * penetration.normalY;
          if (velDotNormal < 0) {
            ship.vx -= velDotNormal * penetration.normalX;
            ship.vy -= velDotNormal * penetration.normalY;
          }

          ship.container.position.set(ship.x, ship.y);
        }
      }
      if (!collided) break;
    }
  }

  private clampToArenaBounds(ship: Ship): void {
    const margin = ship.collisionRadius + 4;
    let clamped = false;

    if (ship.x < margin) {
      ship.x = margin;
      ship.vx = 0;
      clamped = true;
    } else if (ship.x > this.config.arenaWidth - margin) {
      ship.x = this.config.arenaWidth - margin;
      ship.vx = 0;
      clamped = true;
    }

    if (ship.y < margin) {
      ship.y = margin;
      ship.vy = 0;
      clamped = true;
    } else if (ship.y > this.config.arenaHeight - margin) {
      ship.y = this.config.arenaHeight - margin;
      ship.vy = 0;
      clamped = true;
    }

    if (clamped) {
      ship.container.position.set(ship.x, ship.y);
    }
  }

  public resolveShipVsShipCollisions(player: Ship, enemies: Ship[]): void {
    if (player.isDead) return;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distSq = dx * dx + dy * dy;
      const minDist = player.collisionRadius + enemy.collisionRadius;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const depth = minDist - dist;
        const nx = dist > 0.0001 ? dx / dist : 1;
        const ny = dist > 0.0001 ? dy / dist : 0;

        player.x += nx * (depth * 0.5);
        player.y += ny * (depth * 0.5);
        enemy.x -= nx * (depth * 0.5);
        enemy.y -= ny * (depth * 0.5);

        player.container.position.set(player.x, player.y);
        enemy.container.position.set(enemy.x, enemy.y);
      }
    }
  }

  public isPointCollidingWithIslands(x: number, y: number, radius: number): boolean {
    for (const island of this.islands) {
      if (island.collidesWithCircle(x, y, radius)) {
        return true;
      }
    }
    return false;
  }
}
