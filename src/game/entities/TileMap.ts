import { Container } from 'pixi.js';
import { loadTiledMapAsset, TiledMap as PixiTiledMap } from 'pixi-tiledmap';
import { TilesetTheme } from '../../api/types';
import { TILEMAP_THEMES } from '../config/themeConfig';
import { TileBoxCollider, TileColliderType } from './Island';

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG   = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG   = 0x20000000;
const TILE_FLAGS = FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG;

export function getTileColliderType(rawGid: number): TileColliderType {
  const baseGid = rawGid & ~TILE_FLAGS;
  let type: TileColliderType = 'box';

  if (baseGid === 6) type = 'corner_tl';
  else if (baseGid === 9) type = 'corner_tr';
  else if (baseGid === 54) type = 'corner_bl';
  else if (baseGid === 57) type = 'corner_br';
  else return 'box';

  const h = Boolean(rawGid & FLIPPED_HORIZONTALLY_FLAG);
  const v = Boolean(rawGid & FLIPPED_VERTICALLY_FLAG);
  const d = Boolean(rawGid & FLIPPED_DIAGONALLY_FLAG);

  if (d) {
    if (type === 'corner_tr') type = 'corner_bl';
    else if (type === 'corner_bl') type = 'corner_tr';
  }
  if (h) {
    if (type === 'corner_tl') type = 'corner_tr';
    else if (type === 'corner_tr') type = 'corner_tl';
    else if (type === 'corner_bl') type = 'corner_br';
    else if (type === 'corner_br') type = 'corner_bl';
  }
  if (v) {
    if (type === 'corner_tl') type = 'corner_bl';
    else if (type === 'corner_bl') type = 'corner_tl';
    else if (type === 'corner_tr') type = 'corner_br';
    else if (type === 'corner_br') type = 'corner_tr';
  }

  return type;
}

const DEFAULT_ISLANDS_LAYER_DATA: number[] = [
  3758096422, 2684354585, 37, 23, 40, 23, 40, 41, 0, 0, 0, 0, 0, 0,
  0, 0, 22, 23, 23, 36, 2684354601, 57, 0, 0, 0, 0, 0, 0,
  0, 0, 22, 40, 40, 41, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 54, 55, 56, 57, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 8, 9,
  0, 0, 0, 0, 6, 7, 7, 3221225554, 9, 0, 22, 23, 24, 25,
  0, 0, 0, 0, 22, 23, 23, 24, 52, 7, 53, 39, 40, 41,
];

interface ShorelinePoint {
  x: number;
  y: number;
}

const SHORELINE_CONTOURS: ShorelinePoint[][] = [
  [
    { x: 130, y: 30 },
    { x: 130, y: 195 },
    { x: 133, y: 208 },
    { x: 138, y: 224 },
    { x: 146, y: 240 },
    { x: 160, y: 251 },
    { x: 176, y: 254 },
    { x: 232, y: 254 },
    { x: 280, y: 248 },
    { x: 320, y: 250 },
    { x: 344, y: 243 },
    { x: 360, y: 237 },
    { x: 370, y: 230 },
    { x: 382, y: 206 },
    { x: 382, y: 140 },
    { x: 420, y: 126 },
    { x: 480, y: 110 },
    { x: 480, y: 30 },
  ],
  [
    { x: 258, y: 512 },
    { x: 258, y: 430 },
    { x: 261, y: 414 },
    { x: 266, y: 406 },
    { x: 278, y: 398 },
    { x: 300, y: 390 },
    { x: 328, y: 385 },
    { x: 440, y: 387 },
    { x: 480, y: 386 },
    { x: 512, y: 386 },
    { x: 535, y: 390 },
    { x: 540, y: 410 },
    { x: 540, y: 494 },
    { x: 500, y: 512 },
  ],
  [
    { x: 600, y: 500 },
    { x: 625, y: 475 },
    { x: 641, y: 430 },
    { x: 642, y: 370 },
    { x: 647, y: 346 },
    { x: 656, y: 337 },
    { x: 672, y: 330 },
    { x: 720, y: 320 },
    { x: 784, y: 320 },
    { x: 840, y: 321 },
    { x: 880, y: 340 },
    { x: 896, y: 345 },
  ],
];

export class TileMap {
  public readonly container: Container;
  public tiledMap: PixiTiledMap | null = null;
  public readonly mapWidth: number = 896;
  public readonly mapHeight: number = 512;
  public readonly tileWidth: number = 64;
  public readonly tileHeight: number = 64;
  public readonly cols: number = 14;
  public readonly rows: number = 8;
  private readonly theme: TilesetTheme;
  private islandColliders: TileBoxCollider[] = [];
  private islandGrid: boolean[][] = [];

  constructor(theme: TilesetTheme = 'assets_1') {
    this.container = new Container();
    this.theme = theme;
    this.parseIslandColliders(DEFAULT_ISLANDS_LAYER_DATA);
  }

  public getIslandColliders(): TileBoxCollider[] {
    return this.islandColliders;
  }

  public getIslandGrid(): boolean[][] {
    return this.islandGrid;
  }

  private parseIslandColliders(data: number[]): void {
    this.islandColliders = [];
    this.islandGrid = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        const gid = data[idx];
        if (gid && gid !== 0) {
          this.islandGrid[r][c] = true;
          this.islandColliders.push({
            minX: c * this.tileWidth,
            minY: r * this.tileHeight,
            maxX: (c + 1) * this.tileWidth,
            maxY: (r + 1) * this.tileHeight,
            type: getTileColliderType(gid),
            arcRadius: 60,
          });
        }
      }
    }
  }

  public async buildScene(): Promise<void> {
    try {
      const themeConfig = TILEMAP_THEMES[this.theme] || TILEMAP_THEMES.assets_1;
      const tilesheetPath = themeConfig.extrudedTilesheetPath;

      const customFetchFn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const res = await window.fetch(input, init);
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
        if (urlStr.includes('tilemap.tmj')) {
          const json = await res.json();
          if (json.tilesets && json.tilesets[0]) {
            json.tilesets[0].image = tilesheetPath;
            json.tilesets[0].margin = 2;
            json.tilesets[0].spacing = 4;
            json.tilesets[0].imagewidth = 1088;
            json.tilesets[0].imageheight = 408;
          }
          const islandsLayer = json.layers?.find((l: any) => l.name === 'Islands');
          if (islandsLayer && Array.isArray(islandsLayer.data)) {
            this.parseIslandColliders(islandsLayer.data);
          }
          return new Response(JSON.stringify(json), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return res;
      };

      const mapUrl = `/tilemap.tmj?theme=${this.theme}`;
      const mapAsset = await loadTiledMapAsset(mapUrl, {
        fetchFn: customFetchFn,
        mapOptions: {
          tileSpritePadding: 0,
        },
        scaleMode: 'nearest',
      });

      if (mapAsset && mapAsset.container) {
        this.tiledMap = mapAsset.container;
        this.container.addChild(this.tiledMap);
      }
    } catch (err) {
      console.error('Failed to load tilemap with pixi-tiledmap', err);
    }
  }

  public getLayer(name: string): Container | undefined {
    return this.tiledMap?.getLayer(name);
  }

  public getNearestShorePoint(x: number, y: number): {
    x: number;
    y: number;
    tangentX: number;
    tangentY: number;
    normalX: number;
    normalY: number;
  } {
    let nearestX = this.mapWidth / 2;
    let nearestY = this.mapHeight / 2;
    let bestTangentX = 1;
    let bestTangentY = 0;
    let minDistanceSq = Infinity;

    for (const contour of SHORELINE_CONTOURS) {
      for (let i = 0; i < contour.length - 1; i++) {
        const p1 = contour[i];
        const p2 = contour[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;
        const ddx = x - projX;
        const ddy = y - projY;
        const distSq = ddx * ddx + ddy * ddy;

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          nearestX = projX;
          nearestY = projY;
          const segLen = Math.sqrt(lenSq);
          bestTangentX = dx / segLen;
          bestTangentY = dy / segLen;
        }
      }
    }

    const distToShore = Math.hypot(nearestX - x, nearestY - y);
    let normX = 0;
    let normY = 0;
    if (distToShore > 0.001) {
      normX = (nearestX - x) / distToShore;
      normY = (nearestY - y) / distToShore;
      const beachPenetration = 4;
      nearestX += normX * beachPenetration;
      nearestY += normY * beachPenetration;
    }

    return {
      x: nearestX,
      y: nearestY,
      tangentX: bestTangentX,
      tangentY: bestTangentY,
      normalX: normX,
      normalY: normY,
    };
  }

  public destroy(): void {
    if (this.tiledMap) {
      this.tiledMap.destroy({ children: true });
      this.tiledMap = null;
    }
    this.container.destroy({ children: true });
  }
}
