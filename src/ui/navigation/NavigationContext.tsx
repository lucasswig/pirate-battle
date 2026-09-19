import React, { createContext, useContext, useState } from 'react';
import { SoundManager } from '../../services/soundManager';

export type ScreenType = 'MENU' | 'GAME' | 'OPTIONS' | 'RANKING' | 'HISTORY' | 'LOG';

interface NavigationContextType {
  currentScreen: ScreenType;
  navigateTo: (screen: ScreenType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode; initialScreen?: ScreenType }> = ({
  children,
  initialScreen = 'MENU',
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(initialScreen);

  const navigateTo = (screen: ScreenType) => {
    if (screen === 'GAME') {
      SoundManager.play('game_start');
    } else if (screen === 'MENU') {
      SoundManager.play('ui_back');
    } else {
      SoundManager.play('ui_open');
    }

    if (screen !== 'GAME') {
      SoundManager.stopOceanAmbience();
    }

    setCurrentScreen(screen);
  };

  return (
    <NavigationContext.Provider value={{ currentScreen, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
