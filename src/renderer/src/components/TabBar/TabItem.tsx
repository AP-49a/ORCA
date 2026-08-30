import React, { useState } from 'react';
import { Tab } from '../../../../shared/types';
import {
  X,
  Pin,
  Volume2,
  VolumeX,
  Globe,
  Waves,
  Moon,
  Sparkles,
  RefreshCw,
  Copy,
  Zap,
} from 'lucide-react';

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onTogglePin: () => void;
  onToggleMute: () => void;
  onSuspend: () => void;
  onHibernate: () => void;
  onDuplicate: () => void;
  onRestore: () => void;
}

export const TabItem: React.FC<TabItemProps> = ({
  tab,
  isActive,
  onSelect,
  onClose,
  onTogglePin,
  onToggleMute,
  onSuspend,
  onHibernate,
  onDuplicate,
  onRestore,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Ocean Tier visual indicator
  const renderStateBadge = () => {
    switch (tab.state) {
      case 'ACTIVE':
        return (
          <span
            title="Surface (Active in RAM)"
            className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.8)]"
          />
        );
      case 'IDLE':
        return (
          <span
            title="Shallow (Idle - Ready)"
            className="w-2 h-2 rounded-full bg-teal-400 opacity-80"
          />
        );
      case 'SUSPENDED':
        return (
          <span
            title="Deep (Suspended - RAM Freed)"
            className="w-2 h-2 rounded-full bg-indigo-500 ring-1 ring-indigo-300"
          />
        );
      case 'HIBERNATED':
        return (
          <span
            title="Abyss (Hibernated on Disk)"
            className="w-2 h-2 rounded-full bg-slate-400 ring-1 ring-slate-300"
          />
        );
    }
  };

  return (
    <>
      <div
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        className={`group relative flex items-center h-8 transition-all duration-150 rounded-t-lg border-t border-l border-r text-xs font-medium cursor-pointer no-drag ${
          tab.pinned ? 'w-10 justify-center px-2' : 'max-w-[210px] min-w-[120px] flex-1 px-2.5'
        } ${
          isActive
            ? 'bg-white text-slate-800 border-slate-200 shadow-sm z-10'
            : 'bg-slate-100/70 hover:bg-white/80 text-slate-600 border-transparent hover:border-slate-200'
        } ${
          tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED' ? 'opacity-90' : ''
        }`}
        title={`${tab.title || tab.url} (${tab.state.toLowerCase()})`}
      >
        {/* State dot indicator */}
        <div className="flex-shrink-0 mr-1.5 flex items-center justify-center">
          {renderStateBadge()}
        </div>

        {/* Tab Favicon or Globe */}
        <div className="flex-shrink-0 mr-2 flex items-center justify-center w-3.5 h-3.5">
          {tab.loading ? (
            <RefreshCw className="w-3 h-3 text-sky-500 animate-spin" />
          ) : tab.favicon ? (
            <img
              src={tab.favicon}
              alt=""
              className="w-3.5 h-3.5 object-contain"
              onError={(e) => {
                // Fallback to globe icon on error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Globe className="w-3 h-3 text-slate-400" />
          )}
        </div>

        {/* Title */}
        {!tab.pinned && (
          <span
            className={`truncate flex-1 font-medium ${
              tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED'
                ? 'text-slate-500 italic'
                : ''
            }`}
          >
            {tab.title || (tab.url === 'orca://newtab' ? 'New Tab' : tab.url)}
          </span>
        )}

        {/* Audio active indicator */}
        {tab.audioActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="flex-shrink-0 p-0.5 ml-1 text-sky-600 hover:text-sky-800 rounded"
            title={tab.muted ? 'Unmute' : 'Mute tab'}
          >
            {tab.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 animate-pulse" />}
          </button>
        )}

        {/* Pin icon */}
        {tab.pinned && (
          <Pin className="w-2.5 h-2.5 text-slate-400" />
        )}

        {/* Close Button */}
        {!tab.pinned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(e);
            }}
            className={`flex-shrink-0 ml-1.5 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Close Tab (Ctrl+W)"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={closeContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              closeContextMenu();
            }}
          />
          <div
            className="fixed z-50 bg-white/95 backdrop-blur-md rounded-xl shadow-orca-lg border border-slate-200 py-1.5 min-w-[180px] text-xs font-medium text-slate-700 animate-scale-in"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 190), top: contextMenu.y + 4 }}
          >
            {tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED' ? (
              <button
                onClick={() => {
                  onRestore();
                  closeContextMenu();
                }}
                className="w-full px-3 py-1.5 text-left flex items-center space-x-2 hover:bg-sky-50 text-sky-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Restore Tab (Surface)</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onSuspend();
                    closeContextMenu();
                  }}
                  disabled={isActive}
                  className={`w-full px-3 py-1.5 text-left flex items-center space-x-2 ${
                    isActive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-50 text-indigo-700'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Suspend Tab (Deep)</span>
                </button>
                <button
                  onClick={() => {
                    onHibernate();
                    closeContextMenu();
                  }}
                  disabled={isActive}
                  className={`w-full px-3 py-1.5 text-left flex items-center space-x-2 ${
                    isActive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hibernate Tab (Abyss)</span>
                </button>
              </>
            )}

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={() => {
                onTogglePin();
                closeContextMenu();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center space-x-2 hover:bg-slate-50"
            >
              <Pin className="w-3.5 h-3.5 text-slate-500" />
              <span>{tab.pinned ? 'Unpin Tab' : 'Pin Tab'}</span>
            </button>

            <button
              onClick={() => {
                onDuplicate();
                closeContextMenu();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center space-x-2 hover:bg-slate-50"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplicate Tab</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={(e) => {
                onClose(e);
                closeContextMenu();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center space-x-2 hover:bg-rose-50 text-rose-600"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Tab</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};
