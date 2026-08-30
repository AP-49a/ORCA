import React, { useState } from 'react';
import { Bookmark, HistoryItem, MemoryStats, Workspace } from '../../../../shared/types';
import { OrcaLogo } from '../Icons/OrcaLogo';
import {
  Search,
  Globe,
  ArrowRight,
  Sparkles,
  Waves,
  Folder,
  Compass,
  BookOpen,
  Code2,
  Clock,
  Zap,
  ExternalLink,
} from 'lucide-react';

interface NewTabPageProps {
  bookmarks: Bookmark[];
  history: HistoryItem[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  memoryStats: MemoryStats;
  onNavigate: (url: string) => void;
  onSwitchWorkspace: (id: string) => void;
  onOpenMemoryCenter: () => void;
}

export const NewTabPage: React.FC<NewTabPageProps> = ({
  bookmarks,
  history,
  workspaces,
  activeWorkspaceId,
  memoryStats,
  onNavigate,
  onSwitchWorkspace,
  onOpenMemoryCenter,
}) => {
  const [query, setQuery] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onNavigate(query.trim());
    }
  };

  const speedDialShortcuts = [
    { title: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'W' },
    { title: 'GitHub', url: 'https://github.com', icon: 'GH' },
    { title: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: 'DDG' },
    { title: 'ArXiv', url: 'https://arxiv.org', icon: 'AX' },
    { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'HN' },
    { title: 'Reddit', url: 'https://reddit.com', icon: 'RD' },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-116px)] overflow-y-auto bg-[var(--bg-primary)] flex flex-col items-center px-6 py-12 select-none">
      {/* Background ambient subtle ocean gradients */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-3xl pointer-events-none -z-10"
        style={{ background: 'var(--gradient-ambient)' }}
      />

      {/* Main Header Container */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center mt-4">
        {/* Orca Mark */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] shadow-[var(--modal-shadow)] border border-[var(--border)] flex items-center justify-center mb-5 hover:scale-105 transition-transform duration-300">
          <OrcaLogo className="w-10 h-10" />
        </div>

        {/* Greeting & Brand */}
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
          {getGreeting()}
        </h1>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-8">
          More tabs. Less memory.
        </p>

        {/* Central Search / Omnibox */}
        <form
          onSubmit={handleSearch}
          className="w-full relative flex items-center shadow-[var(--modal-shadow)] rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-border)] transition-all p-1.5 mb-10"
        >
          <div className="pl-4 pr-2 text-[var(--text-muted)]">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the web or enter address..."
            className="flex-1 py-3 px-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] bg-transparent outline-none select-text"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <span>Browse</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Speed Dial / Favorites */}
        <div className="w-full mb-10">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Favorites
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {speedDialShortcuts.map((item) => (
              <button
                key={item.url}
                onClick={() => onNavigate(item.url)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent-border)] transition-all group shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--surface-subtle)] group-hover:bg-[var(--accent-subtle)] flex items-center justify-center font-mono font-bold text-xs text-[var(--text-primary)] group-hover:text-[var(--accent)] mb-2 transition-colors">
                  {item.icon}
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate w-full text-center">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Dual Grid: Workspaces Overview + Live Memory Engine Snapshot */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Workspaces Card */}
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                <Folder className="w-3.5 h-3.5" />
                <span>Workspaces</span>
              </span>
            </div>
            <div className="space-y-1.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => onSwitchWorkspace(ws.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    ws.id === activeWorkspaceId
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                      : 'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ws.color }}
                    />
                    <span>{ws.name}</span>
                  </div>
                  {ws.id === activeWorkspaceId && (
                    <span className="text-[10px] font-semibold text-[var(--accent)] uppercase">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Memory Engine Snapshot Card */}
          <div
            onClick={onOpenMemoryCenter}
            className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)] shadow-xs hover:border-[var(--accent-border)] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center space-x-1.5">
                <Waves className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Memory Engine</span>
              </span>
              <ExternalLink className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                <div className="text-[11px] text-[var(--text-muted)]">Browser RAM</div>
                <div className="text-base font-bold text-[var(--text-primary)] font-mono">
                  {memoryStats.browserTotalMB} MB
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent-border)]">
                <div className="text-[11px] text-[var(--accent)]">Estimated Saved</div>
                <div className="text-base font-bold text-[var(--accent)] font-mono">
                  +{memoryStats.estimatedSavingsMB} MB
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-[var(--text-secondary)]">{memoryStats.tabsByState.active} Active</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[var(--text-secondary)]">{memoryStats.tabsByState.suspended} Suspended</span>
                </span>
              </div>
              <span className="font-medium text-[var(--accent)] group-hover:underline">Details &rarr;</span>
            </div>
          </div>
        </div>

        {/* Recently Visited */}
        {history.length > 0 && (
          <div className="w-full mt-6 text-left">
            <div className="flex items-center space-x-1.5 mb-2 px-1 text-[var(--text-muted)]">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Recently Visited
              </span>
            </div>
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-2 shadow-xs divide-y divide-[var(--border-subtle)]">
              {history.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.url)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--surface-hover)] rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center space-x-2.5 truncate mr-4">
                    <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {item.title || item.url}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] flex-shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
