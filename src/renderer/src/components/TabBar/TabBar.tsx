import React, { useState } from 'react';
import { Tab, MemoryStats } from '../../../../shared/types';
import { TabItem } from './TabItem';
import { OrcaLogo } from '../Icons/OrcaLogo';
import { Plus, Minus, Square, Copy, X, Waves } from 'lucide-react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  memoryStats: MemoryStats;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCreateTab: () => void;
  onTogglePinTab: (id: string) => void;
  onToggleMuteTab: (id: string) => void;
  onSuspendTab: (id: string) => void;
  onHibernateTab: (id: string) => void;
  onDuplicateTab: (id: string) => void;
  onRestoreTab: (id: string) => void;
  onToggleKeepAwakeTab?: (id: string, keepAwake: boolean) => void;
  onOpenMemoryCenter: () => void;
  onMinimizeWindow?: () => void;
  onMaximizeWindow?: () => void;
  onCloseWindow?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  memoryStats,
  onSelectTab,
  onCloseTab,
  onCreateTab,
  onTogglePinTab,
  onToggleMuteTab,
  onSuspendTab,
  onHibernateTab,
  onDuplicateTab,
  onRestoreTab,
  onToggleKeepAwakeTab,
  onOpenMemoryCenter,
  onMinimizeWindow,
  onMaximizeWindow,
  onCloseWindow,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleToggleMaximize = () => {
    setIsMaximized((prev) => !prev);
    onMaximizeWindow?.();
  };

  return (
    <div
      className="select-none flex items-end justify-between h-10 bg-[var(--bg-secondary)] border-b border-[var(--border)] px-2 flex-shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      onDoubleClick={handleToggleMaximize}
    >
      {/* Left: Brand Logo & Tabs */}
      <div className="flex items-end flex-1 min-w-0 mr-3" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        {/* Brand Logo */}
        <div
          className="flex items-center space-x-2 mr-3 mb-1 px-1 cursor-default flex-shrink-0 no-drag"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <OrcaLogo className="w-5 h-5 flex-shrink-0" />
          <span className="font-bold text-xs tracking-wider text-[var(--text-primary)] uppercase">
            Orca
          </span>
        </div>

        {/* Tabs Container */}
        <div
          className="flex items-end space-x-1 flex-1 min-w-0 overflow-x-auto no-drag"
          style={{ overflowY: 'visible', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={() => onSelectTab(tab.id)}
              onClose={() => onCloseTab(tab.id)}
              onTogglePin={() => onTogglePinTab(tab.id)}
              onToggleMute={() => onToggleMuteTab(tab.id)}
              onSuspend={() => onSuspendTab(tab.id)}
              onHibernate={() => onHibernateTab(tab.id)}
              onDuplicate={() => onDuplicateTab(tab.id)}
              onRestore={() => onRestoreTab(tab.id)}
              onToggleKeepAwake={() => onToggleKeepAwakeTab?.(tab.id, !tab.keepAwake)}
            />
          ))}

          {/* New Tab Button */}
          <button
            onClick={onCreateTab}
            className="flex items-center justify-center w-7 h-7 mb-0.5 rounded-lg hover:bg-[var(--surface-hover)] hover:scale-105 active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 ease-out flex-shrink-0 no-drag"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="New Tab (Ctrl+T)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Memory Health Badge + Native-style Window Controls */}
      <div
        className="flex items-center space-x-2 mb-1 flex-shrink-0 no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Quick Memory Health Badge */}
        <button
          onClick={onOpenMemoryCenter}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold active:scale-95 transition-all duration-150 ease-out cursor-pointer ${
            memoryStats.memoryPressure
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
              : memoryStats.estimatedSavingsMB > 0
              ? 'bg-[var(--accent-subtle)] hover:bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)] hover:shadow-xs'
              : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] hover:shadow-xs'
          }`}
          title="Open Memory Center"
        >
          <Waves className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="font-mono text-[11px]">{memoryStats.browserTotalMB} MB</span>
          {memoryStats.estimatedSavingsMB > 0 && (
            <span className="text-[10px] text-emerald-500 font-medium ml-1">
              (-{memoryStats.estimatedSavingsMB} MB)
            </span>
          )}
        </button>

        {/* Window Controls */}
        <div className="flex items-center space-x-0.5 pl-1">
          <button
            type="button"
            onClick={onMinimizeWindow}
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-hover)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 ease-out"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleToggleMaximize}
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-[var(--surface-hover)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 ease-out"
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
            onClick={onCloseWindow}
            className="w-7 h-6 flex items-center justify-center rounded hover:bg-rose-500 hover:text-white active:scale-95 text-[var(--text-secondary)] transition-all duration-150 ease-out"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

