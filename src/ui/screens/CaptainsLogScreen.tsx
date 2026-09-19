import React, { useEffect, useState } from 'react';
import { useNavigation } from '../navigation/NavigationContext';
import { useRanking } from '../../api/rankingApi';
import { useMatchHistory, useSyncOfflineMatches } from '../../api/matchApi';
import { MenuButton, RoundButton, TabButton } from '../components/SpriteFrame';
import { loadGameSettings } from '../../services/settingsStorage';
import { getPendingMatches } from '../../services/offlineQueue';

const ITEMS_PER_PAGE = 5;

interface CaptainsLogScreenProps {
  initialTab?: 'RANKING' | 'HISTORY';
}

export const CaptainsLogScreen: React.FC<CaptainsLogScreenProps> = ({
  initialTab = 'RANKING',
}) => {
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<'RANKING' | 'HISTORY'>(initialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [panelScale, setPanelScale] = useState(1);
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingMatches().length);

  const settings = loadGameSettings();

  const {
    data: rankingData,
    isLoading: isRankingLoading,
    isError: isRankingError,
    refetch: refetchRanking,
  } = useRanking({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    sessionDuration: settings.sessionDurationSeconds,
    spawnInterval: settings.enemySpawnIntervalSeconds,
  });

  const {
    data: matchData,
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    refetch: refetchMatches,
  } = useMatchHistory({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
  });

  const syncMutation = useSyncOfflineMatches();

  useEffect(() => {
    const handleQueueChange = () => {
      setPendingCount(getPendingMatches().length);
    };
    window.addEventListener('offline-queue-changed', handleQueueChange);
    return () => window.removeEventListener('offline-queue-changed', handleQueueChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const baseW = 860;
      const baseH = 535;
      const targetW = window.innerWidth * 0.84;
      const targetH = window.innerHeight * 0.88;
      const scale = Math.min(targetW / baseW, targetH / baseH);
      setPanelScale(Math.max(0.45, Math.min(1.4, scale)));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (tab: 'RANKING' | 'HISTORY') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const rankingList = rankingData?.items || [];
  const pendingMatches = getPendingMatches();
  const serverMatches = matchData?.items || [];
  const serverMatchIds = new Set(serverMatches.map((m) => m.matchId || m.id));
  const uniquePending = pendingMatches.filter((p) => !serverMatchIds.has(p.matchId || p.id));
  const matchList = [...uniquePending, ...serverMatches];

  const totalPages = Math.max(
    1,
    activeTab === 'RANKING'
      ? rankingData?.totalPages ?? 1
      : Math.max(1, Math.ceil(matchList.length / ITEMS_PER_PAGE))
  );

  return (
    <div
      className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-cover bg-center select-none"
      style={{ backgroundImage: `url('/assets/ui_scene_background.png')` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.5px]" />

      <div className="relative z-10 flex items-center justify-center animate-fade-in w-full h-full pointer-events-none">
        <div
          className="relative flex flex-col items-center justify-between px-14 sm:px-16 pt-[3.4rem] pb-[4rem] w-[53.75rem] h-[33.4375rem] shrink-0 pointer-events-auto"
          style={{
            backgroundImage: `url('/assets/png/default/ui/menu/panel_menu.png')`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            transform: `scale(${panelScale})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="flex flex-col items-center w-full">
            <h1 className="text-2xl sm:text-[1.6rem] font-black uppercase tracking-[0.22em] text-[#f1f5f9] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              CAPTAIN'S LOG
            </h1>

            <div
              role="tablist"
              aria-label="Captain's Log Views"
              className="flex items-center justify-center gap-4 mt-1.5"
            >
              <TabButton
                text="RANKING"
                isActive={activeTab === 'RANKING'}
                onClick={() => handleTabChange('RANKING')}
                scale={0.52}
                data-testid="tab-btn-ranking"
              />
              <TabButton
                text="MATCH HISTORY"
                isActive={activeTab === 'HISTORY'}
                onClick={() => handleTabChange('HISTORY')}
                scale={0.52}
                data-testid="tab-btn-history"
              />
            </div>

            <div className="flex items-center gap-2 mt-1.5 mb-3.5">
              <span className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-[#8ea3bf] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {activeTab === 'RANKING'
                  ? `${settings.sessionDurationSeconds} SECOND BATTLES · ${Math.round(settings.enemySpawnIntervalSeconds)} SECOND SPAWN INTERVAL`
                  : 'YOU RECENT BATTLES'}
              </span>
              {pendingCount > 0 && activeTab === 'HISTORY' && (
                <button
                  type="button"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="text-[0.6rem] font-bold px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50 hover:bg-amber-500/40 uppercase tracking-wider transition-colors cursor-pointer focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50 focus-visible:shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                  data-testid="btn-sync-offline"
                >
                  {syncMutation.isPending ? 'Syncing...' : `Sync ${pendingCount} Pending`}
                </button>
              )}
            </div>
          </div>

          <div
            role="tabpanel"
            aria-label={activeTab === 'RANKING' ? 'Fleet Ranking' : "Captain's Match History"}
            className="w-full max-w-[700px] flex-1 flex flex-col justify-center my-auto"
          >
            {activeTab === 'RANKING' ? (
              <div className="w-full flex flex-col">
                <div className="flex items-center text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#8ea3bf] px-5 pb-1.5 w-full">
                  <span className="w-16 pl-1 text-left">RANK</span>
                  <span className="flex-1 pl-4 text-left">CAPTAIN</span>
                  <span className="w-24 pl-2 text-left">POINTS</span>
                  <span className="w-36 pl-2 text-left">PLAYED</span>
                </div>

                {isRankingLoading ? (
                  <div className="flex flex-col items-center justify-center h-44 text-[#cbd5e1] font-mono text-xs gap-2">
                    <div className="w-6 h-6 border-2 border-pirate-gold border-t-transparent rounded-full animate-spin" />
                    <span>Loading records...</span>
                  </div>
                ) : isRankingError ? (
                  <div className="flex flex-col items-center justify-center h-44 text-rose-300 font-mono text-xs gap-2">
                    <span>Failed to retrieve rankings.</span>
                    <button
                      type="button"
                      onClick={() => refetchRanking()}
                      className="px-3 py-1 bg-pirate-gold/20 text-pirate-gold border border-pirate-gold/40 rounded hover:bg-pirate-gold/30 uppercase text-[0.65rem] font-bold"
                      data-testid="btn-retry-ranking"
                    >
                      Retry
                    </button>
                  </div>
                ) : rankingList.length === 0 ? (
                  <div className="flex items-center justify-center h-44 text-[#8ea3bf] font-mono text-xs">
                    No voyages logged yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 w-full">
                    {rankingList.map((entry) => {
                      const isTop1 = entry.rank === 1;
                      const isPlayer =
                        entry.captainName.toLowerCase().includes('jack') ||
                        entry.captainName.toLowerCase().includes('you');

                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center px-5 h-[2.15rem] rounded-lg transition-colors w-full ${isPlayer
                              ? 'bg-[#382b14]/85 border border-[#eab308]/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                              : 'bg-[#132235]/85 border border-[#1e344f]/70 hover:bg-[#182c44]/90'
                            }`}
                        >
                          <span className="w-16 pl-1 font-mono font-bold text-white text-sm text-left">
                            {String(entry.rank).padStart(2, '0')}
                          </span>

                          <div className="flex-1 pl-4 flex items-center gap-2 font-bold text-white text-sm truncate pr-2">
                            {isTop1 && (
                              <svg
                                className="w-4 h-4 text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                            <span className="truncate">{entry.captainName}</span>
                            {isPlayer && (
                              <span className="text-[0.6rem] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider ml-1 shrink-0">
                                YOU
                              </span>
                            )}
                          </div>

                          <span className="w-24 pl-2 font-mono font-bold text-white text-sm text-left">
                            {entry.score}
                          </span>

                          <span className="w-36 pl-2 font-mono text-xs text-[#8ea3bf] text-left truncate">
                            {entry.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col">
                <div className="flex items-center text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#8ea3bf] px-5 pb-2 w-full">
                  <span className="w-24 text-left">OUTCOME</span>
                  <span className="w-20 pl-2 text-left">SCORE</span>
                  <span className="flex-1 pl-4 text-left">SHIPS SUNK</span>
                  <span className="w-24 pl-2 text-left">ACCURACY</span>
                  <span className="w-36 pl-2 text-left">PLAYED</span>
                </div>

                {isMatchesLoading ? (
                  <div className="flex flex-col items-center justify-center h-44 text-[#cbd5e1] font-mono text-xs gap-2">
                    <div className="w-6 h-6 border-2 border-pirate-gold border-t-transparent rounded-full animate-spin" />
                    <span>Loading records...</span>
                  </div>
                ) : isMatchesError ? (
                  <div className="flex flex-col items-center justify-center h-44 text-rose-300 font-mono text-xs gap-2">
                    <span>Failed to retrieve match history.</span>
                    <button
                      type="button"
                      onClick={() => refetchMatches()}
                      className="px-3 py-1 bg-pirate-gold/20 text-pirate-gold border border-pirate-gold/40 rounded hover:bg-pirate-gold/30 uppercase text-[0.65rem] font-bold"
                      data-testid="btn-retry-matches"
                    >
                      Retry
                    </button>
                  </div>
                ) : matchList.length === 0 ? (
                  <div className="flex items-center justify-center h-44 text-[#8ea3bf] font-mono text-xs">
                    No battles fought yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 w-full">
                    {matchList.map((m) => {
                      const isVictory = m.result === 'VICTORY';
                      const isPending = m.synced === false;

                      return (
                        <div
                          key={m.id}
                          className="flex items-center px-5 h-[2.15rem] rounded-lg bg-[#132235]/85 border border-[#1e344f]/70 hover:bg-[#182c44]/90 transition-colors w-full"
                        >
                          <div className="w-24 text-left flex items-center gap-1.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[0.62rem] font-black tracking-wider uppercase ${isVictory
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                            >
                              {m.result}
                            </span>
                            {isPending && (
                              <span className="text-[0.55rem] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                                PENDING
                              </span>
                            )}
                          </div>

                          <span className="w-20 pl-2 font-mono font-bold text-white text-sm text-left">
                            {m.score}
                          </span>

                          <span className="flex-1 pl-4 font-mono text-xs font-semibold text-emerald-400 text-left">
                            {m.shipsDestroyed} Ships
                          </span>

                          <span className="w-24 pl-2 font-mono text-xs text-[#cbd5e1] text-left">
                            {m.accuracyPercent}%
                          </span>

                          <span className="w-36 pl-2 font-mono text-xs text-[#8ea3bf] text-left truncate">
                            {m.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mt-2 mb-1">
            <RoundButton
              icon="icon_turn_left"
              scale={0.44}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              data-testid="log-btn-prev"
              title="Previous Page"
            />
            <span className="font-mono text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#cbd5e1] mx-3">
              PAGE {currentPage} OF {totalPages}
            </span>
            <RoundButton
              icon="icon_turn_right"
              scale={0.44}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              data-testid="log-btn-next"
              title="Next Page"
            />
          </div>

          <div className="flex items-center justify-center mt-1">
            <MenuButton
              text="MAIN MENU"
              onClick={() => navigateTo('MENU')}
              scale={0.58}
              data-testid="log-btn-menu"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
