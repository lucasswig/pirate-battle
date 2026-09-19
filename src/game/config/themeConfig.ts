import { TilesetTheme } from '../../api/types';

export interface TilemapThemeConfig {
  id: TilesetTheme;
  name: string;
  tilesheetPath: string;
  extrudedTilesheetPath: string;
  waterTilePath: string;
  waterColor: string;
}

export const TILEMAP_THEMES: Record<TilesetTheme, TilemapThemeConfig> = {
  assets_1: {
    id: 'assets_1',
    name: 'Modern',
    tilesheetPath: '/assets/themes/theme_1/tiles_sheet.png',
    extrudedTilesheetPath: 'assets/themes/theme_1/tiles_sheet_extruded.png',
    waterTilePath: '/assets/themes/theme_1/tiles/tile_73.png',
    waterColor: '#1a8ca8',
  },
  assets_2: {
    id: 'assets_2',
    name: 'Classic',
    tilesheetPath: '/assets/themes/theme_2/tiles_sheet.png',
    extrudedTilesheetPath: 'assets/themes/theme_2/tiles_sheet_extruded.png',
    waterTilePath: '/assets/themes/theme_2/tiles/tile_73.png',
    waterColor: '#abd3f5',
  },
};
