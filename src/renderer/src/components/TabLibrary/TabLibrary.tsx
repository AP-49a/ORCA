import React, { useState } from 'react';
import { Tab, TabState, Workspace } from '../../../../shared/types';
import {
  X,
  Search,
  Layers,
  Waves,
  Moon,
  Sparkles,
  ExternalLink,
  Trash2,
  Filter,
  ArrowUpDown,
  Globe,
} from 'lucide-react';

interface TabLibraryProps {
  tabs: Tab[];
  workspaces: Workspace[];
  activeTabId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (id: string) => void;
  onSuspendTab: (id: string) => void;
  onHibernateTab: (id: string) => void;
  onRestoreTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export const TabLibrary: React.FC<TabLibraryProps> = ({
  tabs,
  workspaces,
  activeTabId,
  isOpen,
  onClose,
  onSelectTab,
  onSuspendTab,
  onHibernateTab,
  onRestoreTab,
  onCloseTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'accessed' | 'memory' | 'title'>('accessed');

  if (!isOpen) return null;

  // Filter tabs
  const filteredTabs = tabs.filter((t) => {
    // Search query match
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.url.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Tier match
    if (selectedTier !== 'ALL' && t.state !== selectedTier) {
      return false;
    }

    // Workspace match
    if (selectedWorkspace !== 'ALL' && t.workspaceId !== selectedWorkspace) {
      return false;
    }

    return true;
  });

  // Sort tabs
  const sortedTabs = [...filteredTabs].sort((a, b) => {
    if (sortBy === 'accessed') {
      return b.lastAccessedAt - a.lastAccessedAt;
    } else if (sortBy === 'memory') {
      return (b.estimatedMemoryMB || 0) - (a.estimatedMemoryMB || 0);
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const getWorkspaceName = (wsId: string) => {
    const ws = workspaces.find((w) => w.id === wsId);
    return ws?.name || 'Personal';
  };

  const renderTierPill = (state: TabState) => {
    switch (state) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Surface</span>
          </span>
        );
      case 'IDLE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span>Shallow</span>
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Deep</span>
          </span>
        );
      case 'HIBERNATED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-[var(--text-secondary)] border border-slate-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Abyss</span>
          </span>
        );
    }
  };

  return (
    <div className="orca-modal-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="orca-modal-card max-w-4xl p-6 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">TAB LIBRARY</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Ocean depth index of all open, suspended, and hibernated tabs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls: Search, Tier Filter, Workspace Filter, Sort */}
        <div className="py-4 flex flex-wrap gap-2.5 items-center justify-between border-b border-[var(--border-subtle)] flex-shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tabs by title, domain, or URL..."
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] focus:bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-all select-text"
            />
          </div>

          {/* Tier Filter */}
          <div className="flex items-center space-x-1 bg-[var(--surface-subtle)] p-0.5 rounded-xl text-xs font-semibold border border-[var(--border)]">
            {['ALL', 'ACTIVE', 'IDLE', 'SUSPENDED', 'HIBERNATED'].map((tier) => {
              const label =
                tier === 'ALL'
                  ? 'All'
                  : tier === 'ACTIVE'
                  ? 'Surface'
                  : tier === 'IDLE'
                  ? 'Shallow'
                  : tier === 'SUSPENDED'
                  ? 'Deep'
                  : 'Abyss';
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedTier === tier
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Workspace Filter */}
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="px-3 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium outline-none focus:border-[var(--accent)]"
          >
            <option value="ALL">All Workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-medium outline-none focus:border-[var(--accent)]"
          >
            <option value="accessed">Last Accessed</option>
            <option value="memory">RAM Footprint</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>

        {/* Tab Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)] py-1 pr-1">
          {sortedTabs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-xs">
              No tabs found matching your filters.
            </div>
          ) : (
            sortedTabs.map((tab) => {
              const isCurrent = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  className="flex items-center justify-between py-2.5 px-3 hover:bg-[var(--surface-hover)] rounded-xl transition-colors group"
                >
                  {/* Left: Favicon & Title */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0 mr-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--surface-subtle)] flex items-center justify-center">
                      {tab.favicon ? (
                        <img
                          src={tab.favicon}
                          alt=""
                          className="w-4 h-4 object-contain"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {tab.title || tab.url}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded uppercase">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-[var(--text-muted)] mt-0.5">
                        <span className="truncate max-w-[260px]">{tab.url}</span>
                        <span>•</span>
                        <span>{getWorkspaceName(tab.workspaceId)}</span>
                        <span>•</span>
                        <span className="font-mono">
                          {tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED'
                            ? '~0 MB active'
                            : `~${tab.estimatedMemoryMB || 180} MB`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Ocean Tier Badge */}
                  <div className="flex-shrink-0 mr-4">{renderTierPill(tab.state)}</div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED' ? (
                      <button
                        onClick={() => {
                          onRestoreTab(tab.id);
                          onSelectTab(tab.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-[var(--accent-subtle)] hover:opacity-90 text-[var(--accent)] text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                        title="Restore to Surface"
                      >
                        <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            onSelectTab(tab.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-semibold rounded-lg transition-colors"
                        >
                          Switch
                        </button>
                        <button
                          onClick={() => onSuspendTab(tab.id)}
                          disabled={isCurrent}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCurrent
                              ? 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                              : 'text-indigo-400 hover:bg-indigo-500/10'
                          }`}
                          title="Suspend (Deep)"
                        >
                          <Waves className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onHibernateTab(tab.id)}
                          disabled={isCurrent}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCurrent
                              ? 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                          }`}
                          title="Hibernate (Abyss)"
                        >
                          <Moon className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onCloseTab(tab.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Close Tab"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] flex-shrink-0">
          <span>Showing {sortedTabs.length} of {tabs.length} tabs</span>
          <span className="font-mono text-[11px] text-[var(--accent)] font-medium">
            SURFACE • SHALLOW • DEEP • ABYSS
          </span>
        </div>
      </div>
    </div>
  );
};
