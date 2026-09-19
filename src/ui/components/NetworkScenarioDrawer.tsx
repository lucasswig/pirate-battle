import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MswNetworkScenario } from '../../api/types';
import { getStoredScenario, setStoredScenario } from '../../mocks/scenarioState';
import { resetAllMockData } from '../../mocks/handlers';
import { useFocusTrap } from '../hooks/useFocusTrap';

const SCENARIOS: { id: MswNetworkScenario; label: string; description: string }[] = [
  { id: 'DEFAULT', label: 'Default / Success', description: 'Standard responses with pagination and fixtures.' },
  { id: 'EMPTY', label: 'Empty Lists', description: 'Returns 0 items for ranking and match history.' },
  { id: 'SLOW', label: 'Slow Network (2s)', description: 'Simulates high latency to test loading spinners.' },
  { id: 'OUT_OF_ORDER', label: 'Variable Jitter', description: 'Random latency to test out-of-order responses.' },
  { id: 'ERROR_500', label: 'HTTP 500 Server Error', description: 'Fails all requests with internal server error.' },
  { id: 'TIMEOUT', label: 'HTTP 504 Timeout', description: 'Simulates gateway timeout.' },
  { id: 'ERROR_RANKING', label: 'Ranking Failure (500)', description: 'Fails only ranking queries.' },
  { id: 'ERROR_HISTORY', label: 'History Failure (500)', description: 'Fails only match history queries.' },
  { id: 'TIMEOUT_AFTER_RECORD', label: 'Timeout After Record', description: 'Saves record but returns 504 to verify idempotency.' },
  { id: 'OFFLINE', label: 'Offline / Disconnected', description: 'Drops network connection entirely.' },
];

export const NetworkScenarioDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<MswNetworkScenario>(getStoredScenario);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  useFocusTrap(panelRef, isOpen, () => setIsOpen(false));

  useEffect(() => {
    const handleScenarioChange = (e: Event) => {
      const detail = (e as CustomEvent<MswNetworkScenario>).detail;
      if (detail) setActiveScenario(detail);
    };
    window.addEventListener('msw-scenario-changed', handleScenarioChange);
    return () => window.removeEventListener('msw-scenario-changed', handleScenarioChange);
  }, []);

  const handleSelectScenario = (scenario: MswNetworkScenario) => {
    setActiveScenario(scenario);
    setStoredScenario(scenario);
    queryClient.invalidateQueries();
  };

  const handleResetData = () => {
    resetAllMockData();
    setActiveScenario('DEFAULT');
    queryClient.invalidateQueries();
  };

  return (
    <div className="fixed top-3 left-0 right-0 z-50 justify-center pointer-events-none font-sans select-none hidden lg:flex">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#102030]/90 border border-amber-500/60 shadow-lg text-amber-200 hover:text-white hover:border-amber-400 text-xs font-bold transition-all backdrop-blur-md cursor-pointer group focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50 focus-visible:shadow-[0_0_8px_rgba(245,158,11,0.3)]"
          data-testid="network-drawer-toggle"
          title="Open MSW Network Scenarios Drawer"
          aria-haspopup="dialog"
          aria-expanded="false"
        >
          <span className={`w-2 h-2 rounded-full ${activeScenario === 'DEFAULT' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className="font-mono uppercase text-[10px] tracking-wider">MSW: {activeScenario}</span>
        </button>
      ) : (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="network-drawer-title"
          className="pointer-events-auto relative flex flex-col w-80 max-h-[85vh] p-4 rounded-2xl bg-[#0c1824]/95 border-2 border-[#c8963e] shadow-2xl backdrop-blur-md text-white animate-in fade-in zoom-in-95 duration-200"
          data-testid="network-drawer-panel"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#c8963e]/30 mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeScenario === 'DEFAULT' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <h3 id="network-drawer-title" className="font-black text-xs uppercase tracking-widest text-[#f1f5f9]">
                Network Scenarios (MSW)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-amber-200/70 hover:text-white text-xs px-2 py-0.5 rounded border border-transparent hover:border-amber-500/40 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50 focus-visible:shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              data-testid="network-drawer-close"
              aria-label="Close Network Scenarios Drawer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[50vh]">
            {SCENARIOS.map((sc) => {
              const isSelected = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(sc.id)}
                  data-testid={`scenario-btn-${sc.id}`}
                  className={`w-full text-left p-2 rounded-xl border transition-all text-xs flex flex-col ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                      : 'bg-[#142334]/60 border-slate-700/60 hover:bg-[#1b2f46] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wide">{sc.label}</span>
                    {isSelected && <span className="text-[10px] text-amber-300 font-mono">ACTIVE</span>}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{sc.description}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#c8963e]/30 mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleResetData}
              data-testid="network-btn-reset"
              className="w-full py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/60 hover:bg-amber-500/30 text-amber-200 font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Reset Seed Data & Scenarios
            </button>
            <span className="text-[9px] text-slate-400 text-center font-mono">
              Persists in localStorage across browser refreshes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
