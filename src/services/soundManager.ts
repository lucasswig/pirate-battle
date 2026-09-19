import { loadGameSettings } from './settingsStorage';

export type SoundEffect =
  | 'ui_click'
  | 'ui_hover'
  | 'ui_open'
  | 'ui_close'
  | 'ui_back'
  | 'game_start'
  | 'game_complete'
  | 'game_over'
  | 'game_pause'
  | 'game_resume'
  | 'score_point'
  | 'health_low'
  | 'time_warning'
  | 'cannon_fire_1'
  | 'cannon_fire_2'
  | 'cannon_fire_3'
  | 'cannon_broadside'
  | 'cannonball_water_hit_1'
  | 'cannonball_water_hit_2'
  | 'ship_wood_hit_1'
  | 'ship_wood_hit_2'
  | 'ship_collision'
  | 'ship_explosion_1'
  | 'ship_explosion_2'
  | 'ship_sinking';

class SoundManagerService {
  private isMuted = false;
  private ambienceAudio: HTMLAudioElement | null = null;
  private isAmbienceActive = false;
  private audioPool: Map<string, HTMLAudioElement[]> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupAudioUnlock();
    }
  }

  private setupAudioUnlock(): void {
    const unlock = () => {
      try {
        const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silent.volume = 0.001;
        silent.play().catch(() => {});
      } catch {}
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  private getOrCreateAudio(effect: SoundEffect): HTMLAudioElement {
    const pool = this.audioPool.get(effect) || [];
    const available = pool.find((a) => a.paused || a.ended);
    if (available) {
      available.currentTime = 0;
      return available;
    }
    const audio = new Audio(`/assets/sounds/${effect}.wav`);
    audio.preload = 'auto';
    if (pool.length < 6) {
      pool.push(audio);
      this.audioPool.set(effect, pool);
    }
    return audio;
  }

  public play(effect: SoundEffect, volumeFactor = 1): void {
    if (this.isMuted) return;

    const settings = loadGameSettings();
    const effectiveVolume = (settings.masterVolume / 100) * (settings.sfxVolume / 100) * volumeFactor;

    if (effectiveVolume <= 0) return;

    try {
      const audio = this.getOrCreateAudio(effect);
      audio.volume = Math.max(0, Math.min(1, effectiveVolume));
      audio.play().catch(() => {});
    } catch {}
  }

  public playCannonFire(): void {
    const variants: SoundEffect[] = ['cannon_fire_1', 'cannon_fire_2', 'cannon_fire_3'];
    const selected = variants[Math.floor(Math.random() * variants.length)];
    this.play(selected, 0.9);
  }

  public playBroadside(): void {
    this.play('cannon_broadside', 1.0);
  }

  public playWoodHit(): void {
    const variants: SoundEffect[] = ['ship_wood_hit_1', 'ship_wood_hit_2'];
    const selected = variants[Math.floor(Math.random() * variants.length)];
    this.play(selected, 0.85);
  }

  public playShipExplosion(): void {
    const variants: SoundEffect[] = ['ship_explosion_1', 'ship_explosion_2'];
    const selected = variants[Math.floor(Math.random() * variants.length)];
    this.play(selected, 1.0);
  }

  public playShipSinking(): void {
    this.play('ship_sinking', 0.85);
  }

  public playShipCollision(): void {
    this.play('ship_collision', 0.9);
  }

  public playWaterHit(): void {
    const variants: SoundEffect[] = ['cannonball_water_hit_1', 'cannonball_water_hit_2'];
    const selected = variants[Math.floor(Math.random() * variants.length)];
    this.play(selected, 0.6);
  }

  public playScorePoint(): void {
    this.play('score_point', 0.9);
  }

  public playHealthLow(): void {
    this.play('health_low', 0.95);
  }

  public playTimeWarning(): void {
    this.play('time_warning', 0.85);
  }

  public playClick(): void {
    this.play('ui_click', 0.7);
  }

  public playHover(): void {
    this.play('ui_hover', 0.35);
  }

  public playClose(): void {
    this.play('ui_close', 0.8);
  }

  public startOceanAmbience(): void {
    this.isAmbienceActive = true;
    if (this.isMuted) return;

    if (!this.ambienceAudio) {
      this.ambienceAudio = new Audio('/assets/sounds/ocean_ambience_loop.wav');
      this.ambienceAudio.loop = true;
    }

    this.updateAmbienceVolume();
    this.ambienceAudio.play().catch(() => {});
  }

  public pauseOceanAmbience(): void {
    if (this.ambienceAudio && !this.ambienceAudio.paused) {
      this.ambienceAudio.pause();
    }
    this.pauseSailingAudio();
  }

  public resumeOceanAmbience(): void {
    if (!this.isAmbienceActive || this.isMuted || !this.ambienceAudio) return;
    this.updateAmbienceVolume();
    this.ambienceAudio.play().catch(() => {});
  }

  public stopOceanAmbience(): void {
    this.isAmbienceActive = false;
    if (this.ambienceAudio) {
      this.ambienceAudio.pause();
      this.ambienceAudio.currentTime = 0;
    }
    this.stopSailingAudio();
  }

  public isOceanAmbiencePlaying(): boolean {
    return this.isAmbienceActive && !!this.ambienceAudio && !this.ambienceAudio.paused;
  }

  public isOceanAmbienceActive(): boolean {
    return this.isAmbienceActive;
  }

  public updateAmbienceVolume(): void {
    if (!this.ambienceAudio) return;
    const settings = loadGameSettings();
    const master = Number.isFinite(settings.masterVolume) ? settings.masterVolume : 80;
    const music = Number.isFinite(settings.musicVolume) ? settings.musicVolume : 70;
    const effectiveVolume = (master / 100) * (music / 100) * 0.75;
    this.ambienceAudio.volume = Number.isFinite(effectiveVolume)
      ? Math.max(0, Math.min(1, effectiveVolume))
      : 0.42;
  }

  private sailingAudio: HTMLAudioElement | null = null;

  public updateSailingAudio(speedRatio: number): void {
    if (this.isMuted || !this.isAmbienceActive) {
      this.stopSailingAudio();
      return;
    }

    if (speedRatio <= 0.05) {
      if (this.sailingAudio && !this.sailingAudio.paused) {
        this.sailingAudio.pause();
      }
      return;
    }

    if (!this.sailingAudio) {
      this.sailingAudio = new Audio('/assets/sounds/ship_sailing_loop.wav');
      this.sailingAudio.loop = true;
    }

    const settings = loadGameSettings();
    const master = Number.isFinite(settings.masterVolume) ? settings.masterVolume : 80;
    const sfx = Number.isFinite(settings.sfxVolume) ? settings.sfxVolume : 80;
    const effectiveVolume = (master / 100) * (sfx / 100) * 0.65 * Math.min(1, Math.max(0, speedRatio));
    this.sailingAudio.volume = Number.isFinite(effectiveVolume)
      ? Math.max(0, Math.min(1, effectiveVolume))
      : 0.35;

    if (this.sailingAudio.paused && effectiveVolume > 0) {
      this.sailingAudio.play().catch(() => {});
    }
  }

  public pauseSailingAudio(): void {
    if (this.sailingAudio && !this.sailingAudio.paused) {
      this.sailingAudio.pause();
    }
  }

  public stopSailingAudio(): void {
    if (this.sailingAudio) {
      this.sailingAudio.pause();
      this.sailingAudio.currentTime = 0;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.pauseOceanAmbience();
      this.pauseSailingAudio();
    } else if (this.isAmbienceActive) {
      this.resumeOceanAmbience();
    }
  }
}

export const SoundManager = new SoundManagerService();

if (typeof window !== 'undefined') {
  (window as any).__soundManager = SoundManager;
}
