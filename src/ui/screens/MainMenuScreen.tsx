import React, { useEffect, useState } from 'react';
import { useNavigation } from '../navigation/NavigationContext';
import { MenuButton, SecondaryMenuButton, SpriteFrame } from '../components/SpriteFrame';

export const MainMenuScreen: React.FC = () => {
  const { navigateTo } = useNavigation();
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

  return (
    <div
      className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-cover bg-center select-none"
      style={{ backgroundImage: `url('/assets/ui_scene_background.png')` }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />

      <div className="relative z-10 flex items-center justify-center animate-fade-in w-full h-full pointer-events-none">
        <div
          className="relative flex flex-col items-center justify-between px-[3rem] sm:px-[5rem] pt-[4.5rem] sm:pt-[5rem] pb-[3.75rem] sm:pb-[4.25rem] w-[45rem] h-[44rem] shrink-0 pointer-events-auto"
          style={{
            backgroundImage: `url('/assets/png/default/ui/menu/panel_menu.png')`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transform: `scale(${panelScale})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="flex flex-col items-center">
            <SpriteFrame
              name="title_pirate_battle"
              scale={1.12}
              className="drop-shadow-[0_0.5rem_1rem_rgba(0,0,0,0.6)]"
            />
            <span className="text-[0.72rem] font-black uppercase tracking-[0.25em] text-[#f1f5f9]/90 drop-shadow-[0_0.06rem_0.125rem_rgba(0,0,0,0.9)] -mt-[0.25rem]">
              SET SAIL. TAKE COMMAND.
            </span>
          </div>

          <div className="flex flex-col items-center gap-[0.65rem] my-auto">
            <MenuButton
              text="PLAY"
              onClick={() => navigateTo('GAME')}
              scale={1.05}
              data-testid="menu-btn-play"
            />
            <MenuButton
              text="OPTIONS"
              onClick={() => navigateTo('OPTIONS')}
              scale={1.05}
              data-testid="menu-btn-options"
            />
          </div>

          <div className="flex flex-col items-center my-auto">
            <img
              src="/assets/png/default/ships/ship_2.png"
              alt="Pirate Ship"
              className="h-[4.25rem] w-auto drop-shadow-[0_0.35rem_0.75rem_rgba(0,0,0,0.85)] select-none pointer-events-none mb-[0.25rem]"
            />
            <span className="text-[0.75rem] font-semibold text-[#f1f5f9]/90 drop-shadow-[0_0.06rem_0.125rem_rgba(0,0,0,0.9)] text-center px-2">
              Navigate the islands. Survive the battle.
            </span>
          </div>

          <div className="flex items-center justify-center gap-[1rem] w-full">
            <SecondaryMenuButton
              text="RANKING"
              onClick={() => navigateTo('RANKING')}
              scale={0.72}
              data-testid="menu-btn-ranking"
            />
            <SecondaryMenuButton
              text="MATCH HISTORY"
              onClick={() => navigateTo('HISTORY')}
              scale={0.72}
              data-testid="menu-btn-history"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
