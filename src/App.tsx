import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationProvider, useNavigation } from './ui/navigation/NavigationContext';
import { MainMenuScreen } from './ui/screens/MainMenuScreen';
import { GameScreen } from './ui/screens/GameScreen';
import { OptionsScreen } from './ui/screens/OptionsScreen';
import { CaptainsLogScreen } from './ui/screens/CaptainsLogScreen';
import { LiveGameBackground } from './ui/components/LiveGameBackground';
import { NetworkScenarioDrawer } from './ui/components/NetworkScenarioDrawer';
import { syncOfflineMatches } from './api/matchApi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const { currentScreen, navigateTo } = useNavigation();

  useEffect(() => {
    const handleOnline = () => {
      syncOfflineMatches().catch(() => {});
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  if (currentScreen === 'GAME') {
    return (
      <>
        <GameScreen
          onReturnToMenu={() => navigateTo('MENU')}
          onNavigateToRanking={() => navigateTo('RANKING')}
        />
        <NetworkScenarioDrawer />
      </>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#00121e]">
      <LiveGameBackground />
      <div className="relative z-10 w-full h-full live-bg-active pointer-events-auto">
        {(() => {
          switch (currentScreen) {
            case 'OPTIONS':
              return <OptionsScreen />;
            case 'RANKING':
              return <CaptainsLogScreen initialTab="RANKING" />;
            case 'HISTORY':
              return <CaptainsLogScreen initialTab="HISTORY" />;
            case 'LOG':
              return <CaptainsLogScreen initialTab="RANKING" />;
            case 'MENU':
            default:
              return <MainMenuScreen />;
          }
        })()}
      </div>
      <div className="absolute bottom-5 right-6 sm:bottom-6 sm:right-8 md:bottom-8 md:right-12 z-20 flex items-center pointer-events-none select-none">
        <img
          src="/assets/logo_jungle_gaming.svg"
          alt="Jungle Gaming"
          className="h-7 sm:h-8 md:h-10 lg:h-11 w-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
          data-testid="jungle-gaming-logo"
        />
      </div>
      <NetworkScenarioDrawer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProvider initialScreen="MENU">
        <AppContent />
      </NavigationProvider>
    </QueryClientProvider>
  );
};
