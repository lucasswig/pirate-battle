import { TilesetTheme } from '../../api/types';

export interface GameplayConfig {
  arenaWidth: number;
  arenaHeight: number;
  sessionDurationSeconds: number;
  enemySpawnIntervalSeconds: number;
  tilesetTheme: TilesetTheme;
  
  playerMaxHealth: number;
  playerMoveSpeed: number;
  playerTurnSpeed: number;
  playerDrag: number;
  playerCollisionRadius: number;

  frontCannonCooldown: number;
  broadsideCannonCooldown: number;
  projectileSpeed: number;
  projectileLifetime: number;
  projectileDamage: number;
  projectileCollisionRadius: number;

  chaserHealth: number;
  chaserSpeed: number;
  chaserTurnSpeed: number;
  chaserImpactDamage: number;
  chaserCollisionRadius: number;

  shooterHealth: number;
  shooterSpeed: number;
  shooterTurnSpeed: number;
  shooterPreferredDistance: number;
  shooterAttackRange: number;
  shooterFireCooldown: number;
  shooterCollisionRadius: number;
}

export const DEFAULT_GAME_CONFIG: Readonly<GameplayConfig> = Object.freeze({
  arenaWidth: 896,
  arenaHeight: 512,
  sessionDurationSeconds: 90,
  enemySpawnIntervalSeconds: 4.0,
  tilesetTheme: 'assets_1',

  playerMaxHealth: 100,
  playerMoveSpeed: 160,
  playerTurnSpeed: 2.5,
  playerDrag: 0.985,
  playerCollisionRadius: 20,

  frontCannonCooldown: 0.45,
  broadsideCannonCooldown: 1.2,
  projectileSpeed: 420,
  projectileLifetime: 1.8,
  projectileDamage: 25,
  projectileCollisionRadius: 5,

  chaserHealth: 30,
  chaserSpeed: 120,
  chaserTurnSpeed: 2.5,
  chaserImpactDamage: 30,
  chaserCollisionRadius: 18,

  shooterHealth: 50,
  shooterSpeed: 95,
  shooterTurnSpeed: 1.8,
  shooterPreferredDistance: 220,
  shooterAttackRange: 320,
  shooterFireCooldown: 1.8,
  shooterCollisionRadius: 20,
});

export const CONFIG_BOUNDS = {
  sessionDuration: { min: 60, max: 180 },
  spawnInterval: { min: 1.0, max: 15.0 },
} as const;

export function validateGameplayConfig(config: Partial<GameplayConfig>): GameplayConfig {
  const merged: GameplayConfig = { ...DEFAULT_GAME_CONFIG, ...config };

  merged.sessionDurationSeconds = Math.max(
    CONFIG_BOUNDS.sessionDuration.min,
    Math.min(CONFIG_BOUNDS.sessionDuration.max, merged.sessionDurationSeconds)
  );

  merged.enemySpawnIntervalSeconds = Math.max(
    CONFIG_BOUNDS.spawnInterval.min,
    Math.min(CONFIG_BOUNDS.spawnInterval.max, merged.enemySpawnIntervalSeconds)
  );

  merged.tilesetTheme = merged.tilesetTheme === 'assets_2' ? 'assets_2' : 'assets_1';

  return Object.freeze(merged);
}
