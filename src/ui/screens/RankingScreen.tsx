import React, { useState } from 'react';
import { useNavigation } from '../navigation/NavigationContext';
import { useRanking } from '../../api/rankingApi';
import { MenuButton, RoundButton } from '../components/SpriteFrame';

export const RankingScreen: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { data: rankingsData, isLoading, isError, refetch } = useRanking({ pageSize: 50 });
  const [filter, setFilter] = useState('');

  const rankings = rankingsData?.items || [];
  const filteredRankings = rankings.filter(
    (item) =>
      item.captainName.toLowerCase().includes(filter.toLowerCase()) ||
      item.shipName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div
      className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-cover bg-center select-none"
      style={{ backgroundImage: `url('/assets/ui_scene_background.png')` }}
    >
      <div className="absolute inset-0 bg-ocean-abyss/55 backdrop-blur-[3px]" />

      <div className="relative z-10 flex flex-col items-center justify-center animate-fade-in w-full max-w-4xl px-4">
        <div
          className="relative flex flex-col items-center justify-between p-8 w-full shadow-2xl rounded-2xl border-4 border-[#c8963e]"
          style={{
            minHeight: '640px',
            backgroundColor: 'rgba(20, 32, 45, 0.94)',
            backgroundImage: `radial-gradient(ellipse at top, rgba(200, 150, 62, 0.15), transparent 70%)`,
          }}
        >
          <div className="w-full flex items-center justify-between border-b-2 border-pirate-gold/40 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-black uppercase tracking-widest text-pirate-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-pirate">
                Hall of Fame
              </h2>
              <span className="text-xs bg-pirate-gold/20 text-pirate-gold px-2.5 py-1 rounded-full font-bold uppercase border border-pirate-gold/30">
                Global Leaderboard
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <RoundButton
                icon="icon_restart"
                scale={0.8}
                onClick={() => refetch()}
                title="Refresh"
                data-testid="ranking-btn-refresh"
              />
              <RoundButton
                icon="icon_close"
                scale={0.8}
                onClick={() => navigateTo('MENU')}
                title="Close"
                data-testid="ranking-btn-close"
              />
            </div>
          </div>

          <div className="w-full flex items-center justify-between mb-4">
            <input
              type="text"
              placeholder="Search Captain or Vessel..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-ocean-dark/90 border border-pirate-gold/40 rounded-xl px-4 py-2 text-sm text-pirate-parchment placeholder-pirate-parchment/40 focus:outline-none focus:border-pirate-gold w-64 shadow-inner"
            />
            <span className="text-xs text-pirate-parchment/60 font-mono">
              Showing {filteredRankings.length} legendary voyages
            </span>
          </div>

          <div className="w-full flex-1 overflow-y-auto max-h-[380px] rounded-xl border border-pirate-gold/20 bg-black/40 shadow-inner">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-pirate-gold space-y-2">
                <div className="w-8 h-8 border-4 border-pirate-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold">Scanning the Seven Seas...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-64 text-red-400 space-y-2">
                <span className="text-sm font-bold">Failed to load leaderboards.</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-4 py-1.5 bg-pirate-gold text-ocean-dark rounded-lg font-bold text-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredRankings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-pirate-parchment/60">
                <span className="text-sm">No captains matched your search query.</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-ocean-dark text-pirate-gold border-b border-pirate-gold/30 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-center w-16">Rank</th>
                    <th className="py-3 px-4">Captain & Vessel</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Ships Sunk</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pirate-gold/10 font-mono text-pirate-parchment/90">
                  {filteredRankings.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;
                    return (
                      <tr
                        key={entry.id}
                        className={`hover:bg-pirate-gold/10 transition-colors ${
                          isTop1 ? 'bg-yellow-500/10' : isTop2 ? 'bg-slate-400/10' : isTop3 ? 'bg-amber-700/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-black font-black text-xs shadow-md">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-black font-black text-xs shadow-md">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs shadow-md">
                              3
                            </span>
                          ) : (
                            <span className="text-pirate-parchment/60">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-pirate-parchment font-sans text-sm">
                            {entry.captainName}
                          </div>
                          <div className="text-[10px] text-pirate-parchment/50 font-sans italic">
                            {entry.shipName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-pirate-gold text-sm">
                          {entry.score}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">
                          {entry.shipsDestroyed}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {entry.accuracyPercent}%
                        </td>
                        <td className="py-3 px-4 text-right text-[11px] text-pirate-parchment/50">
                          {entry.date}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="w-full flex items-center justify-between pt-4 border-t-2 border-pirate-gold/30 mt-4">
            <span className="text-xs text-pirate-parchment/50 italic">
              Powered by Mock Service Worker (MSW v2) & TanStack Query
            </span>
            <MenuButton
              text="Back to Menu"
              scale={0.8}
              onClick={() => navigateTo('MENU')}
              data-testid="ranking-btn-back"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
