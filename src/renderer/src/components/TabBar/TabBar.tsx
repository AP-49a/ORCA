import React from 'react';
import { Tab, MemoryStats } from '../../../../shared/types';
import { TabItem } from './TabItem';
import { OrcaLogo } from '../Icons/OrcaLogo';
import { Plus, Minus, Square, X, Waves } from 'lucide-react';

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
  onOpenMemoryCenter: () => void;
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
  onOpenMemoryCenter,
}) => {
  return (
    <div className="select-none flex items-end h-10 bg-slate-100/90 border-b border-slate-200 px-2"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
        {/* Brand Logo */}
        <div className="flex items-center space-x-2 mr-3 mb-1 px-1 cursor-default">
          <OrcaLogo className="w-5 h-5 flex-shrink-0" />
          <span className="font-bold text-xs tracking-wider text-slate-800 uppercase">
            Orca
          </span>
        </div>

        {/* Tabs Container */}
        <div className="flex items-end space-x-1 flex-1 overflow-x-auto max-w-[calc(100vw-360px)]"
          style={{ overflowY: 'visible' }}
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
            />
          ))}

          {/* New Tab Button */}
          <button
            onClick={onCreateTab}
            className="flex items-center justify-center w-7 h-7 mb-0.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
            title="New Tab (Ctrl+T)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Memory Health Badge */}
        <div className="flex items-center space-x-2 mr-3 mb-1">
          <button
            onClick={onOpenMemoryCenter}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ WebkitAppRegion: 'no-drag', pointerEvents: 'auto' } as React.CSSProperties}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              memoryStats.memoryPressure
                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                : memoryStats.estimatedSavingsMB > 0
                ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
            title="Open Memory Center"
          >
            <Waves className="w-3.5 h-3.5 text-sky-500" />
            <span className="font-mono text-[11px]">{memoryStats.browserTotalMB} MB</span>
            {memoryStats.estimatedSavingsMB > 0 && (
              <span className="text-[10px] text-emerald-600 font-medium ml-1">
                (-{memoryStats.estimatedSavingsMB} MB)
              </span>
            )}
          </button>
        </div>


      </div>
  );
};
