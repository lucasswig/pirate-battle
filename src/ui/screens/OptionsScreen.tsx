import React, { useEffect, useState } from 'react';
import { useNavigation } from '../navigation/NavigationContext';
import { loadGameSettings, saveGameSettings } from '../../services/settingsStorage';
import { MenuButton, RoundButton, TabButton } from '../components/SpriteFrame';
import { GameSettings } from '../../api/types';
import { SoundManager } from '../../services/soundManager';

const DURATION_OPTIONS = [60, 90, 120, 180];
const SPAWN_OPTIONS = [2, 3, 4, 6, 8];

interface OptionsScreenProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({ onClose, isModal = false }) => {
  const { navigateTo } = useNavigation();
  const [settings, setSettings] = useState<GameSettings>(loadGameSettings);

  const [panelScale, setPanelScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const baseW = 720;
      const baseH = 704;
      const availableW = window.innerWidth * 0.94;
      const availableH = window.innerHeight * 0.94;
      const scale = Math.min(1, availableW / baseW, availableH / baseH);
      setPanelScale(Math.max(0.35, scale));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDurationStep = (direction: number) => {
    const currentIndex = DURATION_OPTIONS.indexOf(settings.sessionDurationSeconds);
    const newIndex = Math.max(0, Math.min(DURATION_OPTIONS.length - 1, (currentIndex === -1 ? 1 : currentIndex) + direction));
    setSettings((prev) => ({ ...prev, sessionDurationSeconds: DURATION_OPTIONS[newIndex] }));
  };

  const handleSpawnStep = (direction: number) => {
    const roundedSpawn = Math.round(settings.enemySpawnIntervalSeconds);
    const currentIndex = SPAWN_OPTIONS.indexOf(roundedSpawn);
    const newIndex = Math.max(0, Math.min(SPAWN_OPTIONS.length - 1, (currentIndex === -1 ? 1 : currentIndex) + direction));
    setSettings((prev) => ({ ...prev, enemySpawnIntervalSeconds: SPAWN_OPTIONS[newIndex] }));
  };

  const handleVolumeStep = (delta: number) => {
    const newVol = Math.max(0, Math.min(100, settings.masterVolume + delta));
    setSettings((prev) => ({
      ...prev,
      masterVolume: newVol,
      sfxVolume: newVol,
      musicVolume: newVol,
    }));
  };

  const handleSaveAndReturn = () => {
    saveGameSettings(settings);
    SoundManager.updateAmbienceVolume();
    if (onClose) {
      onClose();
    } else {
      navigateTo('MENU');
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${
        isModal
          ? 'w-full h-full bg-transparent'
          : 'w-screen h-screen overflow-hidden bg-cover bg-center'
      }`}
      style={isModal ? undefined : { backgroundImage: `url('/assets/ui_scene_background.png')` }}
    >
      {!isModal && <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />}

      <div className="relative z-10 flex items-center justify-center animate-fade-in w-full h-full pointer-events-none">
        <div
          className="relative flex flex-col items-center justify-between px-[3rem] sm:px-[5rem] pt-[4rem] sm:pt-[4.5rem] pb-[3.5rem] sm:pb-[4rem] w-[45rem] h-[45rem] shrink-0 pointer-events-auto"
          style={{
            backgroundImage: `url('/assets/png/default/ui/menu/panel_menu.png')`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transform: `scale(${panelScale})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-[#f5ebd2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-pirate">
              OPTIONS
            </h2>
          </div>

          <div
            className={`flex flex-col items-center ${
              isModal ? 'space-y-[1.45rem]' : 'space-y-[1.1rem]'
            } my-auto w-full max-w-[21.5rem]`}
          >
            <div className="flex flex-col items-center w-full">
              <span className="text-[0.82rem] font-bold text-[#f1f5f9]/90 tracking-wide mb-[0.35rem]">
                Game session time
              </span>
              <div className="flex items-center justify-between w-full px-1">
                <RoundButton
                  icon="icon_minus"
                  scale={0.78}
                  onClick={() => handleDurationStep(-1)}
                  data-testid="options-btn-duration-minus"
                />
                <button
                  type="button"
                  onClick={() => handleDurationStep(1)}
                  className="font-black text-xl text-amber-100 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] bg-transparent border-0 cursor-pointer hover:text-yellow-300 transition-colors"
                >
                  {settings.sessionDurationSeconds} s
                </button>
                <RoundButton
                  icon="icon_plus"
                  scale={0.78}
                  onClick={() => handleDurationStep(1)}
                  data-testid="options-btn-duration-plus"
                />
              </div>
            </div>

            <div className="flex flex-col items-center w-full">
              <span className="text-[0.82rem] font-bold text-[#f1f5f9]/90 tracking-wide mb-[0.35rem]">
                Enemy spawn time
              </span>
              <div className="flex items-center justify-between w-full px-1">
                <RoundButton
                  icon="icon_minus"
                  scale={0.78}
                  onClick={() => handleSpawnStep(-1)}
                  data-testid="options-btn-spawn-minus"
                />
                <span className="font-black text-xl text-amber-100 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] select-none">
                  {Math.round(settings.enemySpawnIntervalSeconds)} s
                </span>
                <RoundButton
                  icon="icon_plus"
                  scale={0.78}
                  onClick={() => handleSpawnStep(1)}
                  data-testid="options-btn-spawn-plus"
                />
              </div>
            </div>

            {!isModal && (
              <div className="flex flex-col items-center w-full">
                <span className="text-[0.82rem] font-bold text-[#f1f5f9]/90 tracking-wide mb-[0.35rem]">
                  Map theme
                </span>
                <div className="flex items-center justify-center gap-[0.75rem] w-full">
                  <TabButton
                    text="Modern"
                    scale={0.68}
                    isActive={settings.tilesetTheme === 'assets_1'}
                    onClick={() => setSettings((prev) => ({ ...prev, tilesetTheme: 'assets_1' }))}
                    data-testid="options-theme-assets-1"
                  />
                  <TabButton
                    text="Classic"
                    scale={0.68}
                    isActive={settings.tilesetTheme === 'assets_2'}
                    onClick={() => setSettings((prev) => ({ ...prev, tilesetTheme: 'assets_2' }))}
                    data-testid="options-theme-assets-2"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col items-center w-full">
              <span className="text-[0.82rem] font-bold text-[#f1f5f9]/90 tracking-wide mb-[0.35rem]">
                Master volume
              </span>
              <div className="flex items-center justify-between w-full px-1">
                <RoundButton
                  icon="icon_minus"
                  scale={0.78}
                  onClick={() => handleVolumeStep(-10)}
                  data-testid="options-btn-volume-minus"
                />
                <span className="font-black text-xl text-amber-100 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] select-none">
                  {settings.masterVolume}%
                </span>
                <RoundButton
                  icon="icon_plus"
                  scale={0.78}
                  onClick={() => handleVolumeStep(10)}
                  data-testid="options-btn-volume-plus"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center w-full">
            <MenuButton
              text={isModal ? 'RETURN' : 'MAIN MENU'}
              onClick={handleSaveAndReturn}
              scale={1.12}
              data-testid="options-btn-save"
            />
          </div>

          <button
            type="button"
            className="hidden"
            onClick={handleSaveAndReturn}
            data-testid="options-btn-close"
          />
        </div>
      </div>
    </div>
  );
};
