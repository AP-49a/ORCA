import React, { useState } from 'react';
import { OrcaLogo } from '../Icons/OrcaLogo';
import { Minus, Square, Copy, X } from 'lucide-react';

interface TitleBarProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  onMinimize,
  onMaximize,
  onClose,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleToggleMaximize = () => {
    setIsMaximized((prev) => !prev);
    onMaximize();
  };

  return (
    <header
      className="flex items-center justify-between h-8 bg-[var(--surface)] border-b border-[var(--border)] px-3 select-none text-xs text-[var(--text-secondary)] font-medium z-30 flex-shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      onDoubleClick={handleToggleMaximize}
    >
      {/* Left: ORCA Branding */}
      <div
        className="flex items-center space-x-2"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <OrcaLogo className="w-4 h-4 flex-shrink-0" />
        <span className="font-bold tracking-wider text-[var(--text-primary)] text-xs uppercase">
          Orca
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-normal hidden sm:inline">
          Browser
        </span>
      </div>

      {/* Middle: Draggable window space */}
      <div
        className="flex-1 h-full mx-4 flex items-center justify-center text-[11px] text-[var(--text-muted)] truncate"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
      </div>

      {/* Right: Window Controls */}
      <div
        className="flex items-center space-x-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={onMinimize}
          className="w-7 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleToggleMaximize}
          className="w-7 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-6 flex items-center justify-center rounded hover:bg-red-500 hover:text-white text-[var(--text-secondary)] transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
