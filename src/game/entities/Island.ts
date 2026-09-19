import { Container } from 'pixi.js';

export type IslandType = 'FORTRESS_PENINSULA' | 'SOUTHEAST_COAST' | 'SAND_SPIT' | 'NATURAL';

export type TileColliderType = 'box' | 'corner_tl' | 'corner_tr' | 'corner_bl' | 'corner_br';

export interface IslandCollider {
  x: number;
  y: number;
  radius: number;
}

export interface TileBoxCollider {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  type?: TileColliderType;
  arcRadius?: number;
}

export interface IslandData {
  id: string;
  x?: number;
  y?: number;
  radius?: number;
  type?: IslandType;
  extraColliders?: IslandCollider[];
  tileColliders?: TileBoxCollider[];
  solidGrid?: boolean[][];
  cols?: number;
  rows?: number;
  tileSize?: number;
}

export class Island {
  public readonly id: string;
  public readonly x: number;
  public readonly y: number;
  public readonly radius: number;
  public readonly type: IslandType;
  public readonly colliders: IslandCollider[];
  public readonly tileColliders: TileBoxCollider[];
  public readonly solidGrid: boolean[][];
  public readonly tileGrid: (TileBoxCollider | null)[][];
  public readonly cols: number;
  public readonly rows: number;
  public readonly tileSize: number;
  public readonly container: Container;

  constructor(data: IslandData) {
    this.id = data.id;
    this.x = data.x ?? 0;
    this.y = data.y ?? 0;
    this.radius = data.radius ?? 0;
    this.type = data.type || 'NATURAL';
    this.tileSize = data.tileSize ?? 64;
    this.cols = data.cols ?? 14;
    this.rows = data.rows ?? 8;
    this.tileColliders = data.tileColliders ? [...data.tileColliders] : [];
    this.solidGrid = data.solidGrid ? data.solidGrid : [];
    this.tileGrid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));

    this.colliders = [];
    if (data.radius && data.radius > 0) {
      this.colliders.push({ x: this.x, y: this.y, radius: data.radius });
    }
    if (data.extraColliders) {
      this.colliders.push(...data.extraColliders);
    }

    if (this.solidGrid.length === 0) {
      this.solidGrid = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    }

    for (const box of this.tileColliders) {
      const c = Math.floor(box.minX / this.tileSize);
      const r = Math.floor(box.minY / this.tileSize);
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        this.tileGrid[r][c] = box;
        this.solidGrid[r][c] = true;
      }
    }

    this.container = new Container();
    this.container.position.set(this.x, this.y);
  }

  private testCornerCollision(
    x: number,
    y: number,
    r: number,
    tile: TileBoxCollider
  ): { collides: boolean; normalX: number; normalY: number; depth: number } | null {
    const type = tile.type;
    if (!type || type === 'box') return null;

    const arcRadius = tile.arcRadius ?? 60;
    let cx = 0;
    let cy = 0;
    let inWaterCorner = false;
    let defNormX = 0;
    let defNormY = 0;

    switch (type) {
      case 'corner_tl':
        cx = tile.maxX;
        cy = tile.maxY;
        inWaterCorner = x <= tile.maxX && y <= tile.maxY;
        defNormX = -Math.SQRT1_2;
        defNormY = -Math.SQRT1_2;
        break;
      case 'corner_tr':
        cx = tile.minX;
        cy = tile.maxY;
        inWaterCorner = x >= tile.minX && y <= tile.maxY;
        defNormX = Math.SQRT1_2;
        defNormY = -Math.SQRT1_2;
        break;
      case 'corner_bl':
        cx = tile.maxX;
        cy = tile.minY;
        inWaterCorner = x <= tile.maxX && y >= tile.minY;
        defNormX = -Math.SQRT1_2;
        defNormY = Math.SQRT1_2;
        break;
      case 'corner_br':
        cx = tile.minX;
        cy = tile.minY;
        inWaterCorner = x >= tile.minX && y >= tile.minY;
        defNormX = Math.SQRT1_2;
        defNormY = Math.SQRT1_2;
        break;
    }

    if (!inWaterCorner) {
      return null;
    }

    const dx = x - cx;
    const dy = y - cy;
    const distSq = dx * dx + dy * dy;
    const minDist = arcRadius + r;

    if (distSq >= minDist * minDist) {
      return { collides: false, normalX: 0, normalY: 0, depth: 0 };
    }

    const dist = Math.sqrt(distSq);
    if (dist > 0.0001) {
      return {
        collides: true,
        normalX: dx / dist,
        normalY: dy / dist,
        depth: minDist - dist,
      };
    }

    return {
      collides: true,
      normalX: defNormX,
      normalY: defNormY,
      depth: minDist,
    };
  }

  public collidesWithCircle(x: number, y: number, otherRadius: number): boolean {
    if (this.tileColliders.length > 0) {
      const minCol = Math.max(0, Math.floor((x - otherRadius) / this.tileSize));
      const maxCol = Math.min(this.cols - 1, Math.floor((x + otherRadius) / this.tileSize));
      const minRow = Math.max(0, Math.floor((y - otherRadius) / this.tileSize));
      const maxRow = Math.min(this.rows - 1, Math.floor((y + otherRadius) / this.tileSize));

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const tile = this.tileGrid[r]?.[c];
          if (!tile) continue;

          if (tile.type && tile.type !== 'box') {
            const cornerRes = this.testCornerCollision(x, y, otherRadius, tile);
            if (cornerRes !== null) {
              if (cornerRes.collides) return true;
              continue;
            }
          }

          const minX = tile.minX;
          const minY = tile.minY;
          const maxX = tile.maxX;
          const maxY = tile.maxY;

          const closestX = Math.max(minX, Math.min(x, maxX));
          const closestY = Math.max(minY, Math.min(y, maxY));
          const dx = x - closestX;
          const dy = y - closestY;

          if (dx * dx + dy * dy < otherRadius * otherRadius) {
            return true;
          }
        }
      }
    }

    for (const c of this.colliders) {
      const dx = x - c.x;
      const dy = y - c.y;
      const minDistance = c.radius + otherRadius;
      if (dx * dx + dy * dy < minDistance * minDistance) {
        return true;
      }
    }

    return false;
  }

  public getPenetration(x: number, y: number, otherRadius: number): { normalX: number; normalY: number; depth: number } | null {
    let deepest: { normalX: number; normalY: number; depth: number } | null = null;

    if (this.tileColliders.length > 0) {
      const minCol = Math.max(0, Math.floor((x - otherRadius) / this.tileSize));
      const maxCol = Math.min(this.cols - 1, Math.floor((x + otherRadius) / this.tileSize));
      const minRow = Math.max(0, Math.floor((y - otherRadius) / this.tileSize));
      const maxRow = Math.min(this.rows - 1, Math.floor((y + otherRadius) / this.tileSize));

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const tile = this.tileGrid[r]?.[c];
          if (!tile) continue;

          if (tile.type && tile.type !== 'box') {
            const cornerRes = this.testCornerCollision(x, y, otherRadius, tile);
            if (cornerRes !== null) {
              if (cornerRes.collides && (!deepest || cornerRes.depth > deepest.depth)) {
                deepest = {
                  normalX: cornerRes.normalX,
                  normalY: cornerRes.normalY,
                  depth: cornerRes.depth,
                };
              }
              continue;
            }
          }

          const minX = tile.minX;
          const minY = tile.minY;
          const maxX = tile.maxX;
          const maxY = tile.maxY;

          const closestX = Math.max(minX, Math.min(x, maxX));
          const closestY = Math.max(minY, Math.min(y, maxY));
          const dx = x - closestX;
          const dy = y - closestY;
          const distSq = dx * dx + dy * dy;

          if (distSq < otherRadius * otherRadius) {
            let normalX = 0;
            let normalY = 0;
            let depth = 0;

            if (distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              normalX = dx / dist;
              normalY = dy / dist;
              depth = otherRadius - dist;
            } else {
              const dLeft = x - minX;
              const dRight = maxX - x;
              const dTop = y - minY;
              const dBottom = maxY - y;
              const minD = Math.min(dLeft, dRight, dTop, dBottom);

              if (minD === dLeft) {
                normalX = -1;
                normalY = 0;
                depth = dLeft + otherRadius;
              } else if (minD === dRight) {
                normalX = 1;
                normalY = 0;
                depth = dRight + otherRadius;
              } else if (minD === dTop) {
                normalX = 0;
                normalY = -1;
                depth = dTop + otherRadius;
              } else {
                normalX = 0;
                normalY = 1;
                depth = dBottom + otherRadius;
              }
            }

            if (!deepest || depth > deepest.depth) {
              deepest = { normalX, normalY, depth };
            }
          }
        }
      }
    }

    for (const c of this.colliders) {
      const dx = x - c.x;
      const dy = y - c.y;
      const distance = Math.hypot(dx, dy);
      const minDistance = c.radius + otherRadius;

      if (distance < minDistance && distance > 0.0001) {
        const depth = minDistance - distance;
        if (!deepest || depth > deepest.depth) {
          deepest = {
            normalX: dx / distance,
            normalY: dy / distance,
            depth,
          };
        }
      }
    }

    return deepest;
  }
}
