import { DEFAULT_GAME_CONFIG, GameplayConfig } from '../game/config/gameConfig';
import { GameSettings } from '../api/types';

const SETTINGS_KEY = 'pirate_battle_settings';

export const DEFAULT_SETTINGS: GameSettings = {
  sessionDurationSeconds: DEFAULT_GAME_CONFIG.sessionDurationSeconds,
  enemySpawnIntervalSeconds: DEFAULT_GAME_CONFIG.enemySpawnIntervalSeconds,
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 90,
  tilesetTheme: 'assets_1',
};

export const loadGameSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      sessionDurationSeconds: Number(parsed.sessionDurationSeconds) || DEFAULT_SETTINGS.sessionDurationSeconds,
      enemySpawnIntervalSeconds: Number(parsed.enemySpawnIntervalSeconds) || DEFAULT_SETTINGS.enemySpawnIntervalSeconds,
      masterVolume: Number.isFinite(Number(parsed.masterVolume)) ? Math.max(0, Math.min(100, Number(parsed.masterVolume))) : DEFAULT_SETTINGS.masterVolume,
      musicVolume: Number.isFinite(Number(parsed.musicVolume)) ? Math.max(0, Math.min(100, Number(parsed.musicVolume))) : DEFAULT_SETTINGS.musicVolume,
      sfxVolume: Number.isFinite(Number(parsed.sfxVolume)) ? Math.max(0, Math.min(100, Number(parsed.sfxVolume))) : DEFAULT_SETTINGS.sfxVolume,
      tilesetTheme: parsed.tilesetTheme === 'assets_2' ? 'assets_2' : 'assets_1',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveGameSettings = (settings: Partial<GameSettings>): GameSettings => {
  const current = loadGameSettings();
  const updated: GameSettings = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save settings to localStorage', err);
  }
  return updated;
};

export const getEffectiveGameplayConfig = (): GameplayConfig => {
  const settings = loadGameSettings();
  return {
    ...DEFAULT_GAME_CONFIG,
    sessionDurationSeconds: settings.sessionDurationSeconds,
    enemySpawnIntervalSeconds: settings.enemySpawnIntervalSeconds,
    tilesetTheme: settings.tilesetTheme,
  };
};
