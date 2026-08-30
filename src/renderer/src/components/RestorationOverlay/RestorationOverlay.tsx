import React from 'react';
import { Waves, Sparkles } from 'lucide-react';
import { OrcaLogo } from '../Icons/OrcaLogo';

interface RestorationOverlayProps {
  tabTitle: string | null;
}

export const RestorationOverlay: React.FC<RestorationOverlayProps> = ({ tabTitle }) => {
  if (!tabTitle) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/90 backdrop-blur-md pointer-events-none animate-fade-in select-none">
      <div className="flex flex-col items-center text-center p-6 space-y-3 animate-scale-in">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 shadow-orca-sm">
          <Waves className="w-8 h-8 text-sky-600 animate-wave-pulse" />
          <Sparkles className="w-4 h-4 text-sky-400 absolute -top-1 -right-1 animate-bounce" />
        </div>
        <div>
          <div className="text-base font-bold text-slate-800 tracking-tight flex items-center justify-center space-x-1.5">
            <span>Rising to Surface...</span>
          </div>
          <div className="text-xs text-slate-500 font-medium max-w-xs truncate mt-0.5">
            {tabTitle}
          </div>
        </div>
      </div>
    </div>
  );
};
