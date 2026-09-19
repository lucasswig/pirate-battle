import React from 'react';

interface MinimalLoaderProps {
  className?: string;
  label?: string;
  isFixed?: boolean;
  srOnlyText?: string;
}

export const MinimalLoader: React.FC<MinimalLoaderProps> = ({
  className = '',
  label = 'LOADING...',
  isFixed = false,
  srOnlyText,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`${
        isFixed ? 'fixed inset-0 z-[100]' : 'absolute inset-0 z-50'
      } flex items-center justify-center bg-[#111215] select-none ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-white/20 border-t-white animate-spin" />
        <span className="text-[11px] font-semibold tracking-[0.2em] text-white/90 uppercase font-sans">
          {label}
        </span>
      </div>
      {srOnlyText && <span className="sr-only">{srOnlyText}</span>}
    </div>
  );
};
