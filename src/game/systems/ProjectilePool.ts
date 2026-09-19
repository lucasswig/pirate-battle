import { Container } from 'pixi.js';
import { Projectile } from '../entities/Projectile';

export class ProjectilePool {
  private pool: Projectile[] = [];
  private bulletLayer: Container;

  constructor(bulletLayer: Container, initialCapacity: number = 100) {
    this.bulletLayer = bulletLayer;
    this.expand(initialCapacity);
  }

  private expand(count: number): void {
    for (let i = 0; i < count; i++) {
      const proj = new Projectile();
      this.pool.push(proj);
      this.bulletLayer.addChild(proj.container);
    }
  }

  public acquire(): Projectile {
    for (const proj of this.pool) {
      if (!proj.isActive) {
        return proj;
      }
    }

    const newProj = new Projectile();
    this.pool.push(newProj);
    this.bulletLayer.addChild(newProj.container);
    return newProj;
  }

  public getActiveProjectiles(): Projectile[] {
    return this.pool.filter((p) => p.isActive);
  }

  public clearAll(): void {
    for (const proj of this.pool) {
      proj.deactivate();
    }
  }

  public destroy(): void {
    for (const proj of this.pool) {
      proj.destroy();
    }
    this.pool = [];
  }
}
