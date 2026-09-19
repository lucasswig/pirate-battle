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
  private ctx: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private pendingLoads = new Map<string, Promise<AudioBuffer | null>>();
  private audioPool = new Map<string, HTMLAudioElement[]>();

  private ambienceAudio: HTMLAudioElement | null = null;
  private isAmbienceActive = false;
  private isAmbienceStarting = false;

  private sailingAudio: HTMLAudioElement | null = null;
  private isSailingStarting = false;
  private isSailingPlaying = false;

  private cachedSettings = loadGameSettings();
  private lastSettingsCheck = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          this.ctx = null;
        }
      }

      this.setupAudioUnlock();

      const schedule = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 150));
      schedule(() => {
        this.preloadUISounds();
      });
    }
  }

  private setupAudioUnlock(): void {
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  private getCachedSettings() {
    const now = Date.now();
    if (now - this.lastSettingsCheck > 500) {
      this.cachedSettings = loadGameSettings();
      this.lastSettingsCheck = now;
    }
    return this.cachedSettings;
  }

  private async loadBuffer(name: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(name)) {
      return this.bufferCache.get(name)!;
    }
    if (this.pendingLoads.has(name)) {
      return this.pendingLoads.get(name)!;
    }

    const loadPromise = (async () => {
      try {
        const res = await fetch(`/assets/sounds/${name}.wav`);
        if (!res.ok) return null;
        const arrayBuf = await res.arrayBuffer();
        if (!this.ctx) return null;

        const audioBuf = await new Promise<AudioBuffer>((resolve, reject) => {
          const ret = this.ctx!.decodeAudioData(arrayBuf, resolve, reject);
          if (ret && typeof (ret as Promise<AudioBuffer>).then === 'function') {
            (ret as Promise<AudioBuffer>).then(resolve).catch(reject);
          }
        });

        this.bufferCache.set(name, audioBuf);
        return audioBuf;
      } catch {
        return null;
      } finally {
        this.pendingLoads.delete(name);
      }
    })();

    this.pendingLoads.set(name, loadPromise);
    return loadPromise;
  }

  public async preloadUISounds(): Promise<void> {
    const uiSounds: SoundEffect[] = ['ui_click', 'ui_hover', 'ui_open', 'ui_close', 'ui_back'];
    for (const sound of uiSounds) {
      await this.loadBuffer(sound);
    }
  }

  public async preloadCombatSounds(): Promise<void> {
    const combatSounds: SoundEffect[] = [
      'cannon_fire_1',
      'cannon_fire_2',
      'cannon_fire_3',
      'cannon_broadside',
      'cannonball_water_hit_1',
      'cannonball_water_hit_2',
      'ship_wood_hit_1',
      'ship_wood_hit_2',
      'ship_collision',
      'ship_explosion_1',
      'ship_explosion_2',
      'ship_sinking',
      'score_point',
      'health_low',
      'time_warning',
      'game_start',
      'game_complete',
      'game_over',
    ];

    const queue = [...combatSounds];
    const workers = Array.from({ length: 3 }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (next) await this.loadBuffer(next);
      }
    });
    await Promise.all(workers);
  }

  private playBuffer(buffer: AudioBuffer, volume: number): void {
    if (!this.ctx) return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      source.start(0);
    } catch {}
  }

  private playHtmlAudioFallback(effect: SoundEffect, volume: number): void {
    const pool = this.audioPool.get(effect) || [];
    let audio = pool.find((a) => a.paused || a.ended);
    if (!audio) {
      audio = new Audio(`/assets/sounds/${effect}.wav`);
      audio.preload = 'auto';
      if (pool.length < 4) {
        pool.push(audio);
        this.audioPool.set(effect, pool);
      }
    }
    try {
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
    } catch {}
  }

  public play(effect: SoundEffect, volumeFactor = 1): void {
    if (this.isMuted) return;

    const settings = this.getCachedSettings();
    const effectiveVolume = (settings.masterVolume / 100) * (settings.sfxVolume / 100) * volumeFactor;
    if (effectiveVolume <= 0) return;

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const buffer = this.bufferCache.get(effect);
      if (buffer) {
        this.playBuffer(buffer, effectiveVolume);
        return;
      }

      this.loadBuffer(effect)
        .then((loaded) => {
          if (loaded && !this.isMuted) {
            this.playBuffer(loaded, effectiveVolume);
          }
        })
        .catch(() => {});
      return;
    }

    this.playHtmlAudioFallback(effect, effectiveVolume);
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
      this.ambienceAudio.preload = 'auto';
    }

    this.updateAmbienceVolume();
    if (this.ambienceAudio.paused && !this.isAmbienceStarting) {
      this.isAmbienceStarting = true;
      this.ambienceAudio
        .play()
        .then(() => {
          this.isAmbienceStarting = false;
        })
        .catch(() => {
          this.isAmbienceStarting = false;
        });
    }
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
    if (this.ambienceAudio.paused && !this.isAmbienceStarting) {
      this.isAmbienceStarting = true;
      this.ambienceAudio
        .play()
        .then(() => {
          this.isAmbienceStarting = false;
        })
        .catch(() => {
          this.isAmbienceStarting = false;
        });
    }
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
    this.cachedSettings = loadGameSettings();
    if (!this.ambienceAudio) return;
    const settings = this.cachedSettings;
    const master = Number.isFinite(settings.masterVolume) ? settings.masterVolume : 80;
    const music = Number.isFinite(settings.musicVolume) ? settings.musicVolume : 70;
    const effectiveVolume = (master / 100) * (music / 100) * 0.75;
    this.ambienceAudio.volume = Number.isFinite(effectiveVolume)
      ? Math.max(0, Math.min(1, effectiveVolume))
      : 0.42;
  }

  public updateSailingAudio(speedRatio: number): void {
    if (this.isMuted || !this.isAmbienceActive) {
      this.stopSailingAudio();
      return;
    }

    if (speedRatio <= 0.05) {
      if (this.sailingAudio && !this.sailingAudio.paused) {
        this.sailingAudio.pause();
        this.isSailingPlaying = false;
      }
      return;
    }

    if (!this.sailingAudio) {
      this.sailingAudio = new Audio('/assets/sounds/ship_sailing_loop.wav');
      this.sailingAudio.loop = true;
      this.sailingAudio.preload = 'auto';
    }

    const settings = this.getCachedSettings();
    const master = Number.isFinite(settings.masterVolume) ? settings.masterVolume : 80;
    const sfx = Number.isFinite(settings.sfxVolume) ? settings.sfxVolume : 80;
    const effectiveVolume = (master / 100) * (sfx / 100) * 0.65 * Math.min(1, Math.max(0, speedRatio));

    this.sailingAudio.volume = Number.isFinite(effectiveVolume)
      ? Math.max(0, Math.min(1, effectiveVolume))
      : 0.35;

    if (!this.isSailingPlaying && !this.isSailingStarting && effectiveVolume > 0) {
      this.isSailingStarting = true;
      this.sailingAudio
        .play()
        .then(() => {
          this.isSailingPlaying = true;
          this.isSailingStarting = false;
        })
        .catch(() => {
          this.isSailingStarting = false;
        });
    }
  }

  public pauseSailingAudio(): void {
    if (this.sailingAudio && !this.sailingAudio.paused) {
      this.sailingAudio.pause();
      this.isSailingPlaying = false;
    }
  }

  public stopSailingAudio(): void {
    if (this.sailingAudio) {
      this.sailingAudio.pause();
      this.sailingAudio.currentTime = 0;
      this.isSailingPlaying = false;
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
  (window as unknown as { __soundManager: SoundManagerService }).__soundManager = SoundManager;
}
