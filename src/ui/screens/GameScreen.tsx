import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/game/core/GameEngine';
import { VirtualControls } from '../hud/VirtualControls';
import { InputManager } from '@/game/systems/InputManager';
import { MatchEndPayload } from '@/game/core/GameEvents';
import { PlayerHealthBar, CounterPanel, RoundButton, MenuButton } from '../components/SpriteFrame';
import { getEffectiveGameplayConfig } from '@/services/settingsStorage';
import { SoundManager } from '@/services/soundManager';
import { useRecordMatch } from '@/api/matchApi';
import { useSubmitRanking } from '@/api/rankingApi';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import { OrientationBlocker } from '../components/OrientationBlocker';
import { OptionsScreen } from './OptionsScreen';
import {
  getFullscreenElement,
  requestNativeFullscreen,
  exitNativeFullscreen,
  addFullscreenChangeListener,
  isFullscreenSupported,
} from '@/utils/fullscreen';

interface GameScreenProps {
  onReturnToMenu?: () => void;
  onNavigateToRanking?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onReturnToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const pauseModalRef = useRef<HTMLDivElement | null>(null);
  const resultModalRef = useRef<HTMLDivElement | null>(null);
  const pausedByOrientationRef = useRef<boolean>(false);
  const config = getEffectiveGameplayConfig();
  const prevHealthRef = useRef<number>(config.playerMaxHealth);

  const recordMatchMutation = useRecordMatch();
  const submitRankingMutation = useSubmitRanking();

  const { isPortrait, lockLandscapeIfSupported } = useDeviceOrientation();
  const isPortraitRef = useRef<boolean>(isPortrait);
  isPortraitRef.current = isPortrait;
  const [canFullscreen, setCanFullscreen] = useState<boolean>(() => isFullscreenSupported());

  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [inputManager, setInputManager] = useState<InputManager | null>(null);

  const [score, setScore] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(config.sessionDurationSeconds);
  const [playerHealth, setPlayerHealth] = useState<number>(config.playerMaxHealth);
  const [matchResult, setMatchResult] = useState<MatchEndPayload | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => !!getFullscreenElement());
  const [announcement, setAnnouncement] = useState<string>('Battle arena loaded. Set sail!');
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [pauseScale, setPauseScale] = useState<number>(1);

  useEffect(() => {
    lockLandscapeIfSupported();
  }, [lockLandscapeIfSupported]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth < 1024);
      const baseW = 736;
      const baseH = 560;
      const availableW = window.innerWidth * 0.86;
      const availableH = window.innerHeight * 0.86;
      const scale = Math.min(1, availableW / baseW, availableH / baseH);
      setPauseScale(scale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCanFullscreen(isFullscreenSupported());
    return addFullscreenChangeListener(() => {
      setIsFullscreen(!!getFullscreenElement());
    });
  }, []);

  const handleToggleFullscreen = async () => {
    if (!isFullscreenSupported()) return;

    if (!getFullscreenElement()) {
      const entered = await requestNativeFullscreen(document.documentElement);
      if (entered) {
        await lockLandscapeIfSupported();
      }
    } else {
      await exitNativeFullscreen();
    }
  };

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || matchResult) return;

    if (isPortrait) {
      if (!isPaused) {
        pausedByOrientationRef.current = true;
        engine.pause();
        setIsPaused(true);
        setAnnouncement('Voyage paused: Please rotate your device to landscape.');
      }
    } else if (pausedByOrientationRef.current) {
      pausedByOrientationRef.current = false;
      engine.resume();
      setIsPaused(false);
      setAnnouncement('Voyage resumed in landscape orientation.');
    }
  }, [isPortrait, isPaused, matchResult, isLoading]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!canvasRef.current) return;

      const effectiveConfig = getEffectiveGameplayConfig();
      const engine = new GameEngine(canvasRef.current, effectiveConfig);
      engineRef.current = engine;
      (window as any).__gameEngine = engine;

      engine.events.on('scoreChanged', (newScore: unknown) => {
        if (isMounted) {
          const s = newScore as number;
          setScore(s);
          setAnnouncement(`Enemy ship sunk! Current score: ${s}`);
        }
      });

      engine.events.on('timeUpdated', (newTime: unknown) => {
        if (isMounted) setRemainingTime(newTime as number);
      });

      engine.events.on('healthChanged', (newHealth: unknown) => {
        if (isMounted) {
          const val = newHealth as number;
          setPlayerHealth(val);
          if (val <= 35 && prevHealthRef.current > 35) {
            setAnnouncement(`Warning: Hull integrity critical at ${val} percent!`);
            SoundManager.playHealthLow();
          }
          prevHealthRef.current = val;
        }
      });

      engine.events.on('autoPaused', () => {
        if (isMounted) {
          setIsPaused(true);
          setAnnouncement('Voyage paused automatically.');
        }
      });

      engine.events.on('matchEnded', (payload: unknown) => {
        const result = payload as MatchEndPayload;
        if (isMounted) {
          setMatchResult(result);
          setAnnouncement(
            `Voyage ended. ${result.reason === 'TIME_EXPIRED' ? 'Time expired.' : 'Ship sunk.'} Final score: ${result.score} points.`
          );
          const isVictory = result.reason === 'TIME_EXPIRED' && result.score > 0;
          const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const shotsFired = Math.max(result.score * 2, 8);
          const shotsHit = result.score;
          const accuracy = Math.min(100, Math.round((shotsHit / shotsFired) * 100));
          const matchConfig = {
            sessionDurationSeconds: effectiveConfig.sessionDurationSeconds,
            enemySpawnIntervalSeconds: effectiveConfig.enemySpawnIntervalSeconds,
            tilesetTheme: effectiveConfig.tilesetTheme,
          };

          recordMatchMutation.mutate({
            matchId,
            playerId: 'player_local',
            captainName: 'Captain Player',
            result: isVictory ? 'VICTORY' : 'DEFEAT',
            score: result.score,
            durationSeconds: result.durationPlayedSeconds,
            shipsDestroyed: result.score,
            shotsFired,
            shotsHit,
            accuracyPercent: accuracy,
            endReason: result.reason as 'TIME_EXPIRED' | 'PLAYER_DESTROYED',
            config: matchConfig,
          });

          if (result.score > 0) {
            submitRankingMutation.mutate({
              matchId,
              playerId: 'player_local',
              captainName: 'Captain Player',
              shipName: 'The Black Pearl',
              score: result.score,
              durationSeconds: result.durationPlayedSeconds,
              shipsDestroyed: result.score,
              accuracyPercent: accuracy,
              endReason: result.reason as 'TIME_EXPIRED' | 'PLAYER_DESTROYED',
              config: matchConfig,
            });
          }
        }
      });

      try {
        await engine.init((progress) => {
          if (isMounted) {
            setLoadingProgress(Math.round(progress * 100));
          }
        });

        if (isMounted) {
          setInputManager(engine.getInputManager());
          setIsLoading(false);

          if (isPortraitRef.current) {
            pausedByOrientationRef.current = true;
            engine.pause();
            setIsPaused(true);
            setAnnouncement('Voyage paused: Please rotate your device to landscape.');
          }
        } else {
          engine.destroy();
        }
      } catch (err) {
        console.error('Failed to initialize GameEngine', err);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
      SoundManager.stopOceanAmbience();
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
        delete (window as any).__gameEngine;
      }
    };
  }, []);

  useFocusTrap(pauseModalRef, isPaused && !matchResult && !isOptionsOpen, () => {
    if (isOptionsOpen) {
      setIsOptionsOpen(false);
      SoundManager.playClose();
    } else {
      handleTogglePause();
    }
  });
  useFocusTrap(resultModalRef, Boolean(matchResult));

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.resume();
      setIsPaused(false);
      setIsOptionsOpen(false);
      setAnnouncement('Voyage resumed.');
    } else {
      engineRef.current.pause();
      setIsPaused(true);
      setAnnouncement('Voyage paused.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'KeyP' || e.code === 'Escape') && !matchResult) {
        e.preventDefault();
        if (isOptionsOpen) {
          setIsOptionsOpen(false);
          SoundManager.playClose();
        } else {
          handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isOptionsOpen, matchResult]);

  const handleRestart = () => {
    if (!engineRef.current) return;
    engineRef.current.restart();
    setScore(0);
    setRemainingTime(config.sessionDurationSeconds);
    setPlayerHealth(config.playerMaxHealth);
    prevHealthRef.current = config.playerMaxHealth;
    setMatchResult(null);
    setIsPaused(false);
    setAnnouncement('Battle restarted. Full sails ahead!');
  };

  const handleReturnToMenu = () => {
    SoundManager.stopOceanAmbience();
    onReturnToMenu?.();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-screen h-[100dvh] flex items-center justify-center bg-ocean-abyss overflow-hidden select-none">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="combat-live-announcer"
      >
        {announcement}
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          role="application"
          tabIndex={0}
          aria-label="Naval combat arena. Steer using WASD or arrow keys. Fire cannons with Space, Q, and E. Press P to pause."
          className="w-full h-full block touch-none outline-none focus:outline-none focus-visible:outline-none"
        />

        {isLoading && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-cover bg-center select-none"
            style={{ backgroundImage: `url('/assets/ui_scene_background.png')` }}
          >
            <div className="absolute inset-0 bg-[#00121e]/75 backdrop-blur-[2px]" />

            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-sm">
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-pirate-gold mb-6 font-pirate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Hoisting Sails...
              </h2>

              <div className="relative flex items-center justify-center w-36 h-36 mb-5">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="stroke-black/50 fill-[#001827]/80"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="stroke-pirate-gold/25 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#loadingGoldGradient)"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={(2 * Math.PI * 52) * (1 - loadingProgress / 100)}
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-150 ease-out"
                  />
                  <defs>
                    <linearGradient id="loadingGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="100%" stopColor="#e0a92b" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-pirate-gold font-pirate drop-shadow-md">
                    {loadingProgress}%
                  </span>
                </div>
              </div>

              <span className="text-xs sm:text-sm text-pirate-parchment/80 font-mono tracking-wider drop-shadow">
                Loading assets: {loadingProgress}%
              </span>
            </div>
          </div>
        )}

        {!isLoading && !isPaused && !matchResult && (
          <>
            <VirtualControls inputManager={inputManager} />

            <div className="absolute top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] right-[max(0.5rem,env(safe-area-inset-right))] md:top-6 md:left-6 md:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 pointer-events-none z-20">
              <div className="pointer-events-auto">
                <PlayerHealthBar
                  current={playerHealth}
                  max={config.playerMaxHealth}
                  scale={isMobileLayout ? 0.76 : 1.05}
                />
              </div>

              <div className="flex items-center gap-1.5 md:gap-3 pointer-events-auto self-end sm:self-auto">
                <div>
                  <CounterPanel
                    icon="icon_score"
                    value={score}
                    scale={isMobileLayout ? 0.74 : 1.0}
                    testId="hud-score"
                  />
                </div>
                <div>
                  <CounterPanel
                    icon="icon_time"
                    value={formatTime(remainingTime)}
                    scale={isMobileLayout ? 0.74 : 1.0}
                    testId="hud-timer"
                  />
                </div>
                {canFullscreen && (
                  <div>
                    <RoundButton
                      iconSrc="/assets/png/default/ui/controls/icon_fullscreen.png"
                      scale={isMobileLayout ? 0.78 : 0.95}
                      onClick={handleToggleFullscreen}
                      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                      data-testid="hud-fullscreen-btn"
                    />
                  </div>
                )}
                <div>
                  <RoundButton
                    icon="icon_pause"
                    scale={isMobileLayout ? 0.78 : 0.95}
                    onClick={handleTogglePause}
                    title="Pause"
                    data-testid="hud-pause-btn"
                  />
                </div>
              </div>
            </div>

            <div
              data-testid="desktop-controls-ribbon"
              className="fixed bottom-3 inset-x-0 mx-auto w-fit z-20 pointer-events-none hidden lg:flex items-center gap-3 px-3 py-1 select-none text-[11px] font-sans antialiased drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
            >
              <div className="flex items-center gap-1">
                <span className="text-[#facc15] font-bold">W / ↑</span>
                <span className="text-white/90 font-medium">Forward</span>
              </div>
              <span className="text-white/30 font-light">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[#facc15] font-bold">A / ←</span>
                <span className="text-white/90 font-medium">Port</span>
              </div>
              <span className="text-white/30 font-light">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[#facc15] font-bold">D / →</span>
                <span className="text-white/90 font-medium">Starboard</span>
              </div>
              <span className="text-white/30 font-light">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[#facc15] font-bold">Space</span>
                <span className="text-white/90 font-medium">Bow Gun</span>
              </div>
              <span className="text-white/30 font-light">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[#facc15] font-bold">Q</span>
                <span className="text-white/90 font-medium">Broadside L</span>
              </div>
              <span className="text-white/30 font-light">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[#facc15] font-bold">E</span>
                <span className="text-white/90 font-medium">Broadside R</span>
              </div>
              <span className="text-white/30 font-light">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[#facc15] font-bold">P</span>
                <span className="text-white/90 font-medium">Pause</span>
              </div>
            </div>
          </>
        )}

        {isPaused && !matchResult && !isPortrait && (
          <div
            role="presentation"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md select-none pointer-events-auto"
          >
            {isOptionsOpen ? (
              <OptionsScreen
                isModal
                onClose={() => {
                  setIsOptionsOpen(false);
                  SoundManager.playClose();
                }}
              />
            ) : (
              <div
                ref={pauseModalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pause-dialog-title"
                className="relative flex flex-col items-center justify-center px-[3rem] sm:px-[5rem] w-[46rem] h-[35rem] shrink-0 pointer-events-auto"
                style={{
                  backgroundImage: `url('/assets/png/default/ui/menu/panel_menu.png')`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  transform: `scale(${pauseScale})`,
                  transformOrigin: 'center center',
                }}
              >
                <div className="flex flex-col items-center mb-5 sm:mb-6">
                  <h2
                    id="pause-dialog-title"
                    className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[#f1f5f9] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  >
                    PAUSED
                  </h2>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#8ea3bf] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-1.5">
                    Ready when you are.
                  </span>
                </div>

                <div className="flex flex-col items-center gap-[0.75rem]">
                  <MenuButton
                    text="RESUME"
                    scale={isMobileLayout ? 0.95 : 1.05}
                    onClick={handleTogglePause}
                    data-testid="pause-resume-btn"
                  />
                  <MenuButton
                    text="OPTIONS"
                    scale={isMobileLayout ? 0.95 : 1.05}
                    onClick={() => {
                      setIsOptionsOpen(true);
                      SoundManager.play('ui_open');
                    }}
                    data-testid="pause-options-btn"
                  />
                  <MenuButton
                    text="MAIN MENU"
                    scale={isMobileLayout ? 0.95 : 1.05}
                    onClick={handleReturnToMenu}
                    data-testid="pause-menu-btn"
                  />
                </div>
              </div>
            )}

            <div className="absolute bottom-5 right-6 sm:bottom-6 sm:right-8 md:bottom-8 md:right-12 z-20 flex items-center pointer-events-none select-none">
              <img
                src="/assets/logo_jungle_gaming.svg"
                alt="Jungle Gaming"
                className="h-7 sm:h-8 md:h-10 lg:h-11 w-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                data-testid="jungle-gaming-logo"
              />
            </div>
          </div>
        )}

        {matchResult && (
          <div
            role="presentation"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-300 pointer-events-auto"
          >
            <div
              ref={resultModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="result-dialog-title"
              className="relative flex flex-col items-center justify-between px-[3rem] sm:px-[4.5rem] pt-[4.25rem] sm:pt-[4.75rem] pb-[3.75rem] w-[46rem] h-[35rem] shrink-0 pointer-events-auto"
              style={{
                backgroundImage: `url('/assets/png/default/ui/menu/panel_menu.png')`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                transform: `scale(${pauseScale})`,
                transformOrigin: 'center center',
              }}
            >
              <div className="flex flex-col items-center">
                <h2
                  id="result-dialog-title"
                  className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-[#f1f5f9] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  BATTLE COMPLETE
                </h2>
                <span className="text-5xl sm:text-6xl font-black text-amber-300 font-mono tracking-tight my-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
                  {matchResult.score}
                </span>
                <p className="text-xs sm:text-sm text-[#8ea3bf] uppercase tracking-widest font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
                  POINTS • {formatTime(matchResult.durationPlayedSeconds)} •{' '}
                  {matchResult.reason === 'TIME_EXPIRED' ? 'TIME UP' : 'DEFEATED'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-[0.95rem] my-auto">
                <MenuButton
                  text="PLAY AGAIN"
                  scale={1.05}
                  onClick={handleRestart}
                  data-testid="result-play-again-btn"
                />
                <MenuButton
                  text="MAIN MENU"
                  scale={1.05}
                  onClick={onReturnToMenu}
                  data-testid="result-menu-btn"
                />
              </div>
            </div>

            <div className="absolute bottom-5 right-6 sm:bottom-6 sm:right-8 md:bottom-8 md:right-12 z-20 flex items-center pointer-events-none select-none">
              <img
                src="/assets/logo_jungle_gaming.svg"
                alt="Jungle Gaming"
                className="h-7 sm:h-8 md:h-10 lg:h-11 w-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                data-testid="jungle-gaming-logo"
              />
            </div>
          </div>
        )}
      </div>

      <OrientationBlocker isVisible={isPortrait} />
    </div>
  );
};
