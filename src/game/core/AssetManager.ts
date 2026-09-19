import { Assets, extensions, Rectangle, Texture } from 'pixi.js';
import { tiledMapLoader } from 'pixi-tiledmap';
import { TilesetTheme } from '../../api/types';
import { TILEMAP_THEMES } from '../config/themeConfig';

extensions.add(tiledMapLoader);

export class AssetManager {
  private static instance: AssetManager | null = null;
  private isLoaded = false;
  private currentTheme: TilesetTheme | null = null;
  private textures: Map<string, Texture> = new Map();

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  public async loadAssets(onProgress?: (progress: number) => void, theme: TilesetTheme = 'assets_1'): Promise<void> {
    if (this.isLoaded) {
      if (this.currentTheme !== theme) {
        await this.switchTilesetTheme(theme);
      }
      if (onProgress) onProgress(1.0);
      return;
    }

    const themeConfig = TILEMAP_THEMES[theme] || TILEMAP_THEMES.assets_1;
    const tilesheetSrc = themeConfig.tilesheetPath;
    const waterTileSrc = themeConfig.waterTilePath;

    const assetUrls = [
      { alias: 'ship_player_intact', src: '/assets/png/default/ships/ship_5.png' },
      { alias: 'ship_player_damaged', src: '/assets/png/default/ships/ship_17.png' },
      { alias: 'ship_shooter_intact', src: '/assets/png/default/ships/ship_2.png' },
      { alias: 'ship_shooter_damaged', src: '/assets/png/default/ships/ship_8.png' },
      { alias: 'ship_chaser_intact', src: '/assets/png/default/ships/ship_3.png' },
      { alias: 'ship_chaser_damaged', src: '/assets/png/default/ships/ship_15.png' },
      { alias: 'ship_iron_wreck', src: '/assets/png/default/ships/ship_21.png' },

      { alias: 'cannon_ball', src: '/assets/png/default/ship_parts/cannon_ball.png' },
      { alias: 'cannon_mobile', src: '/assets/png/default/ship_parts/cannon_mobile.png' },
      { alias: 'cannon_loose', src: '/assets/png/default/ship_parts/cannon_loose.png' },

      { alias: 'tilesheet_full', src: tilesheetSrc },
      { alias: 'water_tile', src: waterTileSrc },

      { alias: 'dinghy_1', src: '/assets/png/default/ships/dinghy_large_1.png' },
      { alias: 'dinghy_2', src: '/assets/png/default/ships/dinghy_large_2.png' },
      { alias: 'wood_debris_1', src: '/assets/png/default/ship_parts/wood_1.png' },
      { alias: 'wood_debris_2', src: '/assets/png/default/ship_parts/wood_2.png' },
      { alias: 'wood_debris_3', src: '/assets/png/default/ship_parts/wood_3.png' },
      { alias: 'wood_debris_4', src: '/assets/png/default/ship_parts/wood_4.png' },
      { alias: 'crew_swimmer_1', src: '/assets/png/default/ship_parts/crew_1.png' },
      { alias: 'crew_swimmer_2', src: '/assets/png/default/ship_parts/crew_2.png' },
      { alias: 'crew_swimmer_3', src: '/assets/png/default/ship_parts/crew_3.png' },
      { alias: 'crew_swimmer_4', src: '/assets/png/default/ship_parts/crew_4.png' },
      { alias: 'crew_swimmer_5', src: '/assets/png/default/ship_parts/crew_5.png' },
      { alias: 'crew_swimmer_6', src: '/assets/png/default/ship_parts/crew_6.png' },

      { alias: 'explosion_1', src: '/assets/png/default/effects/explosion_1.png' },
      { alias: 'explosion_2', src: '/assets/png/default/effects/explosion_2.png' },
      { alias: 'explosion_3', src: '/assets/png/default/effects/explosion_3.png' },
      { alias: 'fire_1', src: '/assets/png/default/effects/fire_1.png' },
      { alias: 'fire_2', src: '/assets/png/default/effects/fire_2.png' },

      { alias: 'logo_jungle_gaming', src: '/assets/logo_jungle_gaming.svg' },
      { alias: 'ui_scene_bg', src: '/assets/ui_scene_background.png' },
    ];

    let loadedCount = 0;
    const total = assetUrls.length + 1;

    for (const item of assetUrls) {
      try {
        const texture = await Assets.load<Texture>(item.src);
        this.textures.set(item.alias, texture);
      } catch (err) {
        console.warn(`Failed to load asset ${item.src}, using fallback`, err);
        this.textures.set(item.alias, Texture.WHITE);
      }
      loadedCount++;
      if (onProgress) {
        onProgress(loadedCount / total);
      }
    }

    try {
      const uiSheet = await Assets.load<{ textures: Record<string, Texture> }>('/assets/spritesheet/ui_sheet.json');
      if (uiSheet && uiSheet.textures) {
        for (const [frameKey, texture] of Object.entries(uiSheet.textures)) {
          this.textures.set(frameKey, texture);
        }
      }
    } catch (err) {
      console.warn('Failed to load ui_sheet.json spritesheet', err);
    }

    const baseTilesheet = this.textures.get('tilesheet_full');
    if (baseTilesheet) {
      this.sliceTilesheet(baseTilesheet);
    }
    this.currentTheme = theme;

    loadedCount++;
    if (onProgress) {
      onProgress(1.0);
    }

    const playerIntact = this.textures.get('ship_player_intact');
    if (playerIntact) this.textures.set('ship_player', playerIntact);

    const shooterIntact = this.textures.get('ship_shooter_intact');
    if (shooterIntact) this.textures.set('ship_shooter', shooterIntact);

    const chaserIntact = this.textures.get('ship_chaser_intact');
    if (chaserIntact) this.textures.set('ship_chaser', chaserIntact);

    this.isLoaded = true;
  }

  public async switchTilesetTheme(theme: TilesetTheme): Promise<void> {
    const themeConfig = TILEMAP_THEMES[theme] || TILEMAP_THEMES.assets_1;
    const tilesheetSrc = themeConfig.tilesheetPath;
    const waterTileSrc = themeConfig.waterTilePath;

    try {
      const [sheetTexture, waterTexture] = await Promise.all([
        Assets.load<Texture>(tilesheetSrc),
        Assets.load<Texture>(waterTileSrc),
      ]);
      this.textures.set('tilesheet_full', sheetTexture);
      this.textures.set('water_tile', waterTexture);
      this.sliceTilesheet(sheetTexture);
      this.currentTheme = theme;
    } catch (err) {
      console.warn('Failed to switch tilesheet theme', err);
    }
  }

  private sliceTilesheet(baseTilesheet: Texture): void {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 16; c++) {
        const tileIndex = r * 16 + c + 1;
        const tileTex = new Texture({
          source: baseTilesheet.source,
          frame: new Rectangle(c * 64, r * 64, 64, 64),
        });
        this.textures.set(`tile_${tileIndex}`, tileTex);
      }
    }

    this.textures.set('tree_1', this.getTexture('tile_71'));
    this.textures.set('tree_2', this.getTexture('tile_72'));
    this.textures.set('tree_small', this.getTexture('tile_70'));
    this.textures.set('leaf_cluster_1', this.getTexture('tile_87'));
    this.textures.set('leaf_cluster_2', this.getTexture('tile_88'));
    this.textures.set('rock_1', this.getTexture('tile_49'));
    this.textures.set('rock_2', this.getTexture('tile_50'));
    this.textures.set('rock_moss_1', this.getTexture('tile_65'));
    this.textures.set('rock_moss_2', this.getTexture('tile_66'));
    this.textures.set('sand_full', this.getTexture('tile_18'));
    this.textures.set('grass_full', this.getTexture('tile_24'));
  }

  public getTexture(alias: string): Texture {
    const tex = this.textures.get(alias);
    if (!tex) {
      return Texture.WHITE;
    }
    return tex;
  }

  public hasAsset(alias: string): boolean {
    return this.textures.has(alias);
  }
}
