import React from 'react';

interface OrientationBlockerProps {
  isVisible: boolean;
}

export const OrientationBlocker: React.FC<OrientationBlockerProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="orientation-title"
      aria-describedby="orientation-desc"
      data-testid="orientation-blocker"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#00121e]/98 backdrop-blur-lg p-6 text-center select-none touch-none animate-fade-in"
    >
      <div className="flex items-center justify-center w-20 h-20 mb-5 rounded-2xl bg-[#001f33] border border-pirate-gold/40 shadow-lg">
        <svg
          className="w-10 h-10 text-pirate-gold"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
          <path d="M12 18h.01" />
          <path d="M17 9l2.5-2.5-2.5-2.5" />
          <path d="M19.5 6.5A6 6 0 0 0 10 3" />
        </svg>
      </div>

      <div className="max-w-md flex flex-col items-center">
        <h2
          id="orientation-title"
          className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-pirate-gold font-pirate mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        >
          Rotate Your Phone to Landscape
        </h2>

        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-pirate-gold/60 to-transparent mb-4" />

        <p
          id="orientation-desc"
          className="text-sm sm:text-base text-pirate-parchment/90 leading-relaxed font-medium mb-6 drop-shadow-sm px-2"
        >
          Please turn your phone horizontally to play. Naval combat requires <strong className="text-pirate-gold font-bold">landscape mode</strong> for full arena and control visibility.
        </p>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-pirate-parchment/70 font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          Turn device horizontally to continue...
        </div>
      </div>
    </div>
  );
};
