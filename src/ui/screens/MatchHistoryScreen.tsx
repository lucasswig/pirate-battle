import React from 'react';
import { useNavigation } from '../navigation/NavigationContext';
import { useClearMatchHistory, useMatchHistory } from '../../api/matchApi';
import { MenuButton, RoundButton, SecondaryMenuButton } from '../components/SpriteFrame';

export const MatchHistoryScreen: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { data: matchesData, isLoading, isError, refetch } = useMatchHistory({ pageSize: 50 });
  const clearMutation = useClearMatchHistory();

  const matches = matchesData?.items || [];
  const totalVoyages = matches.length;
  const victories = matches.filter((m) => m.result === 'VICTORY').length;
  const totalShipsSunk = matches.reduce((acc, m) => acc + m.shipsDestroyed, 0);
  const bestScore = matches.reduce((acc, m) => Math.max(acc, m.score), 0);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to burn the captain's logbook?")) {
      clearMutation.mutate();
    }
  };

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
                Captain's Log
              </h2>
              <span className="text-xs bg-pirate-gold/20 text-pirate-gold px-2.5 py-1 rounded-full font-bold uppercase border border-pirate-gold/30">
                Voyage History
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <RoundButton
                icon="icon_restart"
                scale={0.8}
                onClick={() => refetch()}
                title="Refresh"
                data-testid="history-btn-refresh"
              />
              <RoundButton
                icon="icon_close"
                scale={0.8}
                onClick={() => navigateTo('MENU')}
                title="Close"
                data-testid="history-btn-close"
              />
            </div>
          </div>

          <div className="w-full grid grid-cols-4 gap-3 mb-4">
            <div className="bg-ocean-dark/80 p-3 rounded-xl border border-pirate-gold/30 text-center">
              <div className="text-[10px] uppercase font-bold text-pirate-parchment/60">Total Voyages</div>
              <div className="text-xl font-bold font-mono text-pirate-parchment">{totalVoyages}</div>
            </div>
            <div className="bg-ocean-dark/80 p-3 rounded-xl border border-pirate-gold/30 text-center">
              <div className="text-[10px] uppercase font-bold text-pirate-parchment/60">Victories</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{victories}</div>
            </div>
            <div className="bg-ocean-dark/80 p-3 rounded-xl border border-pirate-gold/30 text-center">
              <div className="text-[10px] uppercase font-bold text-pirate-parchment/60">Ships Sunk</div>
              <div className="text-xl font-bold font-mono text-pirate-gold">{totalShipsSunk}</div>
            </div>
            <div className="bg-ocean-dark/80 p-3 rounded-xl border border-pirate-gold/30 text-center">
              <div className="text-[10px] uppercase font-bold text-pirate-parchment/60">Best Score</div>
              <div className="text-xl font-bold font-mono text-yellow-300">{bestScore}</div>
            </div>
          </div>

          <div className="w-full flex-1 overflow-y-auto max-h-[340px] rounded-xl border border-pirate-gold/20 bg-black/40 shadow-inner">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-56 text-pirate-gold space-y-2">
                <div className="w-8 h-8 border-4 border-pirate-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold">Unfurling navigation logs...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-56 text-red-400">
                <span className="text-sm font-bold">Failed to load logbook.</span>
              </div>
            ) : !matches || matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-pirate-parchment/60 space-y-2">
                <span className="text-sm font-bold">No voyages recorded yet.</span>
                <span className="text-xs">Set sail and conquer the ocean to fill your logbook!</span>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-ocean-dark text-pirate-gold border-b border-pirate-gold/30 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Outcome</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Duration</th>
                    <th className="py-3 px-4 text-center">Ships Sunk</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pirate-gold/10 font-mono text-pirate-parchment/90">
                  {matches.map((item) => (
                    <tr key={item.id} className="hover:bg-pirate-gold/10 transition-colors">
                      <td className="py-3 px-4 font-sans text-xs">{item.date}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.result === 'VICTORY'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {item.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-pirate-gold">{item.score}</td>
                      <td className="py-3 px-4 text-center">{Math.floor(item.durationSeconds)}s</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">{item.shipsDestroyed}</td>
                      <td className="py-3 px-4 text-center">{item.accuracyPercent}%</td>
                      <td className="py-3 px-4 text-right text-[10px] text-pirate-parchment/60">
                        {item.synced ? 'Synced' : 'Offline'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="w-full flex items-center justify-between pt-4 border-t-2 border-pirate-gold/30 mt-4">
            <SecondaryMenuButton
              text="Clear Logs"
              scale={0.8}
              onClick={handleClear}
              data-testid="history-btn-clear"
            />
            <MenuButton
              text="Back to Menu"
              scale={0.8}
              onClick={() => navigateTo('MENU')}
              data-testid="history-btn-back"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
