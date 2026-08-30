import React, { useState, useEffect, useRef } from 'react';
import { Tab, Bookmark, Workspace } from '../../../../shared/types';
import { WorkspaceSelector } from '../WorkspaceBar/WorkspaceSelector';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X,
  Lock,
  Star,
  Layers,
  Activity,
  Download,
  Clock,
  Settings,
  Search,
  Globe,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface NavigationBarProps {
  activeTab?: Tab;
  bookmarks: Bookmark[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onStop: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleBookmark: () => void;
  onSetZoom: (zoomLevel: number) => void;
  onSwitchWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, color?: string, icon?: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onOpenMemoryCenter: () => void;
  onOpenTabLibrary: () => void;
  onOpenBookmarks: () => void;
  onOpenHistory: () => void;
  onOpenDownloads: () => void;
  onOpenSettings: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  bookmarks,
  workspaces,
  activeWorkspaceId,
  onNavigate,
  onReload,
  onStop,
  onGoBack,
  onGoForward,
  onToggleBookmark,
  onSetZoom,
  onSwitchWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
  onOpenMemoryCenter,
  onOpenTabLibrary,
  onOpenBookmarks,
  onOpenHistory,
  onOpenDownloads,
  onOpenSettings,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync address input when active tab changes or navigates
  useEffect(() => {
    if (!isFocused && activeTab) {
      const displayUrl = activeTab.url === 'orca://newtab' ? '' : activeTab.url;
      setInputValue(displayUrl);
    }
  }, [activeTab?.url, isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const nextUrl = inputValue.trim();
      console.log('[NavigationBar] submit:', nextUrl);
      inputRef.current?.blur();
      onNavigate(nextUrl);
    } else if (e.key === 'Escape') {
      setInputValue(activeTab?.url === 'orca://newtab' ? '' : (activeTab?.url || ''));
      inputRef.current?.blur();
    }
  };

  const isBookmarked = activeTab && bookmarks.some((b) => b.url === activeTab.url);
  const isHttps = activeTab?.url.startsWith('https://');

  return (
    <div
      className="flex items-center h-11 px-3 bg-[var(--surface)] border-b border-[var(--border)] gap-2 z-20"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Navigation Buttons: Back, Forward, Reload */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        <button
          onClick={onGoBack}
          disabled={!activeTab?.canGoBack}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTab?.canGoBack
              ? 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
          }`}
          title="Back (Alt+Left)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onGoForward}
          disabled={!activeTab?.canGoForward}
          className={`p-1.5 rounded-lg transition-colors ${
            activeTab?.canGoForward
              ? 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
          }`}
          title="Forward (Alt+Right)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={activeTab?.loading ? onStop : onReload}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors"
          title={activeTab?.loading ? 'Stop loading (Esc)' : 'Reload (Ctrl+R)'}
        >
          {activeTab?.loading ? (
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <RotateCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Omnibox / Search & Address Bar */}
      <div
        className={`flex items-center flex-1 h-8 px-3 rounded-full border transition-all duration-200 ${
          isFocused
            ? 'bg-[var(--surface)] border-[var(--accent)] ring-2 ring-[var(--accent-border)] shadow-sm'
            : 'bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)]'
        }`}
      >
        {/* Security / Protocol Icon */}
        <div className="flex-shrink-0 mr-2 flex items-center">
          {activeTab?.url.startsWith('orca://') ? (
            <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
          ) : isHttps ? (
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder="Search with Google or enter URL"
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            inputRef.current?.select();
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs font-normal text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none select-text"
        />

        {/* Bookmark star */}
        <button
          onClick={onToggleBookmark}
          className="flex-shrink-0 p-1 rounded hover:bg-[var(--surface-hover)] transition-colors ml-1"
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this Tab'}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              isBookmarked
                ? 'text-amber-500 fill-amber-500'
                : 'text-[var(--text-muted)] hover:text-amber-500'
            }`}
          />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="hidden lg:flex items-center px-1 border-r border-[var(--border)]">
        <WorkspaceSelector
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSwitchWorkspace={onSwitchWorkspace}
          onCreateWorkspace={onCreateWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
        />
      </div>

      {/* Action Buttons: Tab Library, Memory Center, Downloads, History, Bookmarks, Settings */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        <button
          onClick={onOpenTabLibrary}
          className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
          title="Tab Library (Surface, Shallow, Deep, Abyss)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Library</span>
        </button>

        <button
          onClick={onOpenMemoryCenter}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--accent)] hover:opacity-80 transition-colors"
          title="Memory Center & Diagnostics"
        >
          <Activity className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenDownloads}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Downloads"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenBookmarks}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Bookmarks"
        >
          <Star className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenHistory}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="History"
        >
          <Clock className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
